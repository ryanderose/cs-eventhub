---
title: "Admin Default Plan Inventory"
date: "2025-11-05 19:30 EST"
researcher: "ChatGPT Codex 5"
question: "How does the current codebase implement the Admin Blocks full-fidelity default plan described in docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md?"
scope: "Default plan schema, persistence, admin /blocks UI, demo host embed interactions, and supporting storage/tests."
assumptions: ["Focus is limited to the default plan workflow; other product areas remain out of scope."]
repository: "ryanderose/cs-eventhub"
branch: "master"
commit_sha: "08167a8"
status: "complete"
last_updated: "2025-11-05"
last_updated_by: "ChatGPT Codex 5"
directories_examined: ["docs/specs", "docs/engineering", "apps/api", "apps/admin", "apps/demo-host", "packages/page-schema", "playwright/projects"]
tags: ["research", "codebase", "default-plan", "admin-blocks"]
---

# Research: Admin Default Plan Inventory

**Planning Hand-off (TL;DR)**  
- Spec calls for a shared full-fidelity default plan so admin `/blocks` and the demo host stop diverging, but the current seed still emits three promo-slot stubs persisted through the pointer store. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:9-38 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L9-L38), apps/api/src/lib/pages-store.ts:108-162 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/pages-store.ts#L108-L162)  
- Admin `/blocks` fetches `/v1/plan/default` through `plan-client`, proxies to the API via the Next.js route, and saves reordered keys only when `planHash` matches the persisted pointer to avoid stomping concurrent edits. — apps/admin/app/blocks/page.tsx:1-18 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/page.tsx#L1-L18), apps/admin/lib/plan-client.ts:3-123 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/lib/plan-client.ts#L3-L123), apps/admin/app/blocks/BlocksClient.tsx:25-249 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/BlocksClient.tsx#L25-L249), apps/api/src/http/plan-default.ts:104-233 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/http/plan-default.ts#L104-L233)  
- The demo host’s `useDefaultPlan` hook retries `/v1/plan/default`, falls back to `samplePlan` when disabled or failing, and the page hydrates the embed whenever the incoming `planHash` differs so visitors see whatever the admin saved. — apps/demo-host/lib/useDefaultPlan.ts:29-198 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/lib/useDefaultPlan.ts#L29-L198), apps/demo-host/app/page.tsx:18-252 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/app/page.tsx#L18-L252), apps/demo-host/lib/samplePlan.ts:18-196 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/lib/samplePlan.ts#L18-L196)

## Research Question (from spec)
Map the existing default plan pipeline (schema, storage, admin authoring, demo consumption) so we can compare it to the “Admin Blocks Full-Fidelity Preview” requirements and understand every component participating in `/v1/plan/default`. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:9-181 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L9-L181)

## System Overview (what exists today)
Events Hub is a pnpm/Turborepo workspace with three key apps—API, admin console, and demo host—and shared packages (schema, blocks, telemetry). Default plan data originates in the API (Node/Vercel handler), is proxied to the admin UI for reordering, persisted via Vercel KV or in-memory caches, and later fetched by the demo host before it boots the embed SDK. — docs/engineering/ARCHITECTURE.md:1-116 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/engineering/ARCHITECTURE.md#L1-L116), apps/api/src/app.ts:1-109 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/app.ts#L1-L109)

## Spec Snapshot
- **Objectives:** Provide a canonical block source shared by admin + demo host, keep parity with v1.6 schema, persist block order in KV/in-memory, surface accurate metadata, instrument telemetry, and stay multi-tenant-ready. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:33-180 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L33-L180)
- **Domain terms:** Default plan, `BlockInstance`, `planHash`, pointer key `pages:default:<tenant>`, Ladle block previews, KV vs. local memory store. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:11-157 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L11-L157)
- **Entry points:** `/v1/plan/default` GET/PUT handler, admin `/blocks` page, demo host’s `useDefaultPlan`. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:21-31 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L21-L31)
- **Integrations:** Vercel KV for persistence, Ladle/blocks library, telemetry spans (`defaultPlan.fetch/update`), Plausible events, embed SDK hydration. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:25-157 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L25-L157)
- **Entities:** `PageDoc`, `BlockInstance`, default pointer record `{ planHash, updatedAt }`, sample block templates. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:25-54 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L25-L54)
- **Risks implied:** Placeholder seeds leave admin/editor experience inaccurate; KV vs. memory divergence, stale hashes causing conflicts, unfinished multi-tenant strategy. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:11-170 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L11-L170)

## Detailed Findings

