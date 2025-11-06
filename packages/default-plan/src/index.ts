import type { BlockInstance, PageDoc } from '@events-hub/page-schema';

export type DefaultBlockTemplate = {
  key: string;
  id: string;
  kind: BlockInstance['kind'];
  defaultOrder: number;
  title: string;
  analyticsLabel: string;
};

export type DefaultBlockAllowlistEntry = Pick<DefaultBlockTemplate, 'key' | 'id' | 'kind'>;

export type CreateDefaultDemoPlanOptions = {
  tenantId?: string;
  pageId?: string;
  title?: string;
  path?: string;
  description?: string;
  planHash?: string;
  now?: Date | string;
};

type DemoEvent = {
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

type BlockFactoryContext = {
  nowIso: string;
  events: DemoEvent[];
};

type BlockFactory = (context: BlockFactoryContext) => BlockInstance;

const DEFAULT_PLAN_ID = 'default-demo-page';
const DEFAULT_PLAN_TITLE = 'Demo Default Blocks';
const DEFAULT_PLAN_PATH = '/default';
const DEFAULT_PLAN_DESCRIPTION = 'Seeded default block ordering for admin preview.';
const DEFAULT_PLAN_HASH = 'default-plan-seed';
const DEFAULT_TENANT_ID = 'demo';
const DEFAULT_PLAN_TIMESTAMP = '2025-02-15T00:00:00.000Z';

const BLOCK_UUIDS = {
  filterBar: '4d662d0e-9f87-4b21-9db3-4e9a5ec70ffb',
  hero: '17fcb4a3-ff9a-4e92-a9c8-7b8c21a7f4db',
  rail: 'c3bba4af-f295-45d6-8f0c-366ac50f3bde',
  map: '8c921182-3a28-4b71-8af7-64cbea67276c',
  promo: '6d05128a-3415-4b05-83d0-59bb2085f5f8',
  detail: '6c0402b3-7bfe-4577-a05d-3cfd5e7b8aaf',
  miniChat: '9a0c5c3f-2d51-4f5a-9c85-d834cf89b9e9'
} as const;

function resolveTimestamp(value?: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return DEFAULT_PLAN_TIMESTAMP;
}

function createDemoEvents(nowIso: string): DemoEvent[] {
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

export const DEFAULT_BLOCK_TEMPLATES: ReadonlyArray<DefaultBlockTemplate> = [
  {
    key: 'filter-bar',
    id: BLOCK_UUIDS.filterBar,
    kind: 'filter-bar',
    defaultOrder: 0,
    title: 'Filter bar',
    analyticsLabel: 'Filter bar facets'
  },
  {
    key: 'hero',
    id: BLOCK_UUIDS.hero,
    kind: 'hero-carousel',
    defaultOrder: 1,
    title: 'Hero carousel',
    analyticsLabel: 'Hero highlights'
  },
  {
    key: 'rail-1',
    id: BLOCK_UUIDS.rail,
    kind: 'collection-rail',
    defaultOrder: 2,
    title: 'Collection rail',
    analyticsLabel: 'Featured events rail'
  },
  {
    key: 'map',
    id: BLOCK_UUIDS.map,
    kind: 'map-grid',
    defaultOrder: 3,
    title: 'Map grid',
    analyticsLabel: 'Map pins'
  },
  {
    key: 'promo',
    id: BLOCK_UUIDS.promo,
    kind: 'promo-slot',
    defaultOrder: 4,
    title: 'Promo slot',
    analyticsLabel: 'Sponsored placement'
  },
  {
    key: 'detail',
    id: BLOCK_UUIDS.detail,
    kind: 'event-detail',
    defaultOrder: 5,
    title: 'Event detail',
    analyticsLabel: 'Detail spotlight'
  },
  {
    key: 'mini-chat',
    id: BLOCK_UUIDS.miniChat,
    kind: 'event-mini-chat',
    defaultOrder: 6,
    title: 'Mini chat',
    analyticsLabel: 'Conversation starter'
  }
] as const;

const BLOCK_FACTORIES: Record<DefaultBlockTemplate['key'], BlockFactory> = {
  'filter-bar': ({ nowIso }) => ({
    id: BLOCK_UUIDS.filterBar,
    key: 'filter-bar',
    kind: 'filter-bar',
    version: '1.6',
    order: 0,
    layout: { fullWidth: true },
    analytics: {
      viewKey: 'default:filter-bar',
      surface: 'admin-default-plan',
      attributes: { label: 'Filter bar' }
    },
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
      flags: { showReset: true, floating: false },
      generatedAt: nowIso
    }
  }),
  hero: () => ({
    id: BLOCK_UUIDS.hero,
    key: 'hero',
    kind: 'hero-carousel',
    version: '1.6',
    order: 1,
    layout: { fullWidth: true },
    analytics: {
      viewKey: 'default:hero',
      surface: 'admin-default-plan',
      attributes: { label: 'Hero carousel' }
    },
    data: {
      items: [
        {
          id: 'hero-1',
          headline: 'Weekend highlights',
          subhead: 'Top picks around town',
          image: { url: 'https://picsum.photos/seed/hero1/800/400', alt: 'Weekend highlights' },
          cta: { label: 'See more', href: 'https://events.example.com/highlights' }
        }
      ],
      autoplayMs: 8000
    }
  }),
  'rail-1': ({ events }) => ({
    id: BLOCK_UUIDS.rail,
    key: 'rail-1',
    kind: 'collection-rail',
    version: '1.6',
    order: 2,
    layout: { fullWidth: true },
    analytics: {
      viewKey: 'default:rail-1',
      surface: 'admin-default-plan',
      attributes: { label: 'Featured events rail' }
    },
    data: {
      title: 'Top picks',
      events: events as never,
      layout: 'rail',
      streaming: { mode: 'initial' }
    }
  }),
  map: ({ events }) => ({
    id: BLOCK_UUIDS.map,
    key: 'map',
    kind: 'map-grid',
    version: '1.6',
    order: 3,
    layout: { fullWidth: true },
    analytics: {
      viewKey: 'default:map',
      surface: 'admin-default-plan',
      attributes: { label: 'Map grid' }
    },
    data: {
      events: [
        { ...events[0], map: { lat: 47.607, lng: -122.335 }, listIndex: 0 },
        { ...events[1], map: { lat: 47.61, lng: -122.33 }, listIndex: 1 }
      ] as never,
      viewport: { center: { lat: 47.608, lng: -122.335 }, zoom: 12 },
      parityChecksum: 'demo'
    }
  }),
  promo: () => ({
    id: BLOCK_UUIDS.promo,
    key: 'promo',
    kind: 'promo-slot',
    version: '1.6',
    order: 4,
    layout: { fullWidth: true },
    analytics: {
      viewKey: 'default:promo',
      surface: 'admin-default-plan',
      attributes: { label: 'Promo slot' }
    },
    data: {
      slotId: 'demo-home',
      advertiser: 'House Promo',
      disclosure: 'Sponsored',
      measurement: {},
      safety: { blockedCategories: [], brandSuitability: 'strict' }
    }
  }),
  detail: ({ events }) => ({
    id: BLOCK_UUIDS.detail,
    key: 'detail',
    kind: 'event-detail',
    version: '1.6',
    order: 5,
    layout: { fullWidth: true },
    analytics: {
      viewKey: 'default:detail',
      surface: 'admin-default-plan',
      attributes: { label: 'Event detail' }
    },
    data: {
      event: { ...events[0], description: 'Outdoor concert by the waterfront.' } as never,
      layout: 'modal'
    }
  }),
  'mini-chat': () => ({
    id: BLOCK_UUIDS.miniChat,
    key: 'mini-chat',
    kind: 'event-mini-chat',
    version: '1.6',
    order: 6,
    layout: { fullWidth: true },
    analytics: {
      viewKey: 'default:mini-chat',
      surface: 'admin-default-plan',
      attributes: { label: 'Mini chat' }
    },
    data: {
      eventId: 'evt-1',
      conversationId: 'demo-convo',
      starterQuestions: ['What makes this event special?'],
      availability: { requiresConsent: true, personalization: true }
    }
  })
};

function createDefaultBlocks(context: BlockFactoryContext): BlockInstance[] {
  return DEFAULT_BLOCK_TEMPLATES.map((template) => {
    const block = BLOCK_FACTORIES[template.key](context);
    return {
      ...block,
      order: template.defaultOrder
    };
  });
}

export function createDefaultDemoPlan(options?: CreateDefaultDemoPlanOptions): PageDoc {
  const nowIso = resolveTimestamp(options?.now);
  const events = createDemoEvents(nowIso);
  const tenantId = options?.tenantId?.trim() || DEFAULT_TENANT_ID;
  const blocks = createDefaultBlocks({ nowIso, events });

  return {
    id: options?.pageId ?? DEFAULT_PLAN_ID,
    title: options?.title ?? DEFAULT_PLAN_TITLE,
    path: options?.path ?? DEFAULT_PLAN_PATH,
    description: options?.description ?? DEFAULT_PLAN_DESCRIPTION,
    blocks,
    updatedAt: nowIso,
    version: '1.6',
    tenantId,
    meta: {
      planHash: options?.planHash ?? DEFAULT_PLAN_HASH,
      composerVersion: 'default-plan',
      generatedAt: nowIso,
      locale: 'en-US',
      cacheTags: [],
      flags: { seeded: true }
    },
    planCursors: []
  };
}

export function getDefaultBlockAllowlist(): ReadonlyArray<DefaultBlockAllowlistEntry> {
  return DEFAULT_BLOCK_TEMPLATES.map((template) => ({
    key: template.key,
    id: template.id,
    kind: template.kind
  }));
}

export function relabelBlock(block: BlockInstance): string {
  const data = (block as any).data ?? {};
  const firstItem = Array.isArray(data.items) && data.items.length > 0 ? data.items[0] : null;
  const labelCandidates = [
    data.title,
    data.headline,
    data.name,
    firstItem?.headline,
    firstItem?.title,
    data.event?.name,
    data.advertiser,
    block.analytics?.attributes?.label
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  if (labelCandidates.length > 0) {
    return labelCandidates[0];
  }
  if (typeof block.key === 'string' && block.key.length > 0) {
    return block.key;
  }
  return block.id;
}

export function summarizeBlock(block: BlockInstance): string {
  const data = (block as any).data ?? {};
  switch (block.kind) {
    case 'filter-bar': {
      const facets = Array.isArray(data.facets) ? data.facets.map((facet: any) => facet.label).filter(Boolean) : [];
      return facets.length > 0 ? `Facets: ${facets.join(', ')}` : 'No facets configured';
    }
    case 'hero-carousel': {
      const slides = Array.isArray(data.items) ? data.items.length : 0;
      const headline = Array.isArray(data.items) && data.items[0]?.headline ? ` — ${data.items[0].headline}` : '';
      return `Slides: ${slides}${headline}`;
    }
    case 'collection-rail': {
      const count = Array.isArray(data.events) ? data.events.length : 0;
      const layout = typeof data.layout === 'string' ? data.layout : 'rail';
      return `${count} events · layout ${layout}`;
    }
    case 'map-grid': {
      const pins = Array.isArray(data.events) ? data.events.length : 0;
      return `${pins} pins mapped`;
    }
    case 'promo-slot': {
      const advertiser = data.advertiser ?? data.slotId ?? 'Promo';
      return `Advertiser: ${advertiser}`;
    }
    case 'event-detail': {
      const name = data.event?.name ?? relabelBlock(block);
      return `Detail: ${name}`;
    }
    case 'event-mini-chat': {
      const questions = Array.isArray(data.starterQuestions) ? data.starterQuestions.length : 0;
      return `Starter questions: ${questions}`;
    }
    default:
      return relabelBlock(block);
  }
}

export { DEFAULT_PLAN_TIMESTAMP };
