# Events Hub — Pre‑Seed Build Spec (Repository Starter Kit)

**Purpose.** Produce a fully-initialized monorepo scaffold (code + docs + CI + guardrails) so that a subsequent build prompt can one‑shot the complete application using the full v1.5 spec. This pre‑seed codifies architecture, constraints, folder layout, contracts, budgets, and checks.

**Source of truth.** This pre‑seed is derived from the **Events Hub — Product Build Specification v1.5** (uploaded) and must not contradict it. Key requirements below are paraphrased from that document.

---

## 0) Hard, Non‑Negotiable Constraints (pin these in code, docs, CI)

- **No iframe support.** Embeds are via a **no‑iframe SDK** using **Shadow DOM** isolation with Constructable Stylesheets. (Policy in v1.5.)
- **Embed tech:** **Preact + `preact/compat` in the embed**, while **Admin & blocks use React**.
- **SEO parity:** Non‑AI pages render **Light‑DOM fragments** with **strict CSP**. Critical CSS for fragments: **hashed ≤ 6 kB** + exactly **one deferred stylesheet**; **no `unsafe-inline`**.
- **AI flow:** **Interpreter → Composer**. Composer is **deterministic**, streams sections (hero → rows), and sets **`planHash`** in PageDoc meta. **Chat→hero P99 ≤ 900 ms**; **Composer P95 ≤ 300 ms** with **keyword fallback** on budget breach.
- **URL‑persisted plans:** `?plan=<base64url(zstd(json))>`; if too long, **shortId** `?p=...` with server lookup. **Canonicalization** + **`planHash`**. Helpers `encodePlan/decodePlan`.
- **Blocks to ship:** include **Map Grid** (list↔map, clustered, a11y parity) and **Promo Slot** (sponsored/house, measurement & safety).
- **Analytics events (expanded):** `card_impression`, `card_click`, `ticket_outbound_click`, `promo_impression`, `promo_click`, `chat_open`, `chat_submit`, `chat_latency_ms`, `ai_fallback_triggered`.
- **Provider layer:** CitySpark adapter with canonicalization, facets, quotas, retries + **circuit breaker**; **edge cache keys** include `planHash` + `composerVersion`.
- **Diversity constraints per row:** ≤2 events per venue; ≤3 events per day (7‑day window); category dominance ≤60% unless single‑category query.
- **A11y gate:** **WCAG 2.2 AA** including Map Grid parity; overlays mount to SDK portal; keyboard/focus/ARIA rules; reduced motion.
- **Budgets:** SDK UMD ≤ **45 kB gzip** (incl. Preact + compat); ESM ≤ 35 kB; per‑block ≤ 15 kB; tokens ≤ 12 kB. Time: first render ≤ 1.5 s, interactive ≤ 2.5 s; provider timeout 2 s; retries(3)+jitter.
- **Observability & security:** OTel spans (client+server), **SBOM**, **CodeQL**, **SLSA ≥ L2 provenance**, sanitization, CSP. Sitemaps ISR **15 m**. Quotas: 10 rps burst / 240 rpm sustained per tenant.

Pin the above in `ai/constraints.md`, ADRs, CI gates, and lints.

---

## 1) Monorepo Layout (Turborepo + pnpm)

Create this exact structure:

