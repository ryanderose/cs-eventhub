---
title: "Admin Blocks & Default Embed Baseline"
date: "2025-10-31 11:20 EDT"
researcher: "ChatGPT Codex 5"
question: "Document how the admin landing view and default embed blocks behave today, covering block ordering and the data paths that drive apps/demo-host."
scope: "Reviewed apps/admin, apps/demo-host, apps/api (compose/plan/config), page schema and composer packages, data provider stubs, and supporting docs."
assumptions: ["Default embed API refers to the PageDoc consumed by apps/demo-host.", "Repository state 4c867ea reflects the deployed preview context."]
repository: "/Users/ryanderose/code/cs-eventhub"
branch: "master"
commit_sha: "4c867ea"
status: "complete"
last_updated: "2025-10-31"
last_updated_by: "ChatGPT Codex 5"
directories_examined: ["apps/admin/", "apps/demo-host/", "apps/api/", "packages/", "docs/"]
tags: ["research", "codebase", "admin", "embed"]
---

# Research: Admin Blocks & Default Embed Baseline

**Planning Hand‑off (TL;DR)**  
- Admin landing page renders a static `Events Hub Admin` view with a single `/blocks` link that already targets the `/blocks` relative route.  
- Demo host still hydrates from a local `samplePage`; the north star is to serve the default embed blocks from the API so admin tooling and the demo host share a canonical payload.  
- The interim API response should return three stub blocks named `block one`, `block who`, and `block three`, giving the admin UI a simple drag-and-drop surface that updates block order without introducing a database.

## Research Question (from spec)
Describe the current state of the admin UI entry point, the default block list displayed through the embed on apps/demo-host, and the supporting APIs/configuration paths—strictly documenting what exists without prescribing changes.

## System Overview (what exists today)
Monorepo documentation outlines apps (`admin`, `demo-host`, `api`) and the supporting packages for schema, embed runtime, and composer pipelines that generate deterministic PageDoc plans rendered via the demo host embed for the `demo` tenant. `README.md:1` (4c867ea), `docs/engineering/ARCHITECTURE.md:10` (4c867ea).

## Detailed Findings

### Docs & Decisions
- Root README summarises the workspace purpose and quickstart flows — `README.md:1` (4c867ea).
- Architecture snapshot maps apps to packages, noting admin as the tenant console and embed runtime ordering — `docs/engineering/ARCHITECTURE.md:10` (4c867ea).
- Embed development guide explains linked/external modes and config endpoints referenced by the demo host — `docs/engineering/embed-dev.md:16` (4c867ea).

### Domain & Data
- PageDoc schema enforces block arrays, metadata, and plan cursors for embed plans — `packages/page-schema/src/index.ts:297` (4c867ea).
- Canonicalization reorders blocks by `order`, then key, and reindexes positions, guaranteeing deterministic plan hashes — `packages/page-schema/src/index.ts:338` (4c867ea).
- Each block instance includes `id`, `key`, `kind`, and a zero-based `order` property; canonicalization rewrites orders sequentially, so drag-and-drop should persist the updated array with contiguous integers — `packages/page-schema/src/index.ts:297` and `packages/page-schema/src/index.ts:338` (4c867ea).
- Sample plan in demo host defines concrete block instances with explicit `order` values and payloads for filter, hero, rails, map, promo, detail, and mini-chat blocks; this is the structure the API needs to return for the placeholder `block one`, `block who`, `block three` entries — `apps/demo-host/app/page.tsx:43` (4c867ea).

### Entry Points & Routing
- Admin homepage renders `Events Hub Admin`, descriptive copy, and a `/blocks` link from the root page component — `apps/admin/app/page.tsx:4` (4c867ea).
- No dedicated `/blocks` route exists in the admin `app/` directory, so the link currently resolves to a 404. Inspection (`apps/admin/app`) shows only `layout.tsx` and `page.tsx`; the upcoming drag-and-drop list will live here and must fetch the default block array from the API before rendering.
- Demo host App Router page mounts the embed container and status UI when the page component renders — `apps/demo-host/app/page.tsx:274` (4c867ea).
- Demo host SEO proxy handles `/fragment/[tenant]`, forwarding to `NEXT_PUBLIC_API_BASE` and hashing upstream CSS for ISR responses — `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:29` (4c867ea).

