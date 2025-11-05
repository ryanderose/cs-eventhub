"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withPlanHash = exports.computePlanHash = exports.canonicalizePageDoc = exports.PageDocSchema = exports.BlockInstanceSchema = exports.BlockKind = void 0;
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
/**
 * Block kinds supported by the v1.5 product surface. Each block has a
 * dedicated schema describing the data payload that the block runtime expects
 * to receive from the composer. These definitions are intentionally strict so
 * that the AI composer can stream deterministic payloads which in turn produce
 * stable cache keys and render plans.
 */
exports.BlockKind = zod_1.z.enum([
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
const LayoutSchema = zod_1.z.object({
    fullWidth: zod_1.z.boolean().default(true),
    height: zod_1.z.string().optional(),
    minHeight: zod_1.z.string().optional(),
    background: zod_1.z.string().optional(),
    padding: zod_1.z
        .object({ top: zod_1.z.number().default(0), right: zod_1.z.number().default(0), bottom: zod_1.z.number().default(0), left: zod_1.z.number().default(0) })
        .partial()
        .optional()
});
const AnalyticsSchema = zod_1.z.object({
    viewKey: zod_1.z.string(),
    surface: zod_1.z.string(),
    attributes: zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()])).optional()
});
const ImageSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    alt: zod_1.z.string(),
    width: zod_1.z.number().int().positive().optional(),
    height: zod_1.z.number().int().positive().optional(),
    focalPoint: zod_1.z
        .object({ x: zod_1.z.number().min(0).max(1), y: zod_1.z.number().min(0).max(1) })
        .optional()
});
const AccessibilitySchema = zod_1.z.object({
    label: zod_1.z.string().optional(),
    describedBy: zod_1.z.array(zod_1.z.string()).optional(),
    role: zod_1.z.string().optional()
});
const SUPPORTED_BLOCK_VERSIONS = ['1.5', '1.6'];
const BlockBase = zod_1.z.object({
    id: zod_1.z.string(),
    key: zod_1.z.string(),
    kind: exports.BlockKind,
    version: zod_1.z.enum(SUPPORTED_BLOCK_VERSIONS).default('1.6'),
    order: zod_1.z.number().int().nonnegative(),
    layout: LayoutSchema.default({ fullWidth: true }),
    analytics: AnalyticsSchema.optional(),
    a11y: AccessibilitySchema.optional(),
    featureFlags: zod_1.z.array(zod_1.z.string()).optional()
});
const EventSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    canonicalId: zod_1.z.string(),
    name: zod_1.z.string(),
    venue: zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        geo: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }).optional(),
        address: zod_1.z.string().optional()
    }),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().optional(),
    categories: zod_1.z.array(zod_1.z.string()).default([]),
    heroImage: ImageSchema.optional(),
    price: zod_1.z
        .object({ min: zod_1.z.number().optional(), max: zod_1.z.number().optional(), currency: zod_1.z.string().default('USD') })
        .optional(),
    distanceKm: zod_1.z.number().optional(),
    whyGo: zod_1.z.array(zod_1.z.string()).max(4).optional(),
    locale: zod_1.z.string().default('en-US'),
    timezone: zod_1.z.string().default('UTC'),
    ticketUrl: zod_1.z.string().url().optional(),
    source: zod_1.z.object({ provider: zod_1.z.string(), id: zod_1.z.string() })
});
const FilterFacetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    label: zod_1.z.string(),
    type: zod_1.z.enum(['date', 'category', 'price', 'distance', 'family', 'accessibility', 'neighborhood']),
    options: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        label: zod_1.z.string(),
        count: zod_1.z.number().int().nonnegative().optional(),
        icon: zod_1.z.string().optional()
    })),
    multi: zod_1.z.boolean().default(true)
});
const ChatSeedMessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['system', 'user', 'assistant']),
    content: zod_1.z.string(),
    eventId: zod_1.z.string().optional()
});
const AiDockBlock = BlockBase.extend({
    kind: zod_1.z.literal('ai-dock'),
    data: zod_1.z.object({
        entryPointLabel: zod_1.z.string().default('Ask about events'),
        welcomeMessages: zod_1.z.array(ChatSeedMessageSchema).max(3).default([]),
        conversationId: zod_1.z.string(),
        allowedScopes: zod_1.z.array(zod_1.z.enum(['global', 'event'])).default(['global'])
    })
});
const FilterBarBlock = BlockBase.extend({
    kind: zod_1.z.literal('filter-bar'),
    data: zod_1.z.object({
        facets: zod_1.z.array(FilterFacetSchema),
        active: zod_1.z.record(zod_1.z.array(zod_1.z.string()).or(zod_1.z.string())),
        sortOptions: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), label: zod_1.z.string(), default: zod_1.z.boolean().optional() })),
        flags: zod_1.z.object({ showReset: zod_1.z.boolean().default(true), floating: zod_1.z.boolean().default(false) }).default({ showReset: true, floating: false })
    })
});
const HeroCarouselBlock = BlockBase.extend({
    kind: zod_1.z.literal('hero-carousel'),
    data: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            headline: zod_1.z.string(),
            subhead: zod_1.z.string().optional(),
            image: ImageSchema,
            cta: zod_1.z.object({ label: zod_1.z.string(), href: zod_1.z.string().url() }).optional(),
            eventRef: zod_1.z.string().optional()
        })),
        autoplayMs: zod_1.z.number().min(4000).max(12000).default(8000)
    })
});
const CollectionRailBlock = BlockBase.extend({
    kind: zod_1.z.literal('collection-rail'),
    data: zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        events: zod_1.z.array(EventSummarySchema),
        layout: zod_1.z.enum(['grid', 'rail']).default('rail'),
        streaming: zod_1.z.object({ cursor: zod_1.z.string().optional(), mode: zod_1.z.enum(['initial', 'append']).default('initial') }).default({ mode: 'initial' }),
        diversity: zod_1.z.object({ venue: zod_1.z.number().default(2), date: zod_1.z.number().default(3), category: zod_1.z.number().default(60) }).optional()
    })
});
const MicroCalendarBlock = BlockBase.extend({
    kind: zod_1.z.literal('microcalendar'),
    data: zod_1.z.object({
        days: zod_1.z.array(zod_1.z.object({
            date: zod_1.z.string(),
            events: zod_1.z.array(EventSummarySchema.pick({ id: true, canonicalId: true, name: true, startDate: true }))
        })).max(7),
        timezone: zod_1.z.string().default('UTC')
    })
});
const EventDetailBlock = BlockBase.extend({
    kind: zod_1.z.literal('event-detail'),
    data: zod_1.z.object({
        event: EventSummarySchema.extend({
            description: zod_1.z.string().optional(),
            accessibility: zod_1.z.array(zod_1.z.string()).optional(),
            safety: zod_1.z.object({ rating: zod_1.z.enum(['low', 'medium', 'high']).optional(), notes: zod_1.z.string().optional() }).optional(),
            similarEvents: zod_1.z.array(EventSummarySchema).max(12).optional(),
            map: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number(), zoom: zod_1.z.number().default(13) }).optional()
        }),
        layout: zod_1.z.enum(['modal', 'page']).default('modal')
    })
});
const SeoCollectionBlock = BlockBase.extend({
    kind: zod_1.z.literal('seo-collection'),
    data: zod_1.z.object({
        html: zod_1.z.string(),
        jsonLd: zod_1.z.string().optional(),
        criticalCss: zod_1.z.string().max(6000),
        hashedCss: zod_1.z.string().regex(/^sha256-+/)
    })
});
const SeoDetailBlock = BlockBase.extend({
    kind: zod_1.z.literal('seo-detail'),
    data: zod_1.z.object({
        html: zod_1.z.string(),
        jsonLd: zod_1.z.string().optional(),
        criticalCss: zod_1.z.string().max(6000),
        hashedCss: zod_1.z.string().regex(/^sha256-+/)
    })
});
const MapGridBlock = BlockBase.extend({
    kind: zod_1.z.literal('map-grid'),
    data: zod_1.z.object({
        events: zod_1.z.array(EventSummarySchema.extend({
            map: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }),
            listIndex: zod_1.z.number().int().nonnegative(),
            clusterId: zod_1.z.string().optional()
        })),
        viewport: zod_1.z.object({
            center: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }),
            zoom: zod_1.z.number().min(3).max(18),
            bounds: zod_1.z
                .object({
                ne: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }),
                sw: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() })
            })
                .optional()
        }),
        parityChecksum: zod_1.z.string()
    })
});
const PromoSlotBlock = BlockBase.extend({
    kind: zod_1.z.literal('promo-slot'),
    data: zod_1.z.object({
        slotId: zod_1.z.string(),
        advertiser: zod_1.z.string().optional(),
        disclosure: zod_1.z.string().default('Sponsored'),
        measurement: zod_1.z.object({
            impressionUrl: zod_1.z.string().url().optional(),
            clickUrl: zod_1.z.string().url().optional()
        }),
        safety: zod_1.z.object({
            blockedCategories: zod_1.z.array(zod_1.z.string()).default([]),
            brandSuitability: zod_1.z.enum(['strict', 'moderate', 'relaxed']).default('moderate')
        })
    })
});
const EventMiniChatBlock = BlockBase.extend({
    kind: zod_1.z.literal('event-mini-chat'),
    data: zod_1.z.object({
        eventId: zod_1.z.string(),
        conversationId: zod_1.z.string(),
        starterQuestions: zod_1.z.array(zod_1.z.string()).max(3).default([]),
        availability: zod_1.z.object({
            requiresConsent: zod_1.z.boolean().default(true),
            personalization: zod_1.z.boolean().default(true)
        })
    })
});
exports.BlockInstanceSchema = zod_1.z.discriminatedUnion('kind', [
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
const PageMetaSchema = zod_1.z.object({
    planHash: zod_1.z.string().optional(),
    composerVersion: zod_1.z.string().optional(),
    generatedAt: zod_1.z.string().optional(),
    locale: zod_1.z.string().default('en-US'),
    cacheTags: zod_1.z.array(zod_1.z.string()).default([]),
    flags: zod_1.z.record(zod_1.z.boolean()).default({})
});
const PlanCursorSchema = zod_1.z.object({
    blockKey: zod_1.z.string(),
    cursor: zod_1.z.string(),
    exhausted: zod_1.z.boolean().default(false)
});
exports.PageDocSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    path: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    tenantId: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    expiresAt: zod_1.z.string().optional(),
    version: zod_1.z.enum(SUPPORTED_BLOCK_VERSIONS).default('1.6'),
    blocks: zod_1.z.array(exports.BlockInstanceSchema),
    meta: PageMetaSchema,
    planCursors: zod_1.z.array(PlanCursorSchema).default([])
});
function sortObjectKeys(value) {
    if (Array.isArray(value)) {
        return value.map(sortObjectKeys);
    }
    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
            acc[key] = sortObjectKeys(value[key]);
            return acc;
        }, {});
    }
    return value;
}
function canonicalizeBlock(block) {
    return {
        ...block,
        data: sortObjectKeys(block.data)
    };
}
function canonicalizePageDoc(doc) {
    const blocks = [...doc.blocks]
        .sort((a, b) => (a.order - b.order) || a.key.localeCompare(b.key))
        .map((block, idx) => canonicalizeBlock({ ...block, order: idx }));
    return {
        ...doc,
        blocks,
        meta: {
            ...doc.meta,
            cacheTags: [...doc.meta.cacheTags].sort(),
            flags: sortObjectKeys(doc.meta.flags) ?? {}
        },
        planCursors: [...doc.planCursors].sort((a, b) => a.blockKey.localeCompare(b.blockKey))
    };
}
exports.canonicalizePageDoc = canonicalizePageDoc;
function computePlanHash(doc) {
    const normalized = canonicalizePageDoc(doc);
    const json = JSON.stringify(normalized);
    return (0, node_crypto_1.createHash)('sha256').update(json).digest('base64url');
}
exports.computePlanHash = computePlanHash;
function withPlanHash(doc) {
    const hash = computePlanHash(doc);
    return {
        ...doc,
        meta: { ...doc.meta, planHash: hash }
    };
}
exports.withPlanHash = withPlanHash;
