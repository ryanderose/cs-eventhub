import { Buffer } from 'node:buffer';
import { canonicalizePageDoc, computePlanHash, PageDoc, PageDocSchema, withPlanHash } from '@events-hub/page-schema';
import type { FilterDSL } from '@events-hub/ai-interpreter';
import { CitySparkClient, EventProviderV21, EventV21, ProviderFilters } from '@events-hub/data-providers';

export type ComposeInput = {
  tenantId: string;
  intent: 'search' | 'qa' | 'navigate';
  filters: FilterDSL;
  planHash?: string;
  locale?: string;
  streaming?: boolean;
};

export type ComposeResult = {
  page: PageDoc;
  composerVersion: string;
  budgetMs: number;
  fallbackTriggered: boolean;
};

const DEFAULT_COMPOSER_VERSION = 'composer/1.5.0';

const telemetry = {
  record(event: string, attributes?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'test') return;
    if (process.env.DEBUG?.includes('composer')) {
      console.info(`[telemetry] ${event}`, attributes ?? {});
    }
  }
};

let defaultProvider: EventProviderV21 | null = null;

function getProvider(): EventProviderV21 {
  if (!defaultProvider) {
    defaultProvider = new CitySparkClient({ burst: 10, minute: 240 }, telemetry);
  }
  return defaultProvider;
}

function providerFiltersFromDsl(filters: FilterDSL): ProviderFilters {
  const providerFilters: ProviderFilters = {};
  if (filters.categories?.length) {
    providerFilters.category = filters.categories[0];
  }
  if (filters.dateRange?.from || filters.dateRange?.preset) {
    providerFilters.date = filters.dateRange.from ?? filters.dateRange.preset;
  }
  if (filters.neighborhoods?.length) {
    providerFilters.neighborhood = filters.neighborhoods.join(',');
  }
  if (filters.familyFriendly) {
    providerFilters.family = true;
  }
  if (filters.accessibility?.length) {
    providerFilters.accessibility = filters.accessibility.join(',');
  }
  return providerFilters;
}

function enforceDiversity(events: EventV21[]): EventV21[] {
  const venueCount = new Map<string, number>();
  const dayCount = new Map<string, number>();
  const categoryCount = new Map<string, number>();
  const result: EventV21[] = [];

  for (const event of events) {
    const dateKey = event.startDate.slice(0, 10);
    const venueKey = event.venue.id;
    const categoryKey = event.categories[0] ?? 'general';

    const venue = (venueCount.get(venueKey) ?? 0) + 1;
    const day = (dayCount.get(dateKey) ?? 0) + 1;
    const category = (categoryCount.get(categoryKey) ?? 0) + 1;

    const total = result.length + 1;
    const categoryShare = (category / total) * 100;

    if (venue > 2 || day > 3 || categoryShare > 60) {
      continue;
    }

    venueCount.set(venueKey, venue);
    dayCount.set(dateKey, day);
    categoryCount.set(categoryKey, category);
    result.push(event);
  }

  return result;
}

function toEventSummary(event: EventV21) {
  const { description: _description, url: _url, facets: _facets, rank: _rank, relevance: _relevance, editorialBoost: _boost, ...rest } = event;
  return rest;
}

function heroItemsFromEvents(events: EventV21[]) {
  return events.slice(0, 4).map((event) => ({
    id: event.id,
    headline: event.name,
    subhead: event.venue.name,
    image: {
      url: event.heroImage?.url ?? `https://images.example.com/${event.id}.jpg`,
      alt: event.heroImage?.alt ?? event.name
    },
    cta: { label: 'View details', href: event.url },
    eventRef: event.canonicalId
  }));
}

function railFromEvents(events: EventV21[], title: string) {
  return {
    title,
    events: events.map((event) => toEventSummary(event)),
    layout: 'rail' as const,
    streaming: { mode: 'initial' as const },
    diversity: { venue: 2, date: 3, category: 60 }
  };
}

