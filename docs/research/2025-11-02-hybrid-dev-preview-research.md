---
title: "Hybrid Dev + Preview Implementation Map"
date: "2025-11-02 13:51 EST"
researcher: "ChatGPT Codex 5"
question: "How does the current codebase implement the Hybrid Dev Servers + Preview Deployments specification?"
scope: "Reviewed hybrid-dev specification plus apps/demo-host, apps/admin, apps/api, and shared packages to document the current local/preview workflow."
assumptions: ["No live preview deployments were inspected; findings derive from repository state only.", "Secrets and external services are mocked or stubbed in local code."]
repository: "ryanderose/cs-eventhub"
branch: "admin-mvp/dexplan"
commit_sha: "3cd1169"
status: "complete"
last_updated: "2025-11-02"
last_updated_by: "ChatGPT Codex 5"
directories_examined: ["docs/", "apps/demo-host", "apps/admin", "apps/api", "packages/ai-composer", "packages/embed-sdk", "packages/page-schema", "packages/data-providers", "tooling/config", "apps/api/__tests__"]
tags: ["research", "codebase", "hybrid-dev", "preview"]
---

# Research: Hybrid Dev + Preview Implementation Map

**Planning Hand-off (TL;DR)**  
- Local lane runs through workspace scripts: `pnpm dev:stack` starts Next dev servers for demo-host/admin and `vercel dev` for the API alongside embed/CDN helpers, matching the spec’s fast loop goal.  
- Default-plan management spans demo-host fallback fetching, admin reorder UI, and API persistence backed by encoded plans and KV/memory caches; concurrency handling and optimistic guards are already implemented.  
- Runtime-coupled behavior (composer, interpreter, fragment, config) lives in Vercel functions with shared packages for plan shaping, while automated coverage today is Vitest-heavy and Playwright is configured for a single Chromium profile.

## Research Question (from spec)
Document how the repository currently realizes the “Hybrid Dev Servers + Preview Deployments” specification, focusing on where code lives, how lanes operate, and how components interact.

## System Overview (what exists today)
The monorepo uses pnpm + Turborepo to orchestrate Next.js apps (`apps/demo-host`, `apps/admin`) and a Vercel-function-based API (`apps/api`), with shared packages providing schema validation, embedding, AI composition, telemetry, and provider adapters. The architecture snapshot aligns apps/packages with deterministic build contracts and quality gates. — docs/engineering/ARCHITECTURE.md:1-116 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/docs/engineering/ARCHITECTURE.md#L1-L116)

## Detailed Findings

### Docs & Decisions
- Hybrid spec defines local “Lane L” dev servers, preview escalation criteria, Playwright/contract test expectations, and port/environment conventions. — docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md:27-200 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md#L27-L200)
- Architecture snapshot maps apps, shared packages, and CI gates back to spec guardrails, emphasizing deterministic artifacts and telemetry/security baselines. — docs/engineering/ARCHITECTURE.md:8-116 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/docs/engineering/ARCHITECTURE.md#L8-L116)

### Domain & Data
- Page schema package codifies block kinds, layout defaults, analytics metadata, and event payloads used across embed and API. — packages/page-schema/src/index.ts:1-200 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/page-schema/src/index.ts#L1-L200)
- Router helpers handle plan compression (zstd/brotli/plain) and URL decoding to keep encoded plans within transport limits. — packages/router-helpers/src/index.ts:1-149 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/router-helpers/src/index.ts#L1-L149)
- AI composer builds default plans from CitySpark data, enforcing diversity limits, enriching with SEO fragments, and returning hashed PageDocs. — packages/ai-composer/src/index.ts:1-420 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/ai-composer/src/index.ts#L1-L420)
- Data provider stub implements quota enforcement, in-memory caching, and deterministic event generation feeding the composer pipeline. — packages/data-providers/src/index.ts:1-200 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/data-providers/src/index.ts#L1-L200)
- Telemetry package formats SDK analytics envelopes and event variants referenced by embed/UI surfaces. — packages/telemetry/src/index.ts:1-32 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/telemetry/src/index.ts#L1-L32)

### Entry Points & Routing
- Root scripts run tasks through `scripts/turbo-run.sh`; `pnpm dev:stack` wires demo-host Next dev (`demo.localhost`), API via `vercel dev`, embed build, and CDN watcher. — package.json:6-18 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/package.json#L6-L18)
- Demo host Next app loads the embed SDK (linked or external), fetches default plans via env-based API URLs, and exposes status telemetry. — apps/demo-host/app/page.tsx:1-252 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/demo-host/app/page.tsx#L1-L252)
- Admin blocks route fetches the default plan on the server and hydrates a client reorder interface. — apps/admin/app/blocks/page.tsx:1-18 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/admin/app/blocks/page.tsx#L1-L18)
- API exposes Vercel functions for default-plan fetch/update, encoded-plan lookup, composer, interpreter, fragment rendering, and tenant config. — apps/api/api/v1/plan/default.ts:1-214 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/plan/default.ts#L1-L214); apps/api/api/v1/plan/[id].ts:1-27 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/plan/%5Bid%5D.ts#L1-L27); apps/api/api/v1/compose.ts:1-227 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/compose.ts#L1-L227); apps/api/api/v1/interpret.ts:1-21 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/interpret.ts#L1-L21); apps/api/api/v1/fragment.ts:1-74 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/fragment.ts#L1-L74); apps/api/api/config/tenants/[tenant].ts:1-95 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/config/tenants/%5Btenant%5D.ts#L1-L95)

