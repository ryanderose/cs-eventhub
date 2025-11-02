---
title: "Hybrid Dev + Preview Workflow Inventory"
date: "2025-11-02 14:45 local"
researcher: "ChatGPT Codex 5"
question: "How does the current cs-eventhub workspace implement the Hybrid Dev Servers + Preview Deployments spec?"
scope: "Reviewed docs, shared packages, Next.js apps, API functions, tooling, and supporting scripts tied to local/preview workflows."
assumptions: ["Remote permalinks unavailable; citations use workspace paths with line numbers."]
repository: "/Users/ryanderose/code/cs-eventhub-worktrees/admin-mvp/openaiplan"
branch: "admin-mvp/openaiplan"
commit_sha: "3d6eff1"
status: "complete"
last_updated: "2025-11-02"
last_updated_by: "ChatGPT Codex 5"
directories_examined: ["docs/", "apps/", "packages/", "scripts/", "tooling/"]
tags: ["research", "codebase", "hybrid-dev"]
---

# Research: Hybrid Dev + Preview Workflow Inventory

**Planning Hand-off (TL;DR)**  
- Spec defines dual local/preview lanes that the repo supports with Next.js hosts, a Vercel-driven API surface, and pnpm/turbo orchestration.  
- Shared domain packages provide deterministic plan schemas, AI composition, router helpers, and telemetry hooks that power both local tests and preview checks.  
- Admin and demo hosts coordinate default plan management, embed hydration, and SEO fragments, while scripts and tests enforce the hybrid workflow expectations.

## Research Question (from spec)
Document how the existing codebase realizes the Hybrid Dev Servers + Preview Deployments plan, including component locations, behaviors, and interactions.

## System Overview (what exists today)
The monorepo uses Turborepo + pnpm to host Next.js admin and demo applications, a Vercel API project composed of serverless/edge handlers, and shared TypeScript packages covering schemas, AI composition, router encoding, telemetry, and security helpers. Documentation positions development around a fast local loop with optional preview smoke tests, while the implementation leans on Vercel KV fallbacks, deterministic plan hashing, and automated tests to keep local and preview flows aligned.

## Detailed Findings

### Docs & Decisions
- Hybrid workflow spec names Lane L (local native servers) and Lane P (preview escalations for runtime-coupled features). `docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md:36-51`
- Monorepo quickstart and highlights emphasize pnpm/turbo orchestration plus embed/admin/API roles. `README.md:5-23`
- Architecture snapshot maps package responsibilities (embed SDK, block runtime, schema, AI, telemetry) and reiterates analytics/observability expectations. `docs/engineering/ARCHITECTURE.md:8-88`

### Domain & Data
- `packages/page-schema` defines v1.5 block variants, page metadata, plan cursors, and deterministic hashing utilities used across apps and APIs. `packages/page-schema/src/index.ts:11-380`
- `packages/data-providers` simulates the CitySpark adapter with quota enforcement, caching, circuit breaker behavior, and telemetry instrumentation. `packages/data-providers/src/index.ts:1-220`
- `packages/ai-interpreter` parses DSL tokens (dates, categories, distance, accessibility) into normalized filters and intent labels. `packages/ai-interpreter/src/index.ts:23-191`
- `packages/ai-composer` composes default plans, enforces diversity, generates SEO blocks, and returns hashed pages referencing provider filters. `packages/ai-composer/src/index.ts:6-211`
- Router helpers encode/decode plans with optional zstd/brotli compression and URL parameter helpers. `packages/router-helpers/src/index.ts:1-148`
- Telemetry package captures SDK/admin events and routes admin default-plan logging through structured spans. `packages/telemetry/src/index.ts:1-125`

### Entry Points & Routing
- Demo host Next.js page bootstraps the embed, fetches `/v1/plan/default`, handles fallback plans, and reports status. `apps/demo-host/app/page.tsx:3-215`
- Demo host fragment route proxies API fragments, hashes CSS, and sets ISR headers in an edge runtime. `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:1-80`
- Admin `/blocks` page fetches the default plan before rendering the client-side block list. `apps/admin/app/blocks/page.tsx:1-41`
- API exposes Vercel functions (compose, fragment, plan resolver, interpreter, default-plan CRUD) with caching and telemetry hooks. `apps/api/api/v1/compose.ts:1-218`, `apps/api/api/v1/fragment.ts:1-74`, `apps/api/api/v1/plan/[id].ts:1-40`, `apps/api/api/v1/plan/default.ts:1-215`, `apps/api/api/v1/interpret.ts:1-28`
- Vercel routing and rewrites attach preview domains and map friendly routes to function files. `apps/api/vercel.json:1-48`