### Docs & Decisions
- The November 2025 spec documents why `/blocks` must expose the full demo host block roster, enumerates goals/non-goals, milestones, and QA expectations for the default plan stack. — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:9-181 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L9-L181)
- The engineering architecture snapshot explains the monorepo topology (apps vs. packages), embed/runtime path, and the testing/observability gates this feature must align with. — docs/engineering/ARCHITECTURE.md:1-116 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/engineering/ARCHITECTURE.md#L1-L116)

### Domain & Data
- `packages/page-schema` defines the Zod contracts for every `BlockKind`, shared layout/a11y metadata, and canonicalization helpers that compute deterministic `planHash` values. — packages/page-schema/src/index.ts:1-369 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/packages/page-schema/src/index.ts#L1-L369)
- The `pages-store` module stores default plan pointers in Vercel KV when configured (fallback to global Maps), resolves encoded plans, and still seeds three promo-slot blocks via `loadSeedPlan`. — apps/api/src/lib/pages-store.ts:1-167 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/pages-store.ts#L1-L167)
- Plan encoding/decoding wraps router-helper utilities so canonical docs are base64-url encoded, TTL-managed, and optionally inlined depending on `PLAN_INLINE_LIMIT`. — apps/api/src/lib/plan.ts:18-100 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/plan.ts#L18-L100)
- The demo host’s `createSamplePlan` assembles the richer block mix (filter bar, hero, rails, map, promo, detail, mini chat) used as fallback before persisted data is available. — apps/demo-host/lib/samplePlan.ts:18-196 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/lib/samplePlan.ts#L18-L196)

### Entry Points & Routing
- Express mounts `/api/v1/plan/default` and `/v1/plan/default` for both internal and edge clients, and the same handler is wired into the Vercel function export. — apps/api/src/app.ts:1-109 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/app.ts#L1-L109), apps/api/api/v1/plan/default.ts:1-7 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/api/v1/plan/default.ts#L1-L7)
- The admin Next.js API route proxies `/api/default-plan` to the API base (deriving host-based URLs when unset) and attaches optional Vercel protection bypass headers. — apps/admin/app/api/default-plan/route.ts:7-100 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/api/default-plan/route.ts#L7-L100)
- `plan-client` resolves server vs. browser transports, fixes the tenant to `demo`, and carries bypass secrets so both SSG and client requests share the same response shape. — apps/admin/lib/plan-client.ts:3-123 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/lib/plan-client.ts#L3-L123)
- The `/blocks` server component fetches the plan via `plan-client` before rendering the client-only drag-and-drop UI. — apps/admin/app/blocks/page.tsx:1-18 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/page.tsx#L1-L18)

### Core Logic
- `handleDefaultPlan` resolves tenant IDs, seeds plans when absent, enforces contiguous orders and expected block counts, validates incoming payloads with `PageDocSchema`, and performs optimistic concurrency checks using the pointer’s `planHash`. — apps/api/src/http/plan-default.ts:12-233 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/http/plan-default.ts#L12-L233)
- The admin `BlocksClient` derives block titles, tracks drag/drop or button-driven reorders, applies the order back to the plan on save, surfaces toast messaging, and refreshes on 412 conflicts. — apps/admin/app/blocks/BlocksClient.tsx:25-320 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/BlocksClient.tsx#L25-L320)
- `useDefaultPlan` issues up to two fetch attempts with exponential backoff, retries on stale hashes, downgrades to fallback mode when disabled or misconfigured, and records status/source so the UI can explain whether data is coming from the API. — apps/demo-host/lib/useDefaultPlan.ts:29-198 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/lib/useDefaultPlan.ts#L29-L198)
- The demo host page memoizes env settings, loads or injects the embed SDK (linked vs. external mode), boots the embed once, and later calls `hydrateNext({ plan })` when `planHash` changes while announcing status to assistive tech. — apps/demo-host/app/page.tsx:18-252 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/app/page.tsx#L18-L252)

