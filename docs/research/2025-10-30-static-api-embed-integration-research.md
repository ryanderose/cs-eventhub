---
title: "Static API ↔ Embed: Current State"
date: "2025-10-30 00:00 local"
researcher: "ChatGPT Codex 5"
question: "Build a fully static API on Vercel that serves three distinct blocks for a demo account (ID 0001) and hydrate a demo-host embed solely from that API; reordering blocks via static redeploy should change the embed."
scope: "apps/api (routes, lib, config), apps/demo-host (App Router page and SEO fragment route), packages/embed-sdk, packages/page-schema, packages/router-helpers, relevant docs and examples"
assumptions: [
  "'tenantId' in code maps to the concept of 'account ID' in the request",
  "Demo tenant ('demo') is the current default consumer for host/demo flows",
  "Static API refers to Vercel Functions returning deterministic payloads without runtime DB dependencies"
]
repository: "/Users/ryanderose/code/cs-eventhub"
branch: "unknown"
commit_sha: "unknown"
status: "complete"
last_updated: "2025-10-30"
last_updated_by: "ChatGPT Codex 5"
directories_examined: ["apps/api/", "apps/demo-host/", "packages/embed-sdk/", "packages/page-schema/", "packages/router-helpers/", "docs/"]
tags: ["research", "codebase", "api", "embed", "demo-host"]
---

# Research: Static API ↔ Embed: Current State

Planning Hand‑off (TL;DR)
- API exposes Vercel routes: compose (Node, JSON), fragment (Edge, HTML placeholder), plan resolver (Node), and tenant config (Node). See `apps/api/vercel.json:11` and route files.
- Demo host loads the Embed SDK and hydrates a local `samplePage` with seven placeholder blocks (filter, hero, rail, map, promo, detail, chat); the page never fetches the API, so reordering requires code edits. See `apps/demo-host/app/page.tsx:43`.
- Tenant/config plumbing exists via `/config/tenants/[tenant].ts`; no explicit "account ID 0001" mapping is present in code. Default tenant is `demo`. See `apps/api/src/config/tenants.ts:26`.
- Plan storage helpers (`apps/api/src/lib/plan.ts`) canonicalize, encode, hash, and optionally persist plans to Vercel KV with a one-hour TTL, falling back to an in-memory map when KV is absent.

## Research Question (from spec)
Document how the current repository supports an API on Vercel that could serve static block content to an embed hosted in `apps/demo-host`, including how tenants are selected and how the embed consumes content today. No implementation or design changes; strictly describe what exists.

## System Overview (what exists today)
- Monorepo with Next.js apps (`api`, `demo-host`, `admin`) and reusable packages (SDK, schema, helpers). `docs/engineering/ARCHITECTURE.md:1` outlines topology.
- API project deployed as Vercel functions with rewrites for versioned endpoints and tenant config. `apps/api/vercel.json:11`.
- Demo host is a Next.js App Router app that mounts the Embed SDK and exposes an ISR SEO fragment proxy route. `apps/demo-host/README.md:1`, `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:5`.
- Embed SDK renders a `PageDoc`’s `blocks` into sections in Shadow DOM; does not itself fetch plans. `packages/embed-sdk/src/index.ts:169`.

## Detailed Findings

### Docs & Decisions
- Repository overview and Quickstart — `README.md:1`.
- Architecture snapshot and monorepo layout — `docs/engineering/ARCHITECTURE.md:1`.
- Embed development workflow, linked vs external SDK modes — `docs/engineering/embed-dev.md:1`.
- Vercel deployment/env examples for apps — `docs/product/vercel_deployment-1.1.md:1`.

### Domain & Data
- Page/Block contracts (v1.5) defined via Zod — `packages/page-schema/src/index.ts:11` (BlockKind), `packages/page-schema/src/index.ts:108` (PageDoc schema), `packages/page-schema/src/index.ts:96` (filter facets).
- Canonicalization re-sorts blocks by `order` then `key`, rewrites contiguous indexes, and sorts metadata before hashing — `packages/page-schema/src/index.ts:338`.
- Hashing derives a base64url plan hash from the canonicalized payload — `packages/page-schema/src/index.ts:348`.
- Router helpers for plan encode/decode (`zstd`/Brotli/plain) — `packages/router-helpers/src/index.ts:61` (encode), `packages/router-helpers/src/index.ts:90` (decode).
- Persistence utilities — `apps/api/src/lib/plan.ts:16` (`encodeCanonicalPlan`), `apps/api/src/lib/plan.ts:48` (`persistEncodedPlan`, TTL 3600s), `apps/api/src/lib/plan.ts:63` (`resolveEncodedPlan`), `apps/api/src/lib/plan.ts:71` (`shouldInlinePlan`).

### Entry Points & Routing
- Vercel rewrites for API surface — `apps/api/vercel.json:11`.
  - `/v1/compose` → `api/v1/compose.ts`
  - `/v1/fragment/(.*)` → `api/v1/fragment.ts` (`tenantId` via query/path)
  - `/v1/plan/(.*)` → `api/v1/plan/[id].ts`
  - `/v1/interpret` → `api/v1/interpret.ts`
  - `/config/tenants/(.*).json` → `api/config/tenants/[tenant].ts`
