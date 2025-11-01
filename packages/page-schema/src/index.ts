import { createHash } from 'node:crypto';
import { z } from 'zod';

/**
 * Block kinds supported by the v1.5 product surface. Each block has a
 * dedicated schema describing the data payload that the block runtime expects
 * to receive from the composer. These definitions are intentionally strict so
 * that the AI composer can stream deterministic payloads which in turn produce
 * stable cache keys and render plans.
 */
export const BlockKind = z.enum([
  'ai-dock',
  'filter-bar',
  'hero-carousel',
  'collection-rail',
  'microcalendar',
  'event-detail',
  'seo-collection',
  'seo-detail',
  'map-grid',
  'promo-slot',
  'event-mini-chat'
]);

const LayoutSchema = z.object({
  fullWidth: z.boolean().default(true),
  height: z.string().optional(),
  minHeight: z.string().optional(),
  background: z.string().optional(),
  padding: z
    .object({ top: z.number().default(0), right: z.number().default(0), bottom: z.number().default(0), left: z.number().default(0) })
    .partial()
    .optional()
});

const AnalyticsSchema = z.object({
  viewKey: z.string(),
  surface: z.string(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])).optional()
});

const ImageSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  focalPoint: z
    .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
    .optional()
});

const AccessibilitySchema = z.object({
  label: z.string().optional(),
  describedBy: z.array(z.string()).optional(),
  role: z.string().optional()
});

const SUPPORTED_BLOCK_VERSIONS = ['1.5', '1.6'] as const;

const BlockBase = z.object({
  id: z.string(),
  key: z.string(),
  kind: BlockKind,
  version: z.enum(SUPPORTED_BLOCK_VERSIONS).default('1.6'),
  order: z.number().int().nonnegative(),
  layout: LayoutSchema.default({ fullWidth: true }),
  analytics: AnalyticsSchema.optional(),
  a11y: AccessibilitySchema.optional(),
  featureFlags: z.array(z.string()).optional()
});

const EventSummarySchema = z.object({
  id: z.string(),
  canonicalId: z.string(),
  name: z.string(),
  venue: z.object({
    id: z.string(),
    name: z.string(),
    geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
    address: z.string().optional()
  }),
  startDate: z.string(),
  endDate: z.string().optional(),
  categories: z.array(z.string()).default([]),
  heroImage: ImageSchema.optional(),
  price: z
    .object({ min: z.number().optional(), max: z.number().optional(), currency: z.string().default('USD') })
    .optional(),
  distanceKm: z.number().optional(),
  whyGo: z.array(z.string()).max(4).optional(),
  locale: z.string().default('en-US'),
  timezone: z.string().default('UTC'),
  ticketUrl: z.string().url().optional(),
  source: z.object({ provider: z.string(), id: z.string() })
});

const FilterFacetSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['date', 'category', 'price', 'distance', 'family', 'accessibility', 'neighborhood']),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      count: z.number().int().nonnegative().optional(),
      icon: z.string().optional()
    })
  ),
  multi: z.boolean().default(true)
});

const ChatSeedMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  eventId: z.string().optional()
});

const AiDockBlock = BlockBase.extend({
  kind: z.literal('ai-dock'),
  data: z.object({
    entryPointLabel: z.string().default('Ask about events'),
    welcomeMessages: z.array(ChatSeedMessageSchema).max(3).default([]),
    conversationId: z.string(),
    allowedScopes: z.array(z.enum(['global', 'event'])).default(['global'])
  })
});

const FilterBarBlock = BlockBase.extend({
  kind: z.literal('filter-bar'),
  data: z.object({
    facets: z.array(FilterFacetSchema),
    active: z.record(z.array(z.string()).or(z.string())),
    sortOptions: z.array(
      z.object({ id: z.string(), label: z.string(), default: z.boolean().optional() })
    ),
    flags: z.object({ showReset: z.boolean().default(true), floating: z.boolean().default(false) }).default({ showReset: true, floating: false })
  })
});

const HeroCarouselBlock = BlockBase.extend({
  kind: z.literal('hero-carousel'),
  data: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        headline: z.string(),
        subhead: z.string().optional(),
        image: ImageSchema,
        cta: z.object({ label: z.string(), href: z.string().url() }).optional(),
        eventRef: z.string().optional()
      })
    ),
    autoplayMs: z.number().min(4000).max(12000).default(8000)
  })
});

const CollectionRailBlock = BlockBase.extend({
  kind: z.literal('collection-rail'),
  data: z.object({
    title: z.string(),
    description: z.string().optional(),
    events: z.array(EventSummarySchema),
    layout: z.enum(['grid', 'rail']).default('rail'),
    streaming: z.object({ cursor: z.string().optional(), mode: z.enum(['initial', 'append']).default('initial') }).default({ mode: 'initial' }),
    diversity: z.object({ venue: z.number().default(2), date: z.number().default(3), category: z.number().default(60) }).optional()
  })
});

const MicroCalendarBlock = BlockBase.extend({
  kind: z.literal('microcalendar'),
  data: z.object({
    days: z.array(
      z.object({
        date: z.string(),
        events: z.array(EventSummarySchema.pick({ id: true, canonicalId: true, name: true, startDate: true }))
      })
    ).max(7),
    timezone: z.string().default('UTC')
  })
});

