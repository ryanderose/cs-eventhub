# Events Hub — Product Build Specification **v1.5**

**Status:** READY FOR BUILD (GA with gates)  
**Owners:** Platform (Embed SDK), Experience (Blocks/UI), Data (Providers/Search), AI (Interpreter + Composer), Infra/SecOps  
**Version:** 1.5  
**Audience:** Senior dev architects, staff‑level ICs, tech leads, engineering managers

> **Purpose:** This document supersedes **v1.4** and consolidates the entire specification into a single, build‑ready source of truth. It integrates the base platform defined in v1.4 with the newly approved improvements: **AI Plan Composer**, **URL‑persisted plans**, **Map Grid block**, **Promo Slot block**, **ranking diversity**, **expanded analytics**, **strict CSP for SEO fragments**, and **event‑scoped AI chat**—and codifies the **hard policy of _no iframe support_**.


---

## 0) Δ What changed (v1.4 → v1.5)

1) **AI Plan Composer (new, server):** `POST /v1/compose` converts the Filter/AI DSL into a **minimal `PageDoc`** with per‑block cursors and **progressive section hydration**. SDK now emits `sdk.blockHydrated` and `sdk.blockDepleted`.
2) **URL‑persisted plans (new):** Deep links via `?plan=<encodedPlan>` where payloads are prefixed (`z:` Zstd, `b:` Brotli, `p:` plain). If `encodedPlan` exceeds **2,048 chars**, fallback to `?p=<shortId>` bound to the plan’s SHA‑256 **`planHash`**.
3) **Map Grid block (new):** Optional list ↔ map toggle with clustered pins and **non‑map a11y fallback**. Virtualized list, keyboardable markers.
4) **Sponsor/House Promo block (new):** First‑class `promo-slot` with measurement hooks (impression/in‑view/click), frequency caps, tenant safety rails.
5) **Ranking diversity (new):** Venue/day/category constraints for healthier rows; tenant overrides supported.
6) **Analytics (expanded):** New events: `card_impression`, `card_click`, `ticket_outbound_click`, `promo_impression`, `promo_click`, `chat_open`, `chat_submit`, `chat_latency_ms`, `ai_fallback_triggered`.
7) **Strict CSP for SEO fragments (tightened):** No `unsafe-inline` for styles; fragments deliver **hashed ≤6 kB critical CSS** + one deferred stylesheet. Shadow DOM continues to use Constructable Stylesheets.
8) **Event‑scoped AI chat (new):** On card/detail; cites fields; feature‑flag per tenant; analytics included.
9) **Edge cache keys (updated):** Include `planHash` and `composerVersion` to ensure safe invalidation and deterministic shareability.
10) **Resolved defaults (closed open items):** CitySpark quotas, sitemap ISR cadence, GeoIP provider, CMP adapters, OLAP store (ClickHouse). See §21 and §22.
11) **Policy:** **No iframe support**. Shadow‑DOM embed (SDK) + Light‑DOM SEO fragments only. Publishers requiring iframes are out of scope.

> Foundations from v1.4 are preserved: **Shadow‑DOM embed**, **Preact + `preact/compat` in embed**, **Radix + shadcn + Tailwind (preflight off)**, **indexable non‑AI layouts** (SEO/ISR/sitemaps/JSON‑LD), **WCAG 2.2 AA launch gate**, **OTel** across client/server, **SOC2‑aligned** posture, **SBOM/CodeQL/SLSA** provenance.


---

## 1) Goals & Non‑Goals

### 1.1 Goals
- **Embeddable, brand‑safe discovery hub** that mounts in any host page via **no‑iframe SDK**, isolated by **Shadow DOM**, with **server SEO fragments** for indexable pages.
- **AI‑curated discovery** from free‑text queries and tenant/user context, compiled into a **sections plan** and rendered as **streamed blocks** (hero → rows → others).
- **Content‑first UX** with strong editorial aesthetic (Netflix‑style rows), grid/list, **Map Grid** option, and **Promo slots** that respect editorial flow.
- **SEO‑sound** non‑AI pages (collection/detail) with **JSON‑LD** and sitemaps; AI/personalized **noindex**.
- **Accessible & fast:** WCAG 2.2 AA, keyboardable carousels and dialogs, `prefers-reduced-motion`, bundle budgets, streamed rendering, virtualization.
- **Observable & measurable:** first‑class analytics events and SLOs, OTel tracing, public tenant dashboards.