### Core Logic
- Demo host’s `useDefaultPlan` hook retries `/v1/plan/default` with optimistic fallbacks, respecting disabled modes and plan hash continuity, while rendering sample plans when the API is unavailable. — apps/demo-host/lib/useDefaultPlan.ts:1-198 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/demo-host/lib/useDefaultPlan.ts#L1-L198)
- Admin `BlocksClient` manages drag/drop ordering, analytics hooks, optimistic save logic, 412 conflict handling, and reset flows against the same endpoint. — apps/admin/app/blocks/BlocksClient.tsx:1-321 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/admin/app/blocks/BlocksClient.tsx#L1-L321)
- API default-plan handler validates payloads, enforces contiguous ordering, checks plan hashes, and rewrites plans using seed templates before persisting. — apps/api/api/v1/plan/default.ts:82-210 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/plan/default.ts#L82-L210)
- Plan store encodes canonical PageDocs, persists to Vercel KV or in-memory caches, and seeds fallback content (`block-one`/`block-who`/`block-three`). — apps/api/src/lib/pages-store.ts:1-170 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/src/lib/pages-store.ts#L1-L170)
- Composer endpoint leverages shared `compose` logic, caches responses in-memory, persists encoded plans if too large to inline, and surfaces cache keys. — apps/api/api/v1/compose.ts:143-227 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/compose.ts#L143-L227)
- Embed SDK attaches a shadow root, renders block sections, emits analytics events, and writes encoded plans into the browser URL. — packages/embed-sdk/src/index.ts:1-214 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/embed-sdk/src/index.ts#L1-L214)

### Integrations
- API plan storage and pointer caching rely on `@vercel/kv`, with memory-store fallbacks and TTL configuration. — apps/api/src/lib/plan.ts:1-99 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/src/lib/plan.ts#L1-L99)
- CitySpark client simulates provider quota, circuit breaking, caching, and event hydration; composer telemetry hooks emit debug metrics. — packages/data-providers/src/index.ts:56-200 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/data-providers/src/index.ts#L56-L200); packages/ai-composer/src/index.ts:22-40 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/ai-composer/src/index.ts#L22-L40)
- Tenant config endpoint signs payloads when `CONFIG_SIGNING_SECRET` is set and exposes CDN/embed manifests per mode. — apps/api/api/config/tenants/[tenant].ts:20-94 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/config/tenants/%5Btenant%5D.ts#L20-L94)

### Configuration & Secrets
- Root scripts delegate to Turborepo; app-level package.json files declare simple `next dev` commands without explicit port flags (demo-host overrides hostname). — package.json:6-18 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/package.json#L6-L18); apps/demo-host/package.json:5-11 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/demo-host/package.json#L5-L11); apps/admin/package.json:5-11 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/admin/package.json#L5-L11)
- API dev/start scripts use `vercel dev`, diverging from the spec’s dedicated local TS server lane. — apps/api/package.json:5-11 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/package.json#L5-L11)
- Tenant descriptors read `CONFIG_*` env vars to fill manifest, embed src, API base, and CDN origin. — apps/api/src/config/tenants.ts:11-49 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/src/config/tenants.ts#L11-L49)
- Plan encoding respects `PLAN_INLINE_LIMIT` and `PLAN_CACHE_TTL_SECONDS`, toggling KV persistence or in-memory caches per environment. — apps/api/src/lib/plan.ts:18-88 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/src/lib/plan.ts#L18-L88)

### Tests & Observability
- Vitest workspace config runs tests across apps and packages with jsdom and coverage reports. — tooling/config/vitest.config.ts:4-18 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/tooling/config/vitest.config.ts#L4-L18)
- API default-plan tests cover seeding, reorder success, conflict retries, and invalid ordering scenarios. — apps/api/__tests__/default-plan.test.ts:42-155 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/__tests__/default-plan.test.ts#L42-L155)
- Telemetry helper wraps OpenTelemetry tracer access, providing noop spans when tracing is unavailable. — apps/api/src/lib/telemetry.ts:1-22 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/src/lib/telemetry.ts#L1-L22)
- Playwright config currently defines a single Chromium project pointing at `./tests`, without preview-local differentiation. — tooling/config/playwright.config.ts:1-16 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/tooling/config/playwright.config.ts#L1-L16)