### Core Logic
- Demo host passes the inline `samplePage` to `bootstrapEmbed`, which calls the SDK with `initialPlan` and container theme tokens. Because this object is baked into the page component, no network call occurs today — `apps/demo-host/app/page.tsx:262` (4c867ea).
- Embed SDK hydrates Shadow DOM sections per plan block, emitting analytics events for block interactions — `packages/embed-sdk/src/index.ts:76` (4c867ea).
- The SDK immediately hydrates the provided `initialPlan` on `queueMicrotask`, ensuring the default block ordering appears without additional fetches — `packages/embed-sdk/src/index.ts:204` (4c867ea).
- Composer assembles PageDoc payloads with deterministic block ordering (AI dock, filter bar, hero, collections, microcalendar, detail, SEO, map, promo, mini-chat) and metadata for plan cursors; these responses can back a default API-powered embed once the inline stub is removed — `packages/ai-composer/src/index.ts:232` (4c867ea).
- Composer endpoint wraps the module, encodes canonical plans, optionally persists large payloads, and returns cached responses — `apps/api/api/v1/compose.ts:182` (4c867ea).
- Plan library canonicalizes and hashes PageDoc payloads, persisting encoded plans via Vercel KV or in-memory cache — `apps/api/src/lib/plan.ts:37` (4c867ea).
- Plan resolver endpoint exposes stored plans by hash for clients that receive `shortId` references — `apps/api/api/v1/plan/[id].ts:18` (4c867ea).

### Integrations
- Tenant config route builds signed payloads with manifest URLs, embed script, API base, and CDN origin for the `demo` tenant — `apps/api/api/config/tenants/[tenant].ts:20` (4c867ea).
- Tenant descriptor defaults reference CDN and API endpoints derived from environment overrides — `apps/api/src/config/tenants.ts:27` (4c867ea).
- Demo host environment helpers read `NEXT_PUBLIC_*` variables to drive embed mode, SDK source, config URL, API base, and plan mode — `apps/demo-host/lib/env.ts:3` (4c867ea).
- OpenAPI surface lists available public endpoints (`/v1/compose`, `/v1/fragment`, `/v1/interpret`) that can host the interim three-block default plan response — `docs/engineering/API/openapi.yaml:5` (4c867ea).
- Data provider stub generates synthetic events, honoring quota and caching semantics used by the composer — `packages/data-providers/src/index.ts:142` (4c867ea).

### Configuration & Secrets
- Admin `.env.example` exposes public API/config origins and optional manifest URL for referencing the embed build — `apps/admin/.env.example:2` (4c867ea).
- Demo host `.env.example` specifies API base, config URL, embed mode/source, plan mode, ISR cache defaults, and hostnames; this `NEXT_PUBLIC_API_BASE` will be the source for fetching and saving the default block order once the inline plan is replaced— `apps/demo-host/.env.example:6` (4c867ea).
- Cache utilities supply default ISR revalidate and stale windows from environment variables — `apps/demo-host/lib/cache.ts:10` (4c867ea).

### Tests & Observability
- Admin Vitest snapshot checks homepage copy to guard the landing experience — `apps/admin/__tests__/home.test.tsx:6` (4c867ea).
- Demo host tests verify linked/external SDK loading paths and confirm embed container metadata, asserting status transitions — `apps/demo-host/__tests__/page.test.tsx:69` (4c867ea).
- Composer handler starts an OpenTelemetry span around each compose call, supporting latency instrumentation — `apps/api/api/v1/compose.ts:179` (4c867ea).

### API/UI Surface
- Main demo host page displays embed status, configuration details, and the embed container attributes consumed by the SDK — `apps/demo-host/app/page.tsx:320` (4c867ea).
- Fragment endpoint returns HTML or JSON placeholders with CSP and cache headers for tenants, which the demo host proxies — `apps/api/api/v1/fragment.ts:48` (4c867ea).
- Router helpers encode/decode plans for URL persistence, affecting how embeds sync state with host URLs — `packages/router-helpers/src/index.ts:105` (4c867ea).