### 1.2 Non‑Goals (v1.5)
- Event authoring/management UI; ticketing/checkout flows (link out to `ticket_url`).
- Identity/accounts (beyond anonymous consented prefs).
- Third‑party block marketplace; executing untrusted code.
- **Iframe embeds** (explicitly out of scope).


---

## 2) High‑Level Architecture

**Host page** → **Embed SDK (UMD/ESM, Shadow‑DOM)** → **Block Runtime** → **Provider Layer (CitySpark)** → **Edge Cache**  
Parallel: **Admin** → **Pages Store** → **Content API** → **Embed SDK**; **AI Interpreter + Composer**; **Analytics Ingest**; **SEO (ISR/Fragments/Sitemaps)**; **Observability**; **Security/Compliance**.

- **Embed runtime:** **Preact + `preact/compat`** (Admin & block dev remain on React).
- **Isolation:** **Shadow DOM** + **Constructable Stylesheets**; Portal container for overlays within Shadow Root.
- **SEO parity:** Non‑AI layouts rendered as **Light‑DOM fragments** with hashed critical CSS.


---

## 3) Monorepo (Turborepo)

```
root/
├─ apps/
│  ├─ admin/         # Next.js 15 (React) — Tenant config, pages, themes, publish
│  ├─ demo-host/     # Host demo (route takeover + SEO parity)
│  └─ api/           # BFF: Config, Content, AI (interpret/compose), Analytics, GeoIP
├─ packages/
│  ├─ ui/            # Radix wrappers, shadcn presets, Portal hook, a11y helpers
│  ├─ embed-sdk/     # SDK (Shadow DOM; Preact + compat), router, section themes
│  ├─ block-runtime/ # Renderer & hydration orchestrator
│  ├─ block-registry/# Registry + schemas
│  ├─ blocks/        # hero, filters, event-list, calendar/*, detail, non-AI layouts, map-grid, promo-slot
│  ├─ page-schema/   # Zod + JSON Schema (BlockInstance, PageDoc)
│  ├─ data-providers/# CitySpark adapter, canonicalizer, cache, rate limiters
│  ├─ ai-interpreter/# DSL + model router; safety
│  ├─ ai-composer/   # NEW: DSL → PageDoc compiler + cursors
│  ├─ router-helpers/# basePath, filter DSL <-> URL, plan encode/decode
│  ├─ telemetry/     # OTel + analytics client
│  ├─ tokens/        # Design tokens + section variants (CSS variables)
│  ├─ security/      # Sanitizer, signatures, CSP helpers
│  └─ cli/           # Scaffolding, schema validators, bundle reports
├─ tooling/
│  ├─ config/        # eslint, tsconfig, playwright, ladle, prettier, codeql, vitest, msw, axe
│  └─ scripts/       # bootstrap, seeds, sbom, provenance
└─ .github/workflows/# typecheck/lint/test/build/e2e/a11y/bundle/sbom/codeql/provenance
```


---

## 4) Contracts & Data Models

### 4.1 Page & Block (v1.5)

```ts
// packages/page-schema/block.ts
export const BlockInstance = z.object({
  key: z.string().min(1),              // e.g., "calendar/month" | "event-list" | "map-grid" | "promo-slot"
  id: z.string().uuid(),
  order: z.number().int(),
  layout: z.object({
    fullWidth: z.boolean().default(true),
    style: z.record(z.any()).optional(), // theme-specific
  }),
  data: z.record(z.any()),              // validated by block's schema
  options: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional(),
});
export type BlockInstance = z.infer<typeof BlockInstance>;

// packages/page-schema/page.ts
export const PageDoc = z.object({
  id: z.string(),
  title: z.string().min(1),
  path: z.string().min(1),              // defaults to tenant.basePath or subroute
  blocks: z.array(BlockInstance),
  updatedAt: z.string().datetime(),
  version: z.string().default("1.5"),
  tenantId: z.string(),
  meta: z.object({
    planHash: z.string().optional(),
    composerVersion: z.string().optional(),
  }).optional()
});
export type PageDoc = z.infer<typeof PageDoc>;
```