### Integrations
- Storage integrates with Vercel KV through environment detection; absent KV credentials, in-memory maps hold plan pointers and encoded payloads during dev/tests. — apps/api/src/lib/pages-store.ts:38-170 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/pages-store.ts#L38-L170), apps/api/src/lib/plan.ts:18-89 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/plan.ts#L18-L89)
- Admin transports include optional Vercel protection bypass headers/tokens both in the proxy route and direct server fetches, keeping staging/prod parity. — apps/admin/app/api/default-plan/route.ts:39-100 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/api/default-plan/route.ts#L39-L100), apps/admin/lib/plan-client.ts:69-123 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/lib/plan-client.ts#L69-L123)
- Demo host configuration reads `NEXT_PUBLIC_EMBED_MODE`, `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_PLAN_MODE`, and friends to decide whether to fetch remote plans or stay in sample mode. — apps/demo-host/lib/env.ts:3-21 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/lib/env.ts#L3-L21)
- Telemetry spans wrap GET/PUT operations, and Plausible events fire on reorder/save/reset actions for adoption tracking. — apps/api/src/http/plan-default.ts:104-229 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/http/plan-default.ts#L104-L229), apps/api/src/lib/telemetry.ts:1-23 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/telemetry.ts#L1-L23), apps/admin/app/blocks/BlocksClient.tsx:66-75 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/BlocksClient.tsx#L66-L75)

### Configuration & Secrets
- `plan-client` and the Next.js proxy honor `ADMIN_API_BASE`, `API_BASE`, `PREVIEW_API_URL`, and Vercel bypass tokens/signatures so protected preview deployments remain reachable. — apps/admin/lib/plan-client.ts:3-79 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/lib/plan-client.ts#L3-L79), apps/admin/app/api/default-plan/route.ts:7-63 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/api/default-plan/route.ts#L7-L63)
- Demo host toggles plan fetching via `NEXT_PUBLIC_PLAN_MODE` (beta/prod/sample) while embed source/mode/env config determine whether the SDK is bundled or loaded externally. — apps/demo-host/lib/env.ts:3-21 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/lib/env.ts#L3-L21), apps/demo-host/app/page.tsx:86-200 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/app/page.tsx#L86-L200)
- Persistence limits rely on `PLAN_INLINE_LIMIT` and `PLAN_CACHE_TTL_SECONDS`, and KV routing depends on `KV_REST_API_URL/TOKEN`. — apps/api/src/lib/plan.ts:18-74 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/plan.ts#L18-L74), apps/api/src/lib/pages-store.ts:38-66 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/pages-store.ts#L38-L66)

### Tests & Observability
- Vitest covers the admin client (rendering lists, persisting reorder, handling conflicts) by mocking `plan-client` functions. — apps/admin/__tests__/blocks.test.tsx:1-169 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/__tests__/blocks.test.tsx#L1-L169)
- API unit tests exercise seeding, block order validation, optimistic concurrency, and error responses by invoking the Vercel handler directly. — apps/api/__tests__/default-plan.test.ts:1-155 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/__tests__/default-plan.test.ts#L1-L155)
- Playwright includes an API smoke test that targets `/api/v1/plan/default` locally and (optionally) against preview deployments. — playwright/projects/api/default-plan.spec.ts:1-30 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/playwright/projects/api/default-plan.spec.ts#L1-L30)
- Observability hooks include OTEL spans via `startSpan`, structured console logs on save failures, and Plausible analytics for admin interactions. — apps/api/src/http/plan-default.ts:104-229 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/http/plan-default.ts#L104-L229), apps/api/src/lib/telemetry.ts:1-23 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/telemetry.ts#L1-L23), apps/admin/app/blocks/BlocksClient.tsx:66-75 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/BlocksClient.tsx#L66-L75)

### API/UI Surface (as applicable)
- `/v1/plan/default` returns `{ plan, encodedPlan, planHash, updatedAt }`, seeds on first GET, and enforces block count/order plus `planHash` preconditions on PUT. — apps/api/src/http/plan-default.ts:104-216 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/http/plan-default.ts#L104-L216)
- The admin UI renders an ordered list with accessible drag instructions, inline move buttons, toast/status region, and Save/Reset actions anchored to the current `planHash`. — apps/admin/app/blocks/BlocksClient.tsx:198-320 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/BlocksClient.tsx#L198-L320)
- Demo host displays embed/plan metadata, status announcements, and dataset attributes describing which API base/plan mode is active while pumping the embed SDK when ready. — apps/demo-host/app/page.tsx:205-252 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/app/page.tsx#L205-L252)