```
root/
├─ README.md
├─ LICENSE
├─ .editorconfig
├─ .gitignore
├─ .gitattributes
├─ .nvmrc
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ PRESEED_BUILD_SPEC.md                # this file (keep)
├─ docs/
│  ├─ product/spec-v1.5.md              # copy or link to source; mark as source of truth
│  ├─ engineering/
│  │  ├─ ARCHITECTURE.md
│  │  ├─ DECISIONS/
│  │  │  ├─ ADR-0001-no-iframes.md
│  │  │  ├─ ADR-0002-preact-embed.md
│  │  │  └─ ADR-0003-strict-csp-fragments.md
│  │  ├─ API/openapi.yaml
│  │  ├─ AI/dsl.md
│  │  ├─ AI/composer.md
│  │  └─ AI/plan-url.md
│  ├─ security/{SECURITY.md,THREAT_MODEL.md,PRIVACY.md}
│  └─ ops/{SLOs.md,OBSERVABILITY.md,RUNBOOKS/{provider-outage.md,cmp-outage.md,cache-poisoning.md}}
├─ ai/
│  ├─ agents.md
│  ├─ constraints.md
│  ├─ tools.json
│  ├─ prompts/{interpret.system.md,compose.system.md,code.system.md,style.md}
│  ├─ context/{facts.md,snippets/{page-schema.ts,events.ts,sdk-events.ts}}
│  ├─ evals/{golden-queries.jsonl,composer-goldens/README.md,scoring.md}
│  └─ safety/pii-policy.md
├─ apps/
│  ├─ admin/             # Next.js (React) stub + README
│  ├─ demo-host/         # host demo + embed snippet
│  └─ api/               # BFF: config, content, AI, analytics
├─ packages/
│  ├─ ui/
│  ├─ embed-sdk/         # Preact + compat; Shadow DOM; events
│  ├─ block-runtime/
│  ├─ block-registry/
│  ├─ blocks/            # hero, collections, microcalendar, detail, map-grid, promo-slot
│  ├─ page-schema/       # Zod contracts (BlockInstance, PageDoc)
│  ├─ data-providers/    # CitySpark adapter skeleton
│  ├─ ai-interpreter/
│  ├─ ai-composer/
│  ├─ router-helpers/    # plan encode/decode; basePath; URL<->DSL
│  ├─ telemetry/         # analytics + OTel client
│  ├─ tokens/            # CSS variables; Tailwind config (preflight off)
│  ├─ security/          # sanitizer, CSP helpers
│  └─ cli/               # schematics, bundle-check, sbom
├─ tooling/
│  ├─ config/{eslint.config.mjs,prettier.config.cjs,tsconfig.base.json,ladle.config.mjs,playwright.config.ts,vitest.config.ts,axe.config.mjs,codeql.yml}
│  └─ scripts/{bootstrap.mjs,bundle-check.mjs,sbom.mjs,provenance.mjs}
├─ dev/
│  ├─ docker-compose.yml # ClickHouse + Metabase + MSW edge proxy
│  └─ msw/{handlers.ts,scenarios.md}
└─ .github/
   ├─ ISSUE_TEMPLATE/{bug_report.md,feature_request.md}
   ├─ pull_request_template.md
   ├─ CODEOWNERS
   └─ workflows/{ci.yml,release-drafter.yml,codeql.yml}
```

---

## 2) Package and Contract Minimums (compile-ready)

Implement minimal but compiling stubs with tests for these core contracts:

### 2.1 `packages/page-schema/`
- `block.ts` and `page.ts` exporting Zod **`BlockInstance`** and **`PageDoc`** types per v1.5 (keys: `key`, `id`, `order`, `layout`, `data`, `meta`; PageDoc includes `meta.planHash?` & `version:"1.5"`). Include unit tests.

### 2.2 `packages/embed-sdk/`
- Preact + `preact/compat` setup; ShadowRoot mounting; Constructable Stylesheets loader; **Portal container** inside ShadowRoot for overlays.  
- Public API:
  ```ts
  export type CreateArgs = { el: HTMLElement | string; initialState: PageDoc | { page: PageDoc; catalog?: any };
    onEvent?: (e: SdkEvent)=>void; config?: { useShadowDom?: boolean; theme?: Record<string,string>; basePath?: string; section?: string } };
  export interface EmbedHandle { update(next: PageDoc): void; addBlock(b: BlockInstance, i?: number): void; replaceAll(b: BlockInstance[]): void; navigate(to: string, o?:{replace?:boolean}): void; destroy(): void; hydrateNext(blockId: string): Promise<void>; }
  export async function create(args: CreateArgs): Promise<EmbedHandle>;
  ```
- Event union contains expanded analytics and SDK lifecycle events (`sdk.blockHydrated`, `sdk.blockDepleted`, `sdk.sectionChanged`, plus analytics).
- Router helpers: basePath `/events` default; URL ↔ state sync for detail routes.

### 2.3 `packages/ai-interpreter/` and `packages/ai-composer/`
- **Interpreter**: define `FilterDSL` + `AiQuery` types; stub `interpret()` that validates/normalizes (no network).  
- **Composer**: deterministic `compose(dsl, tenant)` stub returning a minimal `PageDoc` with hero + 2 rows, `meta.planHash`, and **`cursors`** map; implement **streaming shape** (interface), not transport. Include golden test placeholders.

### 2.4 `packages/router-helpers/`
- `encodePlan(plan)`, `decodePlan(param)` using base64url + zstd‑lite (stub with interface + TODO for compression).  
- `canonicalizePlan()` ensuring stable hashing; `planHash(plan)`.

### 2.5 `packages/data-providers/`
- CitySpark adapter interface with `byRange`, `search`, `bySlug`, returning typed results, `facets`, and `nextCursor`. Put **canonicalization** utility including `canonicalId` computation. Include circuit breaker interface & retry policy constants.

### 2.6 `packages/blocks/`
- Create stubs for **hero**, **collections**, **microcalendar**, **detail**, **map-grid**, **promo-slot**.  
- For **map-grid**, include a11y stub (list fallback) and a trivial pin cluster mock. For **promo-slot**, include impression/click event emitters.