### 4.2 Event schema (CitySpark lineage)

```ts
export const EventV21 = EventV2.extend({
  canonicalId: z.string().optional(),   // internal canonical key for dedupe
});
export type EventV21 = z.infer<typeof EventV21>;
```

### 4.3 Provider interface (CitySpark‑backed; facets/pagination)

```ts
export interface EventProviderV21 {
  byRange(opts: {
    tenantId: string;
    from: Date; to: Date;
    filters?: {
      categories?: string[]; tags?: string[]; neighborhoods?: string[];
      price?: { min?: number; max?: number; currency?: string };
      familyFriendly?: boolean; distanceKm?: number; geo?: { lat: number; lng: number };
      accessibility?: string[];
    };
    page?: { size?: number; cursor?: string };
    sort?: "startTimeAsc" | "rank" | "priceAsc" | "priceDesc";
  }): Promise<{ events: EventV21[]; nextCursor?: string; facets?: Record<string, Record<string, number>> }>

  bySlug(tenantId: string, slug: string): Promise<EventV21 | null>;

  search(opts: {
    tenantId: string; q: string;
    page?: { size?: number; cursor?: string };
    filters?: Record<string, unknown>;
    sort?: "rank"|"startTimeAsc"|"priceAsc"|"priceDesc";
  }): Promise<{ events: EventV21[]; nextCursor?: string; facets?: Record<string, Record<string, number>> }>
}
```

**Normalization rules**
- All timestamps **UTC ISO‑8601**; IANA **`tz` required** for display.
- Provider returns **facet counts** (categories, price, neighborhoods, accessibility, family).
- **Canonicalization:**  
  `canonicalId = sha1(normalize(title), normalize(venue.name), roundToInterval(startsAtUTC, 30m))`  
  Prefer richer records on collisions (images > none; price present > absent; geo present > absent).


---

## 5) SDK (No‑iframe) — Public API

> **Policy:** The platform **does not** support iframe embeds. All integrations use the no‑iframe **Embed SDK** with **Shadow‑DOM** isolation. Non‑AI SEO parity is provided via server **Light‑DOM fragments**.

### 5.1 API

```ts
export type CreateArgs = {
  el: HTMLElement | string;
  initialState: PageDoc | { page: PageDoc; catalog?: Catalog };
  onEvent?: (e: SdkEvent) => void;
  config?: {
    useShadowDom?: boolean;        // default: true
    theme?: Record<string, string>; // allow-list of CSS vars
    basePath?: string;             // default: "/events"
    section?: string;              // selects theme.sections variant
  };
};

export interface EmbedHandle {
  update(next: PageDoc): void;
  addBlock(b: BlockInstance, index?: number): void;
  reorder(from: number, to: number): void;
  replaceAll(blocks: BlockInstance[]): void;
  navigate(to: string, opts?: { replace?: boolean }): void;
  destroy(): void;
  // NEW in v1.5
  hydrateNext(blockId: string): Promise<void>; // uses server cursor
}

export function create(args: CreateArgs): Promise<EmbedHandle>;
```

### 5.2 Routing & host coordination
- History shim emits `sdk.routeWillChange` (cancellable) and `sdk.routeChanged`.
- **Base path** defaults to `/events` (tenant override).
- URL ↔ state sync for filters and detail (`/events/:slug`).
- Section resolution (§7.3) from config/URL/data‑attribute. Emits `sdk.sectionChanged`.

### 5.3 Events (expanded)
```ts
type SdkEvent =
  | { type: "sdk.blockHydrated"; blockId: string; firstPaintMs: number; items: number }
  | { type: "sdk.blockDepleted"; blockId: string; totalItems: number }
  | { type: "sdk.sectionChanged"; section: string }
  | { type: "card_impression"; canonicalId: string; blockId: string; position: number; visiblePct: number }
  | { type: "card_click"; canonicalId: string; blockId: string; position: number }
  | { type: "ticket_outbound_click"; canonicalId: string; blockId: string; href: string }
  | { type: "promo_impression"; promoId: string; blockId: string; visiblePct: number }
  | { type: "promo_click"; promoId: string; blockId: string }
  | { type: "chat_open"; context: "global"|"event" }
  | { type: "chat_submit"; context: "global"|"event" }
  | { type: "chat_latency_ms"; p50: number; p95: number }
  | { type: "ai_fallback_triggered"; reason: "timeout"|"policy" };
```