## Evidence Log
- docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:9-181 — Admin Blocks Full-Fidelity Preview spec (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L9-L181)
- docs/engineering/ARCHITECTURE.md:1-116 — Monorepo + runtime architecture overview (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/engineering/ARCHITECTURE.md#L1-L116)
- packages/page-schema/src/index.ts:1-369 — PageDoc & BlockInstance schemas and canonicalization (https://github.com/ryanderose/cs-eventhub/blob/08167a8/packages/page-schema/src/index.ts#L1-L369)
- apps/api/src/lib/pages-store.ts:1-167 — Default plan pointer store, seed plan, KV integration (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/lib/pages-store.ts#L1-L167)
- apps/api/src/http/plan-default.ts:12-233 — `/v1/plan/default` handler logic (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/http/plan-default.ts#L12-L233)
- apps/admin/app/blocks/BlocksClient.tsx:25-320 — Admin reorder UX + analytics (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/BlocksClient.tsx#L25-L320)
- apps/demo-host/lib/useDefaultPlan.ts:29-198 — Demo host plan-fetching hook (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/lib/useDefaultPlan.ts#L29-L198)
- apps/demo-host/app/page.tsx:18-252 — Embed bootstrap + hydration using default plan (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/app/page.tsx#L18-L252)
- apps/admin/__tests__/blocks.test.tsx:1-169 — Admin BlocksClient Vitest coverage (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/__tests__/blocks.test.tsx#L1-L169)
- apps/api/__tests__/default-plan.test.ts:1-155 — API default plan handler tests (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/__tests__/default-plan.test.ts#L1-L155)

## Code References (Index)
- apps/api/src/lib/pages-store.ts:1-167 — Pointer cache, seed plan, KV integration.
- apps/api/src/lib/plan.ts:18-100 — Canonical encoding, TTL caching, inline thresholds.
- apps/api/src/http/plan-default.ts:12-233 — GET/PUT logic, validation, concurrency.
- apps/admin/lib/plan-client.ts:3-123 — Tenant-scoped fetch/save helpers with bypass headers.
- apps/admin/app/blocks/BlocksClient.tsx:25-320 — Client-side reorder logic, analytics hooks.
- apps/demo-host/lib/useDefaultPlan.ts:29-198 — Fetch retries, fallback handling, status reporting.
- apps/demo-host/app/page.tsx:18-252 — Embed loading, hydrateNext dispatch, status UI.
- apps/admin/__tests__/blocks.test.tsx:1-169 — UI reorder/save/conflict tests.
- apps/api/__tests__/default-plan.test.ts:1-155 — API seeding/order/concurrency tests.
- playwright/projects/api/default-plan.spec.ts:1-30 — API smoke coverage for local/preview hosts.

## Architecture & Patterns (as implemented)
Default plan reads terminate at `/v1/plan/default`, which canonicalizes payloads via `PageDocSchema`, seeds from `loadSeedPlan` if needed, and persists encoded docs in KV keyed by `planHash`. Admin `/blocks` consumes the same endpoint through `plan-client`, applying reorder-only mutations and saving only when hashes align, while the demo host uses `useDefaultPlan` to hydrate the embed and react to hash transitions. This reinforces the app/package split described in the architecture doc: API centralizes persistence/telemetry, admin supplies accessibility-first authoring, and demo host mirrors consumer behavior using shared schema helpers. — apps/api/src/http/plan-default.ts:12-233 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/src/http/plan-default.ts#L12-L233), apps/admin/app/blocks/BlocksClient.tsx:25-320 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/admin/app/blocks/BlocksClient.tsx#L25-L320), apps/demo-host/lib/useDefaultPlan.ts:29-198 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/demo-host/lib/useDefaultPlan.ts#L29-L198), docs/engineering/ARCHITECTURE.md:8-78 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/engineering/ARCHITECTURE.md#L8-L78)

## Related Documentation
- Admin Blocks Full-Fidelity Preview spec — docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md:9-181 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md#L9-L181)
- Architecture Snapshot (Spec v1.6 alignment) — docs/engineering/ARCHITECTURE.md:1-116 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/docs/engineering/ARCHITECTURE.md#L1-L116)
- API seed script usage — apps/api/scripts/seed-default-plan.ts:11-84 (https://github.com/ryanderose/cs-eventhub/blob/08167a8/apps/api/scripts/seed-default-plan.ts#L11-L84)

## Open Questions
- None. Stakeholder guidance on 2025-11-05 confirmed the default plan should always include one representative instance of every available block kind, and clarified that future multi-tenant work will hinge on the forthcoming account system and hub-page IDs rather than impacting the current single-tenant demo.

## Follow-up (append only, as needed)
- [2025-11-05 20:30 EST] Product direction clarified that: (1) the seed/default plan must enumerate each block type in the system, expanding whenever new blocks ship so admin reorder covers them all and the demo host mirrors that set; (2) multi-tenant readiness remains future scope—today’s demo tenant is the only required ID, while later hub pages will attach to account IDs with their own embed codes once the account system is in place.