- Demo-host SEO fragment route (Edge) proxies API and hashes critical CSS — `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:5` and `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:29`.

### Core Logic
- Compose (Node) — `apps/api/api/v1/compose.ts:11`.
  Flow: POST JSON payload → optional cache read → call `@events-hub/ai-composer` → canonicalize + encode plan → inline or persist (KV/in-memory) → JSON response with `encodedPlan` or `shortId` → write simple in-process cache.
- Fragment (Edge) — `apps/api/api/v1/fragment.ts:1`.
  Flow: GET with `tenantId` → builds CSP → returns HTML placeholder `<div data-tenant="…">` with cache headers; response is `text/html`.
- Plan resolver (Node) — `apps/api/api/v1/plan/[id].ts:6`.
  Flow: GET by `id` (plan hash) → resolve encoded plan (KV or memory) → decode → JSON payload `{ plan, encoded }`.
- Interpreter (Node) — `apps/api/api/v1/interpret.ts:5`.
  Flow: POST `{ query }` → run `@events-hub/ai-interpreter` → return parsed filters (stubbed) with `no-store`.
- Tenant config endpoint — `apps/api/api/config/tenants/[tenant].ts:63`.
  Flow: GET `tenant` + optional `mode=beta|prod` → look up tenant descriptor → return payload `{ config, signature }` including `apiBase`, `manifestUrl`, and `embed.src`.
- Plan helpers — `apps/api/src/lib/plan.ts:16` (inline limit, TTL), `apps/api/src/lib/plan.ts:33` (memory cache), `apps/api/src/lib/plan.ts:60` (KV presence), `apps/api/src/lib/plan.ts:81` (persist), `apps/api/src/lib/plan.ts:94` (resolve), `apps/api/src/lib/plan.ts:108` (inline check), `apps/api/src/lib/plan.ts:112` (cache key).
- Telemetry span helper — `apps/api/src/lib/telemetry.ts:21` (`startSpan`).

### Integrations
- Vercel KV client used when available; falls back to in-memory map otherwise — `apps/api/src/lib/plan.ts:60` and `apps/api/src/lib/plan.ts:81`.
- OpenTelemetry tracer access guarded with try/catch — `apps/api/src/lib/telemetry.ts:21`.
- Demo-host env accessors expose `NEXT_PUBLIC_EMBED_MODE`, `NEXT_PUBLIC_EMBED_SRC`, `NEXT_PUBLIC_CONFIG_URL`, `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_PLAN_MODE`; these values are surfaced in the UI but not used to fetch plans — `apps/demo-host/lib/env.ts:1`, `apps/demo-host/app/page.tsx:274`.

### Configuration & Secrets
- API envs: KV, signing secret, CDN overrides, compose tuning — `apps/api/.env.example:1`.
- Demo-host envs: API base, config URL, embed mode/src/manifest, cache timings — `apps/demo-host/.env.example:1`.
- Tenants config: default `demo` tenant with API base and manifest/embed URLs resolved from env — `apps/api/src/config/tenants.ts:26`.

### Tests & Observability
- API route tests validate compose headers/caching, fragment CSP, plan resolver, interpreter — `apps/api/__tests__/api.test.ts:1`.
- Tenant config handler tests (CORS, signatures, 404) — `apps/api/__tests__/config.test.ts:1`.
- Demo-host tests verify Shadow DOM attach and SEO fragment hashing — `apps/demo-host/__tests__/page.test.tsx:1`, `apps/demo-host/__tests__/fragment-route.test.ts:1`.

### API/UI Surface (as applicable)
- API endpoints (rewritten forms):
  - POST `/v1/compose` — JSON body; returns composed plan (`encodedPlan` or `shortId`). `apps/api/api/v1/compose.ts:143`.
  - GET `/v1/fragment/:tenantId` — returns HTML fragment placeholder, CSP, cache headers. `apps/api/api/v1/fragment.ts:32`.
  - GET `/v1/plan/:id` — returns `{ plan, encoded }`. `apps/api/api/v1/plan/[id].ts:24`.
  - POST `/v1/interpret` — returns parsed filters (stub). `apps/api/api/v1/interpret.ts:7`.
  - GET `/config/tenants/:tenant.json` — returns `{ config, signature }`. `apps/api/api/config/tenants/[tenant].ts:63`.
- Demo-host UI: client page that loads Embed SDK (linked or external) and mounts `initialPlan` into Shadow DOM — `apps/demo-host/app/page.tsx:98` and `apps/demo-host/app/page.tsx:105`.