### 5.4 Shadow DOM, Styles & Overlays
- **Preact + `preact/compat`** in **embed**; Admin/blocks dev remain on React.
- **Constructable Stylesheets** attached to `shadowRoot` in order: (1) tokens.css, (2) tailwind-utilities.css (**preflight disabled**, tree‑shaken), (3) per‑block.css.
- **Portal container:** SDK exposes a **Portal** within Shadow Root; Radix overlays must mount to it for focus/z‑index correctness.
- **SSR parity:** Server fragments render Light DOM with critical CSS; classnames/tokens shared for visual parity.


---

## 6) AI Layer — Interpreter → Composer

### 6.1 Filter DSL (unchanged)
```ts
export type FilterDSL = {
  dateRange?: { preset?: "today"|"tomorrow"|"weekend"; from?: string; to?: string };
  categories?: string[];
  price?: { max?: number; currency?: string };
  distanceKm?: number;
  neighborhoods?: string[];
  familyFriendly?: boolean;
  accessibility?: string[];
  sort?: "rank"|"startTimeAsc"|"priceAsc";
};
export type AiQuery = {
  intent: "search"|"qa"|"navigate";
  filters: FilterDSL;
  followUpOf?: string;
  text?: string;
  version: "dsl/1";
};
```

### 6.2 Interpreter
- `POST /v1/interpret` → `{ dsl: AiQuery }`.
- Vendor routing: OpenAI GPT‑4.1/4.1‑mini primary (no data retention). Fallbacks: Azure OpenAI, Anthropic.
- Prompt assembly server‑side; allow‑listed facets only. **P95 ≤ 500 ms**; **P99 ≤ 900 ms** with keyword+facets fallback.

### 6.3 **Composer (new, normative)**
- **Endpoint:** `POST /v1/compose` with `{ dsl: AiQuery; tenantId: string }` → `{ page: PageDoc; cursors: Record<string, string> }`.
- **Compilation rules (deterministic):**
  - `dsl.filters` → collection blocks; titles via tenant templates.
  - Include **Hero** (top N curated), **2–5 collection rows**, **MicroCalendar** when range ≤7 days, and **Vignette** when major/festival.
- **Streaming:** Blocks stream as data lands (hero → rows).  
  End‑to‑end **chat→hero first paint P99 ≤ 900 ms**; else `ai_fallback_triggered` and keyword path renders.
- **Model pinning:** Offline eval regressions ≤ 1% on golden set (≥200 queries) required for upgrades.
- **Privacy:** Logs retain DSL + metrics; user text redacted unless consented.


---

## 7) Tenant Config & Theming

### 7.1 Config Service (signed JWS)
```json
{
  "tenantId": "abc123",
  "version": "1.5",
  "routing": { "basePath": "/whatson" },
  "theme": {
    "tokens": { "--hub-color-primary": "#0a67ff", "--hub-radius": "8px" },
    "sections": {
      "default": { "--hub-accent": "#0a67ff" },
      "sports":  { "--hub-accent": "#008f5a" },
      "music":   { "--hub-accent": "#7a00ff" },
      "family":  { "--hub-accent": "#ff6a00" }
    },
    "softCap": 5
  },
  "featureFlags": { "ai.enabled": true, "seo.ssgEnabled": true, "seo.isr": true, "ai.eventChat.enabled": false },
  "initialPage": { "... PageDoc ..." },
  "catalog": { "... block registry metadata ..." },
  "dataSources": { "provider": "cityspark" },
  "seo": { "jsonLd": true, "sitemaps": true, "personalizedNoindex": true }
}
```

### 7.2 Tokens & Sections
- Only allow‑listed CSS variables applied; extras ignored/logged.
- Section resolution precedence: `config.section` → URL subpath → host `data-section` → `theme.defaultSection` → `"default"`.
- Emits `sdk.sectionChanged` on changes.


---