function buildMapGrid(events: EventV21[], locale: string, timestamp: string) {
  const source = events.length ? events : [buildFallbackEvent(locale, timestamp)];
  return {
    events: source.map((event, index) => ({
      ...toEventSummary(event),
      map: {
        lat: event.venue.geo?.lat ?? 0,
        lng: event.venue.geo?.lng ?? 0
      },
      listIndex: index
    })),
    viewport: {
      center: {
        lat: source[0]?.venue.geo?.lat ?? 0,
        lng: source[0]?.venue.geo?.lng ?? 0
      },
      zoom: 12
    },
    parityChecksum: computePlanHash(
      withPlanHash({
        id: 'parity',
        title: 'checksum',
        path: '/',
        tenantId: 'parity',
        updatedAt: new Date().toISOString(),
        version: '1.5',
        blocks: [],
        meta: { cacheTags: [], flags: {}, locale: 'en-US', planHash: undefined, composerVersion: undefined, generatedAt: undefined },
        planCursors: []
      })
    )
  };
}

function buildSeoBlock(type: 'seo-collection' | 'seo-detail', events: EventV21[]) {
  const criticalCss = '.events-hub{display:block;}';
  const hashedCss = `sha256-${Buffer.from(criticalCss).toString('base64')}`;
  const html = `<section class="events-hub" data-type="${type}">${events
    .slice(0, 5)
    .map((event) => `<article><h2>${event.name}</h2><p>${event.venue.name}</p></article>`)
    .join('')}</section>`;
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type === 'seo-detail' ? 'Event' : 'ItemList',
    name: `${events[0]?.name ?? 'Events'}`
  });
  return { html, jsonLd, criticalCss, hashedCss };
}

async function loadEvents(provider: EventProviderV21, filters: ProviderFilters, tenantId: string, planHash?: string) {
  const { events } = await provider.search(filters, { tenantId, planHash, composerVersion: DEFAULT_COMPOSER_VERSION });
  return enforceDiversity(events);
}

function buildFallbackEvent(locale: string, timestamp: string): EventV21 {
  return {
    id: 'placeholder',
    canonicalId: 'placeholder',
    name: 'No events available',
    venue: { id: 'none', name: 'TBD' },
    startDate: timestamp,
    categories: ['general'],
    source: { provider: 'cityspark', id: 'placeholder' },
    locale,
    timezone: 'UTC',
    heroImage: undefined,
    price: { min: 0, max: 0, currency: 'USD' },
    distanceKm: 0,
    whyGo: ['Check back soon'],
    ticketUrl: undefined,
    description: 'No curated events were found for the selected filters.',
    url: '#',
    facets: { categories: ['general'], neighborhoods: [], tags: [] },
    rank: 0,
    relevance: 0
  };
}