### Admin Drag-and-Drop Readiness
- The admin `/blocks` view will consume the same `PageDoc.blocks` array that powers the embed; each entry must expose `id`, `key`, `kind`, and `order` so reordering can map directly to persisted metadata — `apps/demo-host/app/page.tsx:48` and `packages/page-schema/src/index.ts:297` (4c867ea).
- Canonicalization reindexes orders sequentially, meaning drag-and-drop implementations can submit the reordered array and rely on the API layer to normalize indices before hashing — `packages/page-schema/src/index.ts:338` (4c867ea).
- Persisting a new default plan can reuse existing infrastructure: `persistEncodedPlan` writes encoded plans to Vercel KV (or in-memory when KV is absent), allowing the API to serve updated defaults without a dedicated database — `apps/api/src/lib/plan.ts:48` (4c867ea).
- The embed SDK accepts a full `PageDoc` via `initialPlan`; once the API response replaces the inline stub, the demo host can hydrate from the network payload and reflect drag-and-drop changes after save — `packages/embed-sdk/src/index.ts:169` and `apps/demo-host/app/page.tsx:262` (4c867ea).

## Evidence Log
- `apps/admin/app/page.tsx:4` — Admin landing markup (`Link` to `/blocks`). (4c867ea)
- `apps/demo-host/app/page.tsx:43` — Inline `samplePage` definition for default blocks. (4c867ea)
- `packages/embed-sdk/src/index.ts:76` — Shadow DOM rendering per block. (4c867ea)
- `packages/embed-sdk/src/index.ts:169` — Embed hydration pipeline that accepts `initialPlan`. (4c867ea)
- `packages/ai-composer/src/index.ts:232` — Composer-defined block order. (4c867ea)
- `apps/api/api/v1/compose.ts:182` — Compose handler returning canonical plans. (4c867ea)
- `apps/api/src/lib/plan.ts:37` — Plan canonicalization and persistence helpers. (4c867ea)
- `apps/api/src/lib/plan.ts:48` — Persistence layer writing encoded plans to KV or memory. (4c867ea)
- `apps/api/api/config/tenants/[tenant].ts:20` — Tenant config payload assembly. (4c867ea)
- `apps/demo-host/lib/env.ts:3` — Environment readers driving embed configuration. (4c867ea)
- `apps/demo-host/__tests__/page.test.tsx:69` — Demo host test coverage for embed loading. (4c867ea)

## Code References (Index)
- `apps/admin/app/page.tsx:4` — Admin homepage content and `/blocks` link. (4c867ea)
- `apps/demo-host/app/page.tsx:262` — Embed bootstrap configuration using `samplePage`. (4c867ea)
- `packages/embed-sdk/src/index.ts:204` — Initial hydration of provided plan. (4c867ea)
- `packages/embed-sdk/src/index.ts:169` — Embed `create` signature accepting `initialPlan`. (4c867ea)
- `docs/engineering/API/openapi.yaml:5` — API endpoints available for serving default plans. (4c867ea)
- `packages/page-schema/src/index.ts:338` — Canonicalization logic enforcing block order. (4c867ea)
- `packages/router-helpers/src/index.ts:105` — Plan encoding for URL persistence. (4c867ea)
- `apps/api/api/v1/plan/[id].ts:18` — Plan retrieval endpoint returning stored payloads. (4c867ea)
- `apps/api/src/lib/plan.ts:48` — Persistence helper for encoded plans (KV or memory). (4c867ea)

## Architecture & Patterns (as implemented)
Architecture doc highlights the separation where admin authors configurations, API composes PageDoc data, and the embed SDK + block runtime render blocks in composer-specified order; demo host exercises linked vs external SDK modes to mirror that flow. `docs/engineering/ARCHITECTURE.md:10` (4c867ea), `docs/engineering/embed-dev.md:16` (4c867ea).

## Related Documentation
- `apps/admin/README.md:1` — Admin app stub description. (4c867ea)
- `apps/demo-host/README.md:3` — Demo host purpose and workflows. (4c867ea)
- `docs/engineering/embed-dev.md:16` — Embed mode switching guidance. (4c867ea)

## Open Questions
- Establish which API surface should host the interim three-block response (e.g., reuse `/v1/compose` with a fixed PageDoc versus introduce a dedicated `/v1/blocks/default`). Evidence: `docs/engineering/API/openapi.yaml:5` (4c867ea)
- Decide how drag-and-drop saves map to existing persistence helpers—confirm whether the admin should invoke an API that ultimately calls `persistEncodedPlan` or if a new endpoint will manage the default plan lifecycle. Evidence: `apps/api/src/lib/plan.ts:48` (4c867ea)
- Define how the admin `/blocks` route will consume the same default payload so both the admin preview and demo host remain consistent once the inline stub is removed. Evidence: `apps/admin/app/page.tsx:9` (4c867ea)

## Follow-up
- [2025-10-31 11:20] Initial survey captured against commit 4c867ea; no code changes performed.