## 8) URL‑Persisted Plan (new)

### 8.1 Encoding
- `encodePlan(PageDoc)` (see `packages/router-helpers`) emits `<prefix>:<base64url(payload)>`:
  - `z:` — Zstandard level 3 (preferred when optional native binding available).
  - `b:` — Brotli (Node `brotliCompressSync`) fallback when Zstd unavailable.
  - `p:` — Plain UTF‑8 JSON when no compression bindings exist.
- Inline budget: if the resulting string is ≤ **2,048 chars**, it is returned as `encodedPlan` and pushed to the URL query as `plan=`.
- If the payload exceeds the inline budget, the API stores it server‑side and responds with `shortId = planHash` for `?p=` links.

### 8.2 Canonicalization
- Normalize date presets, sort, and category aliases before hashing.
- Canonicalization sorts block orders/keys, meta flags, and cursors; hash input is stable JSON.
- `planHash = base64url(sha256(canonicalPageDoc))` → `PageDoc.meta.planHash` and the persisted `shortId`.
- Helpers:
```ts
export function encodePlan(plan: object): string;
export function decodePlan(param: string): object;
```

### 8.3 SEO
- Personalized/AI plans **noindex**; canonical to equivalent non‑AI routes when available.

### 8.4 API delivery examples

```http
POST /v1/compose
Content-Type: application/json

{
  "tenantId": "demo",
  "intent": "search",
  "filters": { "categories": ["music"], "date": { "preset": "this-weekend" } }
}

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: s-maxage=300, stale-while-revalidate=60

{
  "composerVersion": "1.5.2",
  "page": { "...PageDoc...", "meta": { "planHash": "k1nYx2..." } },
  "cursors": { "hero": "cursor123" },
  "encodedPlan": "z:KLUv/QBQ..."
}
```

> Inline example: `encodedPlan` stays under the 2 kB limit and can be embedded directly in the URL.

```http
POST /v1/compose
Content-Type: application/json

{
  "tenantId": "demo",
  "intent": "search",
  "filters": { "categories": ["festival"], "date": { "range": { "from": "2024-06-01", "to": "2024-07-15" } } }
}

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: s-maxage=300, stale-while-revalidate=60

{
  "composerVersion": "1.5.2",
  "page": { "...PageDoc...", "meta": { "planHash": "Qz4p2Y..." } },
  "cursors": { "grid": "cursor999" },
  "shortId": "Qz4p2YjYk7F2bPgX5lmy8X7cQyC6uXy7y9SRVYjN6qM"
}
```

> Fallback example: the encoded plan exceeded the inline budget, so the response drops `encodedPlan` and returns the SHA‑256 short ID to be used with `?p=`.

```http
GET /v1/plan/Qz4p2YjYk7F2bPgX5lmy8X7cQyC6uXy7y9SRVYjN6qM

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store

{
  "encoded": "z:KLUv/...large...",
  "plan": { "...PageDoc..." }
}
```

> Retrieval example: resolving the `shortId` fetches the stored payload alongside its decoded `PageDoc`.


---

## 9) Blocks & UI (first‑party, SEO‑ready)

**Must‑ship:**  
- **AI Search/Chat Dock** (consented; noindex views).  
- **Filter Bar** (facets: date, categories, price, distance, family, accessibility, neighborhoods).  
- **Hero/Featured Carousel** (keyboard + swipe).  
- **Collections** (rails/grid) with Netflix‑style rows, stream‑hydrated.  
- **MicroCalendar** (≤7 days).  
- **Event Detail** (modal/page) with “why go” bullets, map snippet, similar events, ticket CTA.  
- **Non‑AI Collection layout** (SEO default) + **Non‑AI Detail layout**.  
- **Map Grid** (new) with list ↔ map toggle, clustered pins, a11y parity.  
- **Promo Slot** (new) sponsored/house; measurement and safety.  
- **Event‑scoped AI mini‑chat** (new; feature flag).

**A11y (launch gate):** Keyboard traversal, focus restore, ARIA labels/roles, contrast ≥4.5:1, reduced‑motion.  
**i18n:** ICU catalogs, `Intl` for dates/currency, RTL‑ready.


---

## 10) Search, Ranking & Diversity