### 2.7 `apps/demo-host/`
- Minimal host page with an **embed snippet** that loads UMD (locally) and demonstrates `?plan=...`/`?p=...` decoding path and a default initial page. Include a README explaining basePath overrides.

### 2.8 `apps/api/`
- Express/Next API stub with endpoints: `/v1/interpret` (validates body, returns DSL), `/v1/compose` (calls composer stub), `/v1/plan/:shortId` (in‑memory map), `/v1/fragment/:tenantId` (returns simple HTML+JSON‑LD for non‑AI route), `/v1/sitemap/:tenantId.xml` (fake entries), `/v1/analytics/events` (accept & log). Wire **OTel** middleware hooks (no external exporters).

### 2.9 `apps/admin/`
- Next.js 15 skeleton (React) with stub pages: Config, Pages, Themes. No backend; just file‑backed mocks.

---

## 3) AI Context Pack (must exist before coding work)

Create:

- **`ai/agents.md`** – roles (Architect, Builder, Reviewer), allowed tools (fs, test runners), **hard constraints**, **Definition of Done**, and **commit/PR rules**.  
- **`ai/constraints.md`** – restate the “Hard, Non‑Negotiable Constraints” from §0 (short, MUST/MUST NOT).  
- **`ai/tools.json`** – list tool contracts for `/v1/interpret` and `/v1/compose` (method, path, schema refs).  
- **`ai/prompts/*`** – minimal system prompts for interpret/compose/code that point to local files for facts.  
- **`ai/context/facts.md`** – short bullet summary (budgets, SLOs, CSP requirements, diversity rules, analytics taxonomy).  
- **`ai/context/snippets/*`** – paste the types for PageDoc/BlockInstance/DSL/SdkEvent so generations are type‑correct.  
- **`ai/evals/*`** – create placeholders: `golden-queries.jsonl` (≥200 to be added later), `composer-goldens/README.md`, and `scoring.md` (≤1% tolerated regression).

---

## 4) Docs to Seed Now

- **`docs/product/spec-v1.5.md`** – add a header stating: “Copy the canonical v1.5 spec here; until then this file links to the internal doc” and include the delta list (Composer, plan URL, Map Grid, Promo Slot, strict CSP, analytics expansion, AI chat) to eliminate ambiguity.  
- **`docs/engineering/ARCHITECTURE.md`** – Host → SDK → Block Runtime → Provider → Edge; Admin/Pages; AI; Analytics; SEO. Short diagram + bullets.  
- **`docs/engineering/DECISIONS/*`** – ADRs for **No iframes**, **Preact embed**, **Strict CSP for fragments** with rationales referencing the spec.  
- **`docs/engineering/AI/*`** – `dsl.md`, `composer.md`, `plan-url.md` with the contracts and helper signatures from §2.3/2.4.  
- **`docs/ops/*`** – SLOs (Composer P95 ≤ 300 ms; Chat→hero P99 ≤ 900 ms; edge hits), runbooks (provider outage, CMP outage, cache poisoning), observability plan (OTel spans taxonomy).  
- **`docs/security/*`** – SECURITY, THREAT_MODEL, PRIVACY summarizing CSP, sanitizer, SBOM/CodeQL/SLSA, residency defaults.

---

## 5) CI / Tooling / Quality Gates (required in first commit)

Create **`.github/workflows/ci.yml`** to run on PR + main:

- Setup: `pnpm i -g pnpm@latest`, `pnpm install --frozen-lockfile`, cache, `turbo run build --filter=...`.  
- Steps (all required to pass):
  - **Typecheck** (tsc), **Lint** (eslint), **Format check** (prettier), **Unit** (vitest), **Stories + axe** (Ladle storybook snapshots with axe=0), **E2E** (Playwright happy path).  
  - **Bundle budgets** (run `tooling/scripts/bundle-check.mjs` to assert UMD/ESM/blocks/tokens size ceilings).  
  - **A11y snapshots** (must be zero violations).  
  - **SBOM** generation + upload artifact.  
  - **CodeQL** init/analyze (separate workflow ok).  
  - **Provenance** (SLSA‑style attestation; stub script).  
- Protect `main`: all checks required, dismiss stale approvals on push.  
- Add **release‑drafter** and `CODEOWNERS`.

Create `tooling/config/*` for eslint, prettier, tsconfig, ladle, playwright, vitest, axe; and `tooling/scripts/*` for bootstrap, sbom, provenance, bundle-check.

---

## 6) Testing Strategy (skeletons now, data later)