### API/UI Surface (as applicable)
- Demo host renders embed container, status metrics, and exposes env-driven config values for observers; embed module handles analytics events for filters/chat. — apps/demo-host/app/page.tsx:205-252 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/demo-host/app/page.tsx#L205-L252); packages/embed-sdk/src/index.ts:94-214 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/embed-sdk/src/index.ts#L94-L214)
- Admin UI presents reorderable block list with keyboard/drag controls, save/reset footer, and plausible analytics hooks. — apps/admin/app/blocks/BlocksClient.tsx:66-249 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/admin/app/blocks/BlocksClient.tsx#L66-L249)
- API surface area includes `/v1/plan/default`, `/v1/plan/[id]`, `/v1/compose`, `/v1/interpret`, `/v1/fragment`, and `/config/tenants/[tenant]`, aligning with spec endpoints for plan delivery, encoding, and config retrieval. — apps/api/api/v1/plan/default.ts:82-214 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/plan/default.ts#L82-L214); apps/api/api/v1/plan/[id].ts:1-27 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/plan/%5Bid%5D.ts#L1-L27); apps/api/api/v1/compose.ts:143-227 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/compose.ts#L143-L227); apps/api/api/v1/interpret.ts:7-20 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/interpret.ts#L7-L20); apps/api/api/v1/fragment.ts:48-74 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/fragment.ts#L48-L74); apps/api/api/config/tenants/[tenant].ts:63-95 (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/config/tenants/%5Btenant%5D.ts#L63-L95)

## Code References (Index)
- package.json:6-18 — Workspace scripts, including `dev:stack` hybrid runner (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/package.json#L6-L18)  
- apps/demo-host/app/page.tsx:1-252 — Demo host embed bootstrap and plan handling (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/demo-host/app/page.tsx#L1-L252)  
- apps/admin/app/blocks/BlocksClient.tsx:1-321 — Admin default-plan reorder client (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/admin/app/blocks/BlocksClient.tsx#L1-L321)  
- apps/api/api/v1/plan/default.ts:1-214 — Default-plan API controller (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/plan/default.ts#L1-L214)  
- packages/ai-composer/src/index.ts:1-420 — Composer pipeline producing hybrid plans (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/ai-composer/src/index.ts#L1-L420)

## Architecture & Patterns (as implemented)
Current implementation keeps business logic in packages consumed by Vercel functions and Next apps, with plan data encoded via shared helpers and persisted in KV or memory. The API exposes both Node and Edge runtimes for plan delivery (`nodejs` default-plan handlers, Edge fragments) and relies on optimistic concurrency plus deterministic seed templates to keep admin edits safe. Local tooling leans on Turborepo task orchestration, while dev workflows couple Next dev servers with `vercel dev` rather than a bespoke Express adapter.

## Related Documentation
- docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md:1-546 — Hybrid dev + preview specification (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md#L1-L546)
- docs/engineering/ARCHITECTURE.md:1-116 — Architecture snapshot aligned with product spec (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/docs/engineering/ARCHITECTURE.md#L1-L116)

## Open Questions
- (none)

## Follow-up (append only, as needed)
- [2025-11-02 13:51] Initial catalog of hybrid dev + preview implementation.
- [2025-11-02 14:05] Stakeholder clarified Playwright lane strategy: keep a single config with project families. Local projects (webServer) run full suites with `grepInvert: /@preview/`; Preview projects (no webServer, `baseURL=PREVIEW_URL`) run smoke tests tagged `@preview`, allowing shared files and CI to drive the preview lane when runtime-coupled changes occur.
- [2025-11-02 14:12] Spec author confirmed there is no separate local TS server adapter today; Lane L guidance was aspirational. Current workflow relies on `vercel dev` for the API, so no further adapter search is required.

---

### Evidence Log
- docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md:27-200 — Hybrid dev lanes & tooling expectations (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md#L27-L200)
- package.json:6-18 — Monorepo scripts including `dev:stack` hybrid runner (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/package.json#L6-L18)
- apps/demo-host/app/page.tsx:1-252 — Demo host embed + default-plan loading flow (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/demo-host/app/page.tsx#L1-L252)
- apps/admin/app/blocks/BlocksClient.tsx:1-321 — Default-plan reorder UI logic (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/admin/app/blocks/BlocksClient.tsx#L1-L321)
- apps/api/api/v1/plan/default.ts:1-214 — Default-plan API guardrails and persistence (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/plan/default.ts#L1-L214)
- apps/api/src/lib/pages-store.ts:1-170 — Plan encoding, KV integration, and seed blocks (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/src/lib/pages-store.ts#L1-L170)
- apps/api/api/v1/compose.ts:143-227 — Composer endpoint caching and persistence (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/api/v1/compose.ts#L143-L227)
- packages/ai-composer/src/index.ts:1-420 — AI-driven plan assembly and diversity enforcement (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/packages/ai-composer/src/index.ts#L1-L420)
- tooling/config/playwright.config.ts:1-16 — Current Playwright project definition (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/tooling/config/playwright.config.ts#L1-L16)
- apps/api/__tests__/default-plan.test.ts:42-155 — Test coverage for plan seeding, reordering, and conflicts (https://github.com/ryanderose/cs-eventhub/blob/3cd1169/apps/api/__tests__/default-plan.test.ts#L42-L155)