- Retrieval from CitySpark; optional per‑tenant local **BM25** index (flag).  
- Editorial boosts (Featured/Trending).  
- **Diversity constraints (per row):**  
  - ≤ **2 events** from the **same venue**.  
  - ≤ **3 events** from the **same day** within a 7‑day window.  
  - Max **category dominance** 60% unless the query is single‑category.  
- Deterministic tie‑breakers for stable, cache‑friendly renders.


---

## 11) Data Provider Layer (CitySpark)

**Adapter responsibilities:** map fields, compute `canonicalId`, hydrate `tz` from venue geo or tenant market, normalize currencies, facets, retry/backoff (3), **circuit breaker** (open on 60‑s error‑rate threshold), OTel metrics.  
**Edge cache:** keys include **`planHash`** and **`composerVersion`**; TTL 120 s default; stale‑while‑revalidate 10 m.  
**Quotas (defaults):** 10 rps burst, 240 rpm sustained per tenant (configurable).


---

## 12) Content API

**Read endpoints (public, cached):**
- `GET  /v1/pages/:tenantId/:path` → `PageDoc`  
- `GET  /v1/pages/:tenantId/catalog`  
- `GET  /v1/events/:tenantId/by-range?...`  
- `GET  /v1/events/:tenantId/search?...`  
- `GET  /v1/events/:tenantId/by-slug/:slug`

**AI endpoints:**
- `POST /v1/interpret` → `{ dsl }`  
- `POST /v1/compose`   → `{ page, cursors }` **(new)**  
- `GET  /v1/plan/:shortId` → serialized plan (server‑stored)

**SEO endpoints:**
- `GET /v1/fragment/:tenantId?route=/events` → HTML + JSON‑LD (non‑AI layout)
- `GET /v1/sitemap/:tenantId.xml` (ISR; `<lastmod>`)

**Analytics ingest:**
- `POST /v1/analytics/events` (gzip) with expanded schema (§15).


---

## 13) SEO / SSR / ISR (strict CSP)

- **Indexable:** Non‑AI collection & detail pages (server fragments + ISR).  
- **AI/personalized:** `noindex` + canonical to non‑AI URL.  
- **Sitemaps:** per tenant; **ISR revalidate 15 m** (tenant override 5–60).  
- **Schema.org/Event:** emitted for cards and details.  
- **Critical CSS for fragments:** **≤6 kB hashed** + one deferred stylesheet; classnames/tokens match embed.

**CSP (strict example):**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.your-cdn.com 'sha384-REPLACE';
  style-src 'self' https://cdn.your-cdn.com 'sha256-CRITICAL_CSS_HASH';
  img-src 'self' https: data:;
  connect-src 'self' https://api.your-domain.com https://config.your-domain.com;