const EventDetailBlock = BlockBase.extend({
  kind: z.literal('event-detail'),
  data: z.object({
    event: EventSummarySchema.extend({
      description: z.string().optional(),
      accessibility: z.array(z.string()).optional(),
      safety: z.object({ rating: z.enum(['low', 'medium', 'high']).optional(), notes: z.string().optional() }).optional(),
      similarEvents: z.array(EventSummarySchema).max(12).optional(),
      map: z.object({ lat: z.number(), lng: z.number(), zoom: z.number().default(13) }).optional()
    }),
    layout: z.enum(['modal', 'page']).default('modal')
  })
});

const SeoCollectionBlock = BlockBase.extend({
  kind: z.literal('seo-collection'),
  data: z.object({
    html: z.string(),
    jsonLd: z.string().optional(),
    criticalCss: z.string().max(6_000),
    hashedCss: z.string().regex(/^sha256-+/)
  })
});

const SeoDetailBlock = BlockBase.extend({
  kind: z.literal('seo-detail'),
  data: z.object({
    html: z.string(),
    jsonLd: z.string().optional(),
    criticalCss: z.string().max(6_000),
    hashedCss: z.string().regex(/^sha256-+/)
  })
});

const MapGridBlock = BlockBase.extend({
  kind: z.literal('map-grid'),
  data: z.object({
    events: z.array(
      EventSummarySchema.extend({
        map: z.object({ lat: z.number(), lng: z.number() }),
        listIndex: z.number().int().nonnegative(),
        clusterId: z.string().optional()
      })
    ),
    viewport: z.object({
      center: z.object({ lat: z.number(), lng: z.number() }),
      zoom: z.number().min(3).max(18),
      bounds: z
        .object({
          ne: z.object({ lat: z.number(), lng: z.number() }),
          sw: z.object({ lat: z.number(), lng: z.number() })
        })
        .optional()
    }),
    parityChecksum: z.string()
  })
});

const PromoSlotBlock = BlockBase.extend({
  kind: z.literal('promo-slot'),
  data: z.object({
    slotId: z.string(),
    advertiser: z.string().optional(),
    disclosure: z.string().default('Sponsored'),
    measurement: z.object({
      impressionUrl: z.string().url().optional(),
      clickUrl: z.string().url().optional()
    }),
    safety: z.object({
      blockedCategories: z.array(z.string()).default([]),
      brandSuitability: z.enum(['strict', 'moderate', 'relaxed']).default('moderate')
    })
  })
});

const EventMiniChatBlock = BlockBase.extend({
  kind: z.literal('event-mini-chat'),
  data: z.object({
    eventId: z.string(),
    conversationId: z.string(),
    starterQuestions: z.array(z.string()).max(3).default([]),
    availability: z.object({
      requiresConsent: z.boolean().default(true),
      personalization: z.boolean().default(true)
    })
  })
});

export const BlockInstanceSchema = z.discriminatedUnion('kind', [
  AiDockBlock,
  FilterBarBlock,
  HeroCarouselBlock,
  CollectionRailBlock,
  MicroCalendarBlock,
  EventDetailBlock,
  SeoCollectionBlock,
  SeoDetailBlock,
  MapGridBlock,
  PromoSlotBlock,
  EventMiniChatBlock
]);

const PageMetaSchema = z.object({
  planHash: z.string().optional(),
  composerVersion: z.string().optional(),
  generatedAt: z.string().optional(),
  locale: z.string().default('en-US'),
  cacheTags: z.array(z.string()).default([]),
  flags: z.record(z.boolean()).default({})
});

const PlanCursorSchema = z.object({
  blockKey: z.string(),
  cursor: z.string(),
  exhausted: z.boolean().default(false)
});

export const PageDocSchema = z.object({
  id: z.string(),
  title: z.string(),
  path: z.string(),
  description: z.string().optional(),
  tenantId: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string().optional(),
  version: z.enum(SUPPORTED_BLOCK_VERSIONS).default('1.6'),
  blocks: z.array(BlockInstanceSchema),
  meta: PageMetaSchema,
  planCursors: z.array(PlanCursorSchema).default([])
});

export type BlockInstance = z.infer<typeof BlockInstanceSchema>;
export type PageDoc = z.infer<typeof PageDocSchema>;
export type PlanCursor = z.infer<typeof PlanCursorSchema>;
export type EventSummary = z.infer<typeof EventSummarySchema>;

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function canonicalizeBlock<T extends BlockInstance>(block: T): T {
  return {
    ...block,
    data: sortObjectKeys(block.data) as T['data']
  };
}

export function canonicalizePageDoc(doc: PageDoc): PageDoc {
  const blocks = [...doc.blocks]
    .sort((a, b) => (a.order - b.order) || a.key.localeCompare(b.key))
    .map((block, idx) => canonicalizeBlock({ ...block, order: idx } as BlockInstance));

  return {
    ...doc,
    blocks,
    meta: {
      ...doc.meta,
      cacheTags: [...doc.meta.cacheTags].sort(),
      flags: (sortObjectKeys(doc.meta.flags) as PageDoc['meta']['flags']) ?? {}
    },
    planCursors: [...doc.planCursors].sort((a, b) => a.blockKey.localeCompare(b.blockKey))
  };
}

export function computePlanHash(doc: PageDoc): string {
  const normalized = canonicalizePageDoc(doc);
  const json = JSON.stringify(normalized);
  return createHash('sha256').update(json).digest('base64url');
}

export function withPlanHash(doc: PageDoc): PageDoc {
  const hash = computePlanHash(doc);
  return {
    ...doc,
    meta: { ...doc.meta, planHash: hash }
  };
}