export async function compose(input: ComposeInput): Promise<ComposeResult> {
  const started = Date.now();
  const provider = getProvider();
  const providerFilters = providerFiltersFromDsl(input.filters);
  const events = await loadEvents(provider, providerFilters, input.tenantId, input.planHash);
  const fallbackTriggered = events.length === 0;
  const nowIso = new Date().toISOString();
  const path = input.intent === 'navigate' ? '/map' : '/plan';

  const firstEvent = events[0];

  const page: PageDoc = PageDocSchema.parse({
    id: `${input.tenantId}-${computePlanHash(
      withPlanHash({
        id: 'seed',
        title: 'seed',
        path: '/',
        tenantId: input.tenantId,
        updatedAt: nowIso,
        version: '1.5',
        blocks: [],
        meta: { cacheTags: [], flags: {}, locale: input.locale ?? 'en-US', planHash: undefined, composerVersion: undefined, generatedAt: undefined },
        planCursors: []
      })
    )}`,
    title: `${input.tenantId} events`,
    description: `Curated events for ${input.tenantId}`,
    path,
    tenantId: input.tenantId,
    updatedAt: nowIso,
    version: '1.5',
    blocks: [
      {
        id: 'ai-dock',
        key: 'ai-dock',
        kind: 'ai-dock',
        version: '1.5',
        order: 0,
        layout: { fullWidth: true },
        data: {
          entryPointLabel: 'Plan with AI',
          welcomeMessages: [],
          conversationId: `${input.tenantId}-${Date.now()}`,
          allowedScopes: ['global', 'event']
        }
      },
      {
        id: 'filter-bar',
        key: 'filter-bar',
        kind: 'filter-bar',
        version: '1.5',
        order: 1,
        layout: { fullWidth: true },
        data: {
          facets: [
            {
              id: 'date',
              label: 'Date',
              type: 'date',
              options: [
                { id: 'today', label: 'Today' },
                { id: 'weekend', label: 'This weekend' }
              ]
            },
            {
              id: 'category',
              label: 'Category',
              type: 'category',
              options: [{ id: input.filters.categories?.[0] ?? 'all', label: input.filters.categories?.[0] ?? 'All' }]
            }
          ],
          active: {
            date: input.filters.dateRange?.preset ?? 'today',
            category: input.filters.categories?.[0] ?? 'all'
          },
          sortOptions: [
            { id: 'rank', label: 'Recommended', default: true },
            { id: 'startTimeAsc', label: 'Soonest' },
            { id: 'priceAsc', label: 'Lowest price' }
          ],
          flags: { showReset: true, floating: false }
        }
      },
      {
        id: 'hero-carousel',
        key: 'hero-carousel',
        kind: 'hero-carousel',
        version: '1.5',
        order: 2,
        layout: { fullWidth: true },
        data: {
          items: heroItemsFromEvents(events),
          autoplayMs: 8000
        }
      },
      {
        id: 'collection-rail',
        key: 'collection-rail-top',
        kind: 'collection-rail',
        version: '1.5',
        order: 3,
        layout: { fullWidth: true },
        data: railFromEvents(events.slice(0, 8), 'Top picks')
      },
      {
        id: 'microcalendar',
        key: 'microcalendar',
        kind: 'microcalendar',
        version: '1.5',
        order: 4,
        layout: { fullWidth: true },
        data: {
          timezone: 'America/Los_Angeles',
          days: events.slice(0, 7).map((event) => ({
            date: event.startDate.slice(0, 10),
            events: [
              {
                id: event.id,
                canonicalId: event.canonicalId,
                name: event.name,
                startDate: event.startDate
              }
            ]
          }))
        }
      },
      {
        id: 'event-detail',
        key: 'event-detail',
        kind: 'event-detail',
        version: '1.5',
        order: 5,
        layout: { fullWidth: true },
        data: {
          event:
            firstEvent ?? buildFallbackEvent(input.locale ?? 'en-US', nowIso),
          layout: 'modal'
        }
      },
      {
        id: 'seo-collection',
        key: 'seo-collection',
        kind: 'seo-collection',
        version: '1.5',
        order: 6,
        layout: { fullWidth: true },
        data: buildSeoBlock('seo-collection', events)
      },
      {
        id: 'seo-detail',
        key: 'seo-detail',
        kind: 'seo-detail',
        version: '1.5',
        order: 7,
        layout: { fullWidth: true },
        data: buildSeoBlock('seo-detail', firstEvent ? [firstEvent] : events)
      },
      {
        id: 'map-grid',
        key: 'map-grid',
        kind: 'map-grid',
        version: '1.5',
        order: 8,
        layout: { fullWidth: true },
        data: buildMapGrid(events, input.locale ?? 'en-US', nowIso)
      },
      {
        id: 'promo-slot',
        key: 'promo-slot',
        kind: 'promo-slot',
        version: '1.5',
        order: 9,
        layout: { fullWidth: true },
        data: {
          slotId: `${input.tenantId}-homepage`,
          advertiser: 'House Promo',
          disclosure: 'Sponsored',
          measurement: {},
          safety: { blockedCategories: [], brandSuitability: 'strict' }
        }
      },
      {
        id: 'event-mini-chat',
        key: 'event-mini-chat',
        kind: 'event-mini-chat',
        version: '1.5',
        order: 10,
        layout: { fullWidth: true },
        data: {
          eventId: firstEvent?.canonicalId ?? 'placeholder',
          conversationId: `${input.tenantId}-${Date.now()}-event`,
          starterQuestions: ['What makes this event special?'],
          availability: { requiresConsent: true, personalization: true }
        }
      }
    ],
    meta: {
      locale: input.locale ?? 'en-US',
      cacheTags: [input.tenantId],
      flags: { streaming: Boolean(input.streaming) },
      generatedAt: nowIso
    },
    planCursors: [
      {
        blockKey: 'collection-rail-top',
        cursor: events.length > 8 ? events[8].canonicalId : 'done',
        exhausted: events.length <= 8
      }
    ]
  });

  const normalized = canonicalizePageDoc(page);
  const hashed = withPlanHash({ ...normalized, meta: { ...normalized.meta, composerVersion: DEFAULT_COMPOSER_VERSION } });
  const budgetMs = Date.now() - started;

  return {
    page: hashed,
    composerVersion: DEFAULT_COMPOSER_VERSION,
    budgetMs,
    fallbackTriggered
  };
}