```
> No `unsafe-inline` styles. Hashed inline style blocks allowed only for the ≤6 kB critical CSS.


---

## 14) Privacy & Consent

- Respect tenant CMP (**IAB TCF v2.2**) with **OneTrust/Sourcepoint** adapters.  
- Approx geo via **MaxMind GeoIP2 City**; never store raw IP in app DB; session‑scoped only.  
- AI logs retain DSL + metrics only with consent; redact user text.  
- Personalization is consent‑gated.


---

## 15) Observability & Analytics

### 15.1 OpenTelemetry
- SDK spans: `sdk.mount`, `sdk.route`, `sdk.filters`, `sdk.ai.interpret`, `sdk.ai.compose`, `sdk.blockRender`.  
- Server spans: `provider.cityspark.*`, `cache.*`, `composer.*`, `fragment.render`, `seo.sitemap`, `analytics.ingest`.

### 15.2 First‑party analytics (expanded schema)
**Envelope:** `{ tenantId, sessionId, ts, route, section, planHash?, device, referrer }`  
**Events:** see §5.3 list.  
**Sinks:** ClickHouse (primary); optional GA4/Segment/Mixpanel adapters (off by default).  
**Dashboards:** Metabase starter pack (traffic, engagement by block, ticket click‑thru, chat conversion, AI fallback rate).


---

## 16) Performance & Budgets

- **SDK UMD ≤ 45 kB** (gzip) **including Preact + compat**; ESM ≤ 35 kB; per‑block ≤ 15 kB; tokens ≤ 12 kB.  
- First render ≤ **1.5 s** (mid‑tier device, 4G); interactive ≤ **2.5 s**.  
- Provider timeouts 2 s; retries (3) with jitter; breaker open 30 s.  
- Tailwind utilities **tree‑shaken**; preflight **disabled**.


---

## 17) Accessibility (Launch Gate)

- **WCAG 2.2 AA** with **A11Y snapshots** (axe=0), keyboard‑only flows, role/name assertions, focus trap/restore, and reduced‑motion.  
- **Map Grid** must provide **equivalent non‑map list**; markers keyboard reachable/labeled.  
- Radix overlays mount to SDK Portal container and pass focus‑trap tests.


---

## 18) Testing Strategy & CI

- **Unit:** Vitest + RTL; Zod contract tests; provider mapping; timezone/DST fuzz.  
- **Stories:** Ladle for empty/loading/populated/error + axe for all blocks.  
- **Network:** MSW for CitySpark; chaos toggles (latency, 429/5xx).  
- **E2E (Playwright):**
  - Embed mount, Shadow DOM, basePath overrides
  - Back/forward parity, URL filter persistence, deep‑link detail
  - **Chat→hero timing** budgets & fallback path
  - SEO fragments render (JSON‑LD present)
  - Keyboard‑only and focus return
  - **Portal tests** for overlays
  - **Map Grid** a11y & virtualization
- **Composer contract tests:** DSL→PageDoc golden fixtures.  
- **Plan URL fuzz:** encode/decode and length boundaries.  
- **Diversity constraints:** property‑based tests.  
- **Coverage gates:** statements 90%, branches 85%, functions 90%.  
- **CI gates:** bundle budgets, SBOM, CodeQL, SLSA provenance, a11y snapshots green.


---

## 19) Security, Compliance & Provenance

- **CSP strict** templates; SRI required for embed scripts.  
- DOM sanitization for rich text; no inline event handlers.  
- SBOM in CI; CodeQL; SLSA ≥ Level 2 provenance; independent pen‑test pre‑GA.  
- Region/data‑residency per tenant; default US.  
- Third‑party code execution **not supported** in v1.5.


---

## 20) Operations & SLOs

- **SLOs:** API availability 99.9%; P95 `/events` edge‑hit ≤ 300 ms; **Composer P95 ≤ 300 ms**; **chat→hero P99 ≤ 900 ms**.  
- **Runbooks:** provider outage (serve stale + banner), breaker tuning, cache poison mitigation, CMP outage behavior.  
- **Public SLO dashboards:** Metabase boards per tenant (read‑only).


---

## 21) Defaults (resolved; formerly “Open Questions”)

- **CitySpark rate‑limit budgets:** 10 rps peak per tenant (burst), 240 rpm sustained; breaker thresholds aligned.  
- **Sitemap ISR cadence:** 15 minutes (tenant override 5–60).  
- **GeoIP provider:** MaxMind GeoIP2 City (anonymized); fallback to tenant market.  
- **CMP adapters:** OneTrust and Sourcepoint (IAB TCF v2.2).  
- **OLAP store:** ClickHouse (clustered) powering Metabase; 13‑month retention + rollups.


---

## 22) Deliverables & Acceptance Criteria (v1.5)

- **Embed SDK 1.5** (UMD/ESM) with Shadow‑DOM default, **Preact + compat**, section themes, basePath `/events`; composer streaming; expanded events; budgets pass.  
- **AI Interpreter + Composer** services with model routing, pinned models, offline evals; latency budgets & fallback enforced.  
- **URL‑persisted plans** (encode/decode, short IDs); deterministic `planHash`.  
- **Blocks:** Map Grid and Promo Slot added; all blocks render in Shadow‑DOM embed and Light‑DOM fragments.  
- **CitySpark adapter** with canonicalization, facets, quotas, retries, breaker; OTel metrics.  
- **SEO:** indexable non‑AI pages; sitemaps; **strict CSP** for fragments.  
- **A11y:** suite green including Map Grid/Promo Slot flows.  
- **Analytics:** expanded schema live; Metabase dashboards deployed.  
- **Policy:** **No iframe support** is documented and enforced across SDK/docs.


---

## 23) Implementation Work Breakdown

1) **AI:** Implement Composer; golden tests; latency budgets; fallback rules.  
2) **Platform/SDK:** Plan encode/decode; block hydration events; `hydrateNext`; router persistence; Shadow‑DOM parity; Portal container tests.  
3) **Experience:** Map Grid, Promo Slot; streamed hydration; diversity constraints; Ladle stories + axe.  
4) **Data:** CitySpark quotas & metrics; cache keys with `planHash`; sitemap cadence.  
5) **Infra/SecOps:** Strict CSP templates; analytics schema & ClickHouse; SLO dashboards; CMP adapters; GeoIP.  
6) **SEO:** fragments parity with hashed critical CSS; noindex policy for AI views; sitemaps with ISR.  
7) **QA:** a11y snapshots, map a11y, diversity tests; plan URL fuzzing; E2E chat→hero timing.


---

## 24) Appendix

### A) Example embed snippet (with plan URL)
```html
<div id="events-hub"></div>
<script async src="https://cdn.your-cdn.com/hub-embed@1.5/hub-embed.umd.js"
        integrity="sha384-REPLACE_WITH_SRI" crossorigin="anonymous"></script>