- **Unit:** Vitest + RTL; Zod contracts; provider mapping; tz/DST fuzz.  
- **Stories:** Ladle states (empty/loading/populated/error) + axe snap.  
- **Network:** **MSW** to stub CitySpark; chaos toggles (latency, 429/5xx).  
- **E2E (Playwright):** Embed mount & Shadow DOM; basePath override; back/forward parity; URL filter persistence; deep‑link detail; **chat→hero timing budget** path + **keyword fallback**; SEO fragment presence; keyboard‑only and focus return; **map‑grid** accessibility; portal overlays.  
- **Composer contracts:** DSL→PageDoc golden fixtures (placeholders now).  
- **Plan URL fuzz:** encode/decode length boundaries.  
- **Diversity:** property‑based tests.  
- **Coverage gates:** statements 90%, branches 85%, functions 90%.

---

## 7) Minimal Types & Snippets to Include (copy these into `ai/context/snippets/`)

> These guarantee type‑correct generations and compile‑ready packages.

```ts
// page-schema.ts
import { z } from "zod";
export const BlockInstance = z.object({
  key: z.string().min(1),
  id: z.string(),
  order: z.number().int(),
  layout: z.object({ fullWidth: z.boolean().default(true), style: z.record(z.any()).optional() }),
  data: z.record(z.any()),
  options: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional()
});
export type BlockInstance = z.infer<typeof BlockInstance>;

export const PageDoc = z.object({
  id: z.string(),
  title: z.string().min(1),
  path: z.string().min(1),
  blocks: z.array(BlockInstance),
  updatedAt: z.string(),
  version: z.literal("1.5"),
  tenantId: z.string(),
  meta: z.object({ planHash: z.string().optional(), composerVersion: z.string().optional() }).optional()
});
export type PageDoc = z.infer<typeof PageDoc>;
```

```ts
// events.ts (analytics envelope + event union)
export type AnalyticsEnvelope = { tenantId: string; sessionId: string; ts: number; route: string; section?: string; planHash?: string; device?: string; referrer?: string };
export type SdkEvent =
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

```ts
// dsl.ts
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
export type AiQuery = { intent: "search"|"qa"|"navigate"; filters: FilterDSL; followUpOf?: string; text?: string; version: "dsl/1" };
```

---

## 8) Security, Privacy, SEO, Ops (seed content)

- **CSP templates** for server fragments (strict, with hashed critical CSS and SRI for scripts).  
- **Sanitizer** policy for any rich text; no inline handlers.  
- **Privacy & CMP** adapters listed (OneTrust/Sourcepoint), GeoIP details, residency defaults (US).  
- **Sitemaps** ISR cadence 15m (tenant override).  
- **OTel** span names (sdk.*, provider.cityspark.*, composer.*, cache.*, analytics.*).  
All reflect v1.5.

---

## 9) Developer Experience

- **README.md** quickstart: `pnpm i`, `pnpm -w build`, `pnpm -w test`, `pnpm -w dev` (runs demo-host + api with MSW).  
- **CONTRIBUTING.md** (generated inside README or as separate) describing how to add a block, register, run tests, satisfy budgets.  
- **Pull request template** with checkboxes for gates (typecheck/lint/unit/stories+axe/e2e/bundles/latency/a11y) and screenshots/traces.

---

## 10) Acceptance Criteria for the Pre‑Seed

- `pnpm -w build` succeeds; `pnpm -w test` runs unit + story + e2e stubs; a11y snaps green (no violations on stories).  
- `apps/demo-host` renders an embedded “hello world” PageDoc via SDK with Shadow DOM on.  
- `apps/api` responds to `/v1/interpret` and `/v1/compose` with valid shapes and logs OTel spans; `/v1/fragment/:tenantId` returns HTML + JSON‑LD.  
- **Bundle budgets** script is wired (even if bundles are tiny); CI fails on ceilings breach.  
- **ADR**s, **AI context**, **security & ops docs**, **CSP** templates, **SLOs**, **runbooks**, and **analytics taxonomy** are present and internally consistent with v1.5.

---

## 11) Output Format (strict)

When you (the agent) respond:

1) Print **REPO MAP** (directory tree).  
2) Print **FILES** — one block per file:
```
=== relative/path.ext ===
```<language>
<full contents>
```
```
3) End with **POST‑CREATE CHECKLIST**: commands to run to bootstrap, verify, and execute the CI locally (pnpm/turbo/playwright/ladle/axe/codeql/sbom).

**Do not** invent iframes, frameworks, or cloud dependencies. **Do** keep everything offline and deterministic.

---

## 12) Notes for Future “Full Build” Prompt (FYI for authors)

This pre‑seed intentionally stops at framework wiring. The **future build prompt** will point at `docs/product/spec-v1.5.md` as the canonical product spec to implement features (Composer rules, Map Grid behavior, Promo safety rails, diversity constraints, provider quotas, SEO ISR cadence, etc.).