## Code References (Index)
- `apps/api/vercel.json:11` — Rewrites and headers for API surface and config.
- `apps/api/api/v1/compose.ts:11` — Compose handler (Node) with caching and plan encoding.
- `apps/api/api/v1/fragment.ts:1` — Fragment handler (Edge) returning HTML placeholder + CSP.
- `apps/api/api/v1/plan/[id].ts:6` — Plan resolver (Node) reading from KV/memory.
- `apps/api/api/v1/interpret.ts:5` — Interpreter handler (Node).
- `apps/api/api/config/tenants/[tenant].ts:63` — Tenant config JSON endpoint.
- `apps/api/src/config/tenants.ts:26` — Default `demo` tenant descriptor and env-driven URLs.
- `apps/api/src/lib/plan.ts:81` — KV persistence for plans; inline limit and TTL.
- `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:29` — SEO fragment proxy to API and CSS hashing.
- `apps/demo-host/app/page.tsx:43` — Local `samplePage` definition with placeholder blocks.
- `apps/demo-host/app/page.tsx:105` — Embed bootstrap with `initialPlan` and theme.
- `packages/embed-sdk/src/index.ts:169` — `create()` embed entrypoint and `hydrateNext()`.
- `packages/page-schema/src/index.ts:11` — Block kinds; `PageDoc` schema and hash helpers nearby.
- `packages/router-helpers/src/index.ts:61` — Plan encode/decode helpers.

## Architecture & Patterns (as implemented)
- Vercel Functions split across Edge (latency/CSP-sensitive) and Node (KV, interpreter/composer) handlers with rewrites to versioned endpoints.
- Demo-host App Router uses an Edge route to proxy fragments and apply deterministic cache headers and CSS hashing; the client page dynamically loads the Embed SDK in linked/external modes and hydrates a provided plan.
- Plan lifecycle flows through canonicalization → encode → inline or persist (KV/in-memory) with TTLs; retrieval via `/v1/plan/:id`.

## Related Documentation
- `docs/engineering/ARCHITECTURE.md:1` — Topology and runtime pathways.
- `docs/engineering/embed-dev.md:1` — Local development for embed and API.
- `apps/api/README.md:10` — Function layout with routes and runtime notes.

## Current Gaps vs Static API Goal
- No API route serves a tenant-specific static `PageDoc`; `/v1/plan/:id` only resolves previously persisted hashes (usually produced by `/v1/compose`). The demo tenant has no seeded entries in KV, so the resolver returns 404 until compose runs.
- Demo host never invokes the API; `samplePage` embeds version `1.5` blocks locally and reordering requires code changes. `apps/demo-host/app/page.tsx:43`.
- Plan persistence TTL (default 3600 s) causes static plans to expire in KV unless re-written; in-memory fallback is per-instance and lost on cold start.
- Tenant config payload lacks any field for default plan hash or endpoint, so other clients cannot discover a static plan declaratively.
- No tests or telemetry validate default-plan retrieval, TTL expiry, or embed fetch flows, which would be critical for a static integration.

## Implementation Levers & Handoff Notes
- Introduce a `/v1/plan/default` (or similar) handler that reuses canonicalization helpers and maintains a pointer (`pages:default:<tenantId>`) aligning with the v1.6 Pages Store direction.
- Create a deployment/seed script that writes the demo tenant’s default plan via the same helper, ensuring KV is hydrated before the embed requests it.
- Update the demo host to fetch the default plan using `NEXT_PUBLIC_API_BASE` (with graceful retry/fallback to `samplePage`) before instantiating the embed; surface loading/error states alongside SDK load status.
- Extend tenant config (optional) with a default plan hash so future clients can reuse the pointer without bespoke endpoints.
- Add tests around the new endpoint, KV fallback behaviour, and embed bootstrap to prevent regressions during the MVP rollout.

## Additional Context for Planning Agents
- `apps/api/src/lib/plan.ts` currently writes encoded plans with TTL; default-plan work should either disable TTL or refresh pointers automatically to avoid expiry.
- `samplePage` blocks use schema version `'1.5'`; product spec v1.6 expects upgrades to `'1.6'`, so static payloads should be stamped accordingly.
- SEO fragment responses (`/v1/fragment`) are pure HTML placeholders; integrating static plans into fragments would require additional API surface beyond this MVP.
- Local development without KV relies on the in-memory store; multiple server restarts will drop plans, so developer tooling should include a quick seed step.

## Open Questions
- Where should a static, three-block `PageDoc` be defined and served for a specific account/tenant? Current API exposes `compose`, `fragment`, and `plan` endpoints but does not include a static blocks endpoint or tenant-specific page store. Evidence: `apps/api/api/v1/compose.ts:181`, `apps/api/api/v1/fragment.ts:53`.
- Is the “account ID 0001” intended to map to `tenantId`? Current code references `tenantId` (e.g., `demo`) but no numeric account IDs. Evidence: `apps/api/src/config/tenants.ts:26`, `apps/demo-host/app/page.tsx:108`.
- The demo-host SEO fragment proxy expects JSON `{ html, css }` from the upstream, while the API’s fragment handler returns `text/html`. Is a JSON fragment endpoint expected elsewhere, or should the proxy target differ? Evidence: `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:51` vs `apps/api/api/v1/fragment.ts:32`.

## Follow‑up
- [2025-10-30 00:00] Initial survey captured; citations added; commit SHA unavailable in this environment.
- [2025-10-31 14:10] Augmented findings with plan persistence details, environment usage, gaps, and implementation levers to support default-plan MVP planning.