<script>
  (async function () {
    const cfgUrl = "https://config.your-domain.com/v1/tenant/{TENANT_ID}.json";
    const cfg = await (await fetch(cfgUrl)).json();
    const qs = new URLSearchParams(location.search);
    const planParam = qs.get("plan") || (qs.get("p") ? await (await fetch(`/v1/plan/${qs.get("p")}`)).text() : null);
    const initialPage = planParam
      ? (await (await fetch("/v1/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dsl: decodePlan(planParam), tenantId: cfg.tenantId })
        })).json()).page
      : cfg.initialPage;

    await HubEmbed.create({
      el: "#events-hub",
      initialState: { page: initialPage, catalog: cfg.catalog },
      config: {
        useShadowDom: true,
        theme: cfg.theme.tokens,
        basePath: cfg.routing.basePath || "/events",
        section: cfg.theme.defaultSection || "default"
      },
      onEvent: (e) => window.__analytics?.enqueue(e)
    });
  })();
</script>
```

### B) Diversity constraints — pseudo‑code
```ts
function enforceDiversity(items: EventV21[]): EventV21[] {
  const byVenue = new Map<string, number>();
  const byDay = new Map<string, number>();
  const out: EventV21[] = [];
  for (const ev of items) {
    const v = ev.venue?.name?.toLowerCase() || "unknown";
    const d = new Date(ev.startsAt).toISOString().slice(0,10);
    if ((byVenue.get(v) ?? 0) >= 2) continue;
    if ((byDay.get(d) ?? 0) >= 3) continue;
    out.push(ev);
    byVenue.set(v, (byVenue.get(v) ?? 0) + 1);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  return out;
}
```

### C) Promo analytics payloads
```ts
type PromoImpression = { type: "promo_impression"; promoId: string; blockId: string; visiblePct: number };
type PromoClick      = { type: "promo_click"; promoId: string; blockId: string };
```

### D) Plan encode/decode outline
```ts
import { compressToUint8Array, decompressFromUint8Array } from "zstd-lite";
export function encodePlan(plan: object) {
  const json = new TextEncoder().encode(JSON.stringify(plan));
  const out  = compressToUint8Array(json);
  return base64url(out);
}
export function decodePlan(param: string) {
  const bytes = base64urlDecode(param);
  return JSON.parse(new TextDecoder().decode(decompressFromUint8Array(bytes)));
}
```

### E) Portal container hook (reference)
```ts
// packages/ui/portal.ts
import { createContext, useContext } from 'preact/compat';

export const PortalCtx = createContext<ShadowRoot | null>(null);

export function usePortalContainer(): ShadowRoot {
  const root = useContext(PortalCtx);
  if (!root) throw new Error('Portal container not available');
  return root;
}
// SDK side: <PortalCtx.Provider value={shadowRoot}>{children}</PortalCtx.Provider>
// Radix usage: <Dialog.Portal container={usePortalContainer() as unknown as HTMLElement}>…</Dialog.Portal>
```
