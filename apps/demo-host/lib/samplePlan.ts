import type { PageDoc } from '@events-hub/page-schema';

type SampleEvent = {
  id: string;
  canonicalId: string;
  name: string;
  venue: { id: string; name: string };
  startDate: string;
  categories: string[];
  source: { provider: string; id: string };
  locale: string;
  timezone: string;
  map?: { lat: number; lng: number };
  listIndex?: number;
  description?: string;
};

function createSampleEvents(nowIso: string): SampleEvent[] {
  return [
    {
      id: 'evt-1',
      canonicalId: 'evt-1',
      name: 'Waterfront Concert Series',
      venue: { id: 'venue-1', name: 'Pier Theater' },
      startDate: nowIso,
      categories: ['music'],
      source: { provider: 'demo', id: 'evt-1' },
      locale: 'en-US',
      timezone: 'UTC'
    },
    {
      id: 'evt-2',
      canonicalId: 'evt-2',
      name: 'Saturday Farmers Market',
      venue: { id: 'venue-2', name: 'Town Square' },
      startDate: nowIso,
      categories: ['community'],
      source: { provider: 'demo', id: 'evt-2' },
      locale: 'en-US',
      timezone: 'UTC'
    }
  ];
}

export function createSamplePlan(): PageDoc {
  const nowIso = new Date().toISOString();
  const events = createSampleEvents(nowIso);
  return {
    id: 'demo',
    title: 'Demo Page',
    path: '/demo',
    description: 'Sample plan rendered by the embed SDK',
    blocks: [
      {
        id: 'filter-bar',
        key: 'filter-bar',
        kind: 'filter-bar',
        version: '1.5',
        order: 0,
        layout: { fullWidth: true },
        data: {
          facets: [
            {
              id: 'date',
              label: 'Date',
              type: 'date',
              multi: false,
              options: [
                { id: 'today', label: 'Today' },
                { id: 'weekend', label: 'This weekend' }
              ]
            },
            {
              id: 'category',
              label: 'Category',
              type: 'category',
              multi: false,
              options: [
                { id: 'music', label: 'Music' },
                { id: 'community', label: 'Community' }
              ]
            }
          ],
          active: { date: 'today', category: 'all' },
          sortOptions: [
            { id: 'rank', label: 'Recommended', default: true },
            { id: 'startTimeAsc', label: 'Soonest' }
          ],
          flags: { showReset: true, floating: false }
        }
      },
      {
        id: 'hero-carousel',
        key: 'hero',
        kind: 'hero-carousel',
        version: '1.5',
        order: 1,
        layout: { fullWidth: true },
        data: {
          items: [
            {
              id: 'hero-1',
              headline: 'Weekend highlights',
              subhead: 'Top picks around town',
              image: { url: 'https://picsum.photos/seed/hero1/800/400', alt: 'Weekend highlights' },
              cta: { label: 'See more', href: '#' }
            }
          ],
          autoplayMs: 8000
        }
      },
      {
        id: 'rail-1',
        key: 'rail-1',
        kind: 'collection-rail',
        version: '1.5',
        order: 2,
        layout: { fullWidth: true },
        data: {
          title: 'Top picks',
          events: events as never,
          layout: 'rail',
          streaming: { mode: 'initial' }
        }
      },
      {
        id: 'map',
        key: 'map',
        kind: 'map-grid',
        version: '1.5',
        order: 3,
        layout: { fullWidth: true },
        data: {
          events: [
            { ...events[0], map: { lat: 47.607, lng: -122.335 }, listIndex: 0 },
            { ...events[1], map: { lat: 47.61, lng: -122.33 }, listIndex: 1 }
          ] as never,
          viewport: { center: { lat: 47.608, lng: -122.335 }, zoom: 12 },
          parityChecksum: 'demo'
        }
      },
      {
        id: 'promo',
        key: 'promo',
        kind: 'promo-slot',
        version: '1.5',
        order: 4,
        layout: { fullWidth: true },
        data: {
          slotId: 'demo-home',
          advertiser: 'House Promo',
          disclosure: 'Sponsored',
          measurement: {},
          safety: { blockedCategories: [], brandSuitability: 'strict' }
        }
      },
      {
        id: 'detail',
        key: 'detail',
        kind: 'event-detail',
        version: '1.5',
        order: 5,
        layout: { fullWidth: true },
        data: {
          event: { ...events[0], description: 'Outdoor concert by the waterfront.' } as never,
          layout: 'modal'
        }
      },
      {
        id: 'mini-chat',
        key: 'mini-chat',
        kind: 'event-mini-chat',
        version: '1.5',
        order: 6,
        layout: { fullWidth: true },
        data: {
          eventId: 'evt-1',
          conversationId: 'demo-convo',
          starterQuestions: ['What makes this event special?'],
          availability: { requiresConsent: true, personalization: true }
        }
      }
    ],
    updatedAt: nowIso,
    version: '1.5',
    tenantId: 'demo-tenant',
    meta: {
      planHash: 'sample-plan',
      composerVersion: 'demo',
      generatedAt: nowIso,
      locale: 'en-US',
      cacheTags: [],
      flags: {}
    },
    planCursors: []
  };
}