### Core Logic
- Compose handler caches responses by `planHash` + composer version, persists oversized plans, and surfaces cache headers for both node and edge invocation. `apps/api/api/v1/compose.ts:167-218`
- Default-plan handler seeds static plans when missing, validates updates with ETag-style `If-Match`, and records telemetry outcomes. `apps/api/api/v1/plan/default.ts:44-190`
- `apps/api/src/lib/plan` centralizes plan encoding, KV persistence, cache decisions, and pointer updates. `apps/api/src/lib/plan.ts:1-137`
- Pages store tracks per-tenant plan pointers in KV or memory with telemetry for hits, misses, and fallbacks. `apps/api/src/lib/pages-store.ts:1-99`
- Embed SDK enforces no-iframe containers, renders block sections into a shadow root, persists encoded plans to history, and emits analytics events. `packages/embed-sdk/src/index.ts:5-214`
- Admin block list component implements drag-and-drop reorder, optimistic save/reset state, telemetry events, and conflict recovery logic. `apps/admin/components/default-blocks/block-list.tsx:1-260`

### Integrations
- API plan modules and plan pointers optionally rely on Vercel KV (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) with in-memory fallbacks. `apps/api/src/lib/plan.ts:49-85`, `apps/api/src/lib/pages-store.ts:20-87`
- Config route signs tenant manifests using `CONFIG_SIGNING_SECRET` and exposes CDN/embed URLs for beta/prod modes. `apps/api/api/config/tenants/[tenant].ts:20-95`
- Demo host environment helpers expose embed/config/api endpoints and plan modes from `NEXT_PUBLIC_*` variables to align local vs preview settings. `apps/demo-host/lib/env.ts:1-22`
- Root scripts run `vercel dev`, serve embed bundles, publish CDN assets, and orchestrate multi-service dev stacks. `package.json:6-19`, `scripts/serve-embed.ts:1-95`, `scripts/publish-embed.ts:1-200`

### Configuration & Secrets
- `.env.example` files enumerate API URLs, embed sources, plan modes, and telemetry-friendly defaults per app. `apps/demo-host/.env.example:1-17`, `apps/admin/.env.example:1-6`, `apps/api/.env.example:1-21`
- Turbo pipeline config disables caching for `dev`, sets build/test dependencies, and tracks outputs for bundle/security jobs. `turbo.json:1-35`
- Vitest config aliases `@events-hub/*` to package sources and collects coverage under `coverage/`. `tooling/config/vitest.config.ts:5-20`

### Tests & Observability
- Demo host tests ensure embed hydration (linked vs external), fallback handling, and fragment proxy hashing behave deterministically. `apps/demo-host/__tests__/page.test.tsx:95-184`, `apps/demo-host/__tests__/fragment-route.test.ts:17-80`
- Admin tests cover reorder/save flows, conflict reconciliation, and optimistic reset states. `apps/admin/__tests__/blocks.test.tsx:60-152`
- API tests validate compose caching, fragment headers, plan retrieval, and interpreter outputs. `apps/api/__tests__/api.test.ts:61-138`, `apps/api/__tests__/plan-default.test.ts:45-134`
- Telemetry tests assert logging behavior across success, conflict, invalid, and test-mode cases. `packages/telemetry/src/index.test.ts:1-74`

### API/UI Surface (as applicable)
- Demo host surfaces an embed container with mode API/base metadata, status messaging, and configuration details for operators. `apps/demo-host/app/page.tsx:217-340`
- Admin UI exposes a “Default Blocks” reorder surface with DnD controls, save/reset actions, and telemetry for fetch/save events. `apps/admin/components/default-blocks/block-list.tsx:47-260`
- API endpoints provide `/v1/compose`, `/v1/fragment`, `/v1/plan/default`, `/v1/plan/:id`, and `/config/tenants/:tenant` per spec coverage. `apps/api/api/v1/compose.ts:1-218`, `apps/api/api/v1/fragment.ts:1-74`, `apps/api/api/v1/plan/default.ts:1-215`, `apps/api/api/v1/plan/[id].ts:1-40`, `apps/api/api/config/tenants/[tenant].ts:1-95`

## Evidence Log
- docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md:31-115 — Hybrid lanes, scripts, and tooling expectations.
- README.md:5-23 — Monorepo quickstart and component highlights.
- docs/engineering/ARCHITECTURE.md:8-88 — Package responsibilities and runtime overview.
- packages/page-schema/src/index.ts:11-380 — Block/page schemas, hashing, and default-plan contract.
- packages/ai-composer/src/index.ts:6-211 — Default plan builder and composer pipeline.
- packages/ai-interpreter/src/index.ts:23-191 — DSL parsing and intent inference.
- packages/router-helpers/src/index.ts:1-148 — Plan encoding/decoding utilities.
- apps/api/api/v1/compose.ts:167-218 — Compose handler caching and persistence.
- apps/api/api/v1/plan/default.ts:44-190 — Default plan GET/PUT flow with telemetry.
- apps/api/src/lib/plan.ts:1-137 — Plan persistence and encoding helpers.
- apps/admin/components/default-blocks/block-list.tsx:1-260 — Block reorder UI logic.
- apps/demo-host/app/page.tsx:3-215 — Embed bootstrap and plan fetching.
- apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:1-80 — Fragment proxy route.
- apps/api/api/config/tenants/[tenant].ts:1-95 — Tenant config signing and caching.
- apps/demo-host/__tests__/page.test.tsx:95-184 — Embed hydration test coverage.
- apps/api/__tests__/plan-default.test.ts:45-134 — Default-plan handler regression tests.

## Code References (Index)
- docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md:36-115 — Hybrid development policy and tooling matrix.
- packages/page-schema/src/index.ts:11-380 — Canonical plan schema and hashing helpers.
- packages/ai-composer/src/index.ts:53-211 — Default plan seeding and composed block pipeline.
- packages/router-helpers/src/index.ts:105-148 — Plan encoding and URL helpers.
- apps/api/src/lib/plan.ts:38-137 — Plan persistence, cache keys, and pointer integration.
- apps/api/api/v1/compose.ts:167-218 — Response caching, storage, and headers.
- apps/api/api/v1/plan/default.ts:44-190 — Tenant-specific plan lifecycle management.
- apps/admin/components/default-blocks/block-list.tsx:112-260 — Client-side reorder and save workflow.
- apps/demo-host/app/page.tsx:82-340 — Embed hydration, fallback logic, and status telemetry.
- apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:24-80 — SEO fragment proxy with hashing and cache headers.

## Architecture & Patterns (as implemented)
The repo follows a layered pattern where shared packages encapsulate domain logic (schemas, AI composition, router encoding, telemetry), and applications consume those packages via framework-specific adapters. Next.js hosts operate in App Router mode with ISR fragment routes and client components for embeds/admin tooling, while the API is organized as Vercel function files split between edge and node runtimes, relying on shared plan/telemetry helpers for consistency. Turborepo governs build/test pipelines, and scripts manage ancillary servers (embed CDN, vercel dev) to keep local workflows aligned with preview deployments. `docs/engineering/ARCHITECTURE.md:8-110`, `apps/api/api/v1/compose.ts:1-218`, `apps/demo-host/app/page.tsx:3-340`

## Related Documentation
- apps/api/README.md:1-56 — API function map and local development guidance.
- apps/demo-host/README.md:1-40 — Embed host quickstart and testing notes.
- docs/engineering/embed-dev.md:1-120 — Embed stack guidance and default plan workflow.

## Open Questions
- None. The spec’s adapter reference is aspirational; the current lane uses the Vercel function handlers in `apps/api/api`. `docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md:55-81`, `apps/api/api/v1/compose.ts:1-218`

## Follow-up (append only, as needed)
- [2025-11-02 15:05] Clarified with stakeholders that no separate local TS server adapter exists; local runs rely on `vercel dev` and the existing Vercel handlers.
