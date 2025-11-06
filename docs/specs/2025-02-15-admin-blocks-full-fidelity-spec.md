---
title: "Admin Blocks Full-Fidelity Preview"
date: "2025-02-15"
authors: ["ChatGPT Codex 5"]
status: "draft"
related_research: "../research/2025-10-31-admin-default-embed-research.md"
---

# 1. Background

The `/blocks` route in the admin console already renders a drag-and-drop list that calls `GET/PUT /v1/plan/default` to persist block order (`apps/admin/app/blocks/BlocksClient.tsx`). However, the API seed plan (`apps/api/src/lib/pages-store.ts:108-167`) still emits three placeholder promo-slot blocks (`block one`, `block who`, `block three`). As a result, the admin UI can only reorder stubs, while the demo host embed continues to showcase the richer sample plan defined locally in `apps/demo-host/lib/samplePlan.ts:45-196`.

Because the demo host uses `useDefaultPlan` to fetch the persisted plan before hydrating the embed (`apps/demo-host/lib/useDefaultPlan.ts` and `apps/demo-host/app/page.tsx`), we need a single canonical default plan that:

- Matches the block set shown in the demo host (filter bar, hero, collection rail, map grid, promo slot, event detail, mini chat).
- Persists block order both in local memory (for dev/tests without KV) and Vercel KV (for preview/prod), via the existing `writeDefaultPage` helpers.
- Surfaces accurate block metadata inside the admin UI so editors understand what they are ordering.

This spec supersedes the placeholder-focused `2025-10-31 Admin Default Blocks MVP` document by outlining the work required to serve and manage the full block set end-to-end.

## 1.1 Completed MVP Baseline (Oct 2025)

The prior MVP already landed several foundational pieces we will continue to rely on:

- **Default plan API:** `GET/PUT /v1/plan/default` ships via the Node handler in `apps/api/src/http/plan-default.ts:1-233`, enforcing contiguous block orders, optimistic concurrency on `planHash`, and emitting telemetry spans.
- **Pages store + seed plan:** `apps/api/src/lib/pages-store.ts:1-170` persists encoded plans indefinitely (KV when available, in-memory otherwise), tracks the `pages:default:<tenant>` pointer, and provides the current promo-slot seed helpers plus the CLI seeding entry point in `apps/api/scripts/seed-default-plan.ts:1-80`.
- **Admin experience:** `apps/admin/app/blocks/page.tsx:1-18` + `apps/admin/app/blocks/BlocksClient.tsx:1-320` fetch the default plan server-side, render an accessible drag-and-drop list (keyboard + buttons), and POST changes back through `saveDefaultPlan`. Tests cover reorder/save/conflict paths (`apps/admin/__tests__/blocks.test.tsx:1-170`).
- **Plan client bindings:** `apps/admin/lib/plan-client.ts:1-90` centralizes server/client fetch logic, tenant scoping, and bypass headers so both admin and demo host share the same API contract.
- **Demo host hydration:** `apps/demo-host/lib/useDefaultPlan.ts:1-198` and `apps/demo-host/app/page.tsx:1-200` fetch `/v1/plan/default`, retry on stale hashes, and hydrate the embed without flicker when hashes match.

This document builds on that baseline; the work below replaces the placeholder seed data with the full block roster, aligns IDs/UI with v1.6, and extends the workflow so future block additions and tenants can plug into the same infrastructure.

# 2. Goals

1. **Canonical block source** — expose a shared default plan module that returns the real block instances currently coded in the demo host sample plan **while enforcing v1.6 schema guarantees** (stable `planHash`, canonical ordering, `BlockInstance.id` as UUIDs).
2. **Admin parity** — render the actual block list (names, kinds, preview snippets) inside `/blocks`, keeping the existing reorder/save/reset UX intact and continuing to use the existing **shadcn + Radix UI foundation** for layout/interaction parity.
3. **Persistence** — ensure reordered plans are saved in-process for local dev and in Vercel KV for deployed environments, with deterministic plan hashes and PageDoc canonicalization identical to the API stack.
4. **Embed parity** — guarantee the demo host embed (and any other consumer of `/v1/plan/default`) renders blocks in the same order saved through the admin UI.
5. **Operational visibility & component workflow** — add lightweight telemetry/logging around seed usage vs. persisted plans and keep the **Ladle-driven block playground** flow intact so every block rendered in admin/embed is backed by the same component library.
6. **Line-of-sight to multi-tenant authoring** — land a milestone that keeps data/layout boundaries compatible with the future multi-tenant admin (distinct accounts, multiple hub pages from the shared block library) without delivering the full feature set yet.

# 3. Non-Goals

- Building full block editing (copy, imagery, filters). This work limits itself to ordering the existing block templates.
- Replacing the AI/composer-generated plans or introducing tenant-scoped overrides beyond the single default plan per tenant.
- Implementing auth/RBAC for `/blocks`; environment isolation continues to protect the route.
- Shipping final production-ready visual previews of each block (simple textual previews per block are sufficient for this milestone).

# 4. Current State Summary

| Area | What exists |
| --- | --- |
| Admin UI | `BlocksClient` fetches `/v1/plan/default`, lists `plan.blocks`, and persists reordered arrays via `saveDefaultPlan` (`apps/admin/app/blocks/BlocksClient.tsx:25-320`). Because the API seed only contains promo-slot stubs, editors cannot see the hero/filter/map/etc. |
| API seed storage | `loadSeedPlan` synthesizes three promo-slot blocks (`apps/api/src/lib/pages-store.ts:108-167`). `expectedSeedBlocks`/`MAX_BLOCKS` enforce that exact shape in `handleDefaultPlan` (`apps/api/src/http/plan-default.ts:12-205`). `writeDefaultPage` saves encoded plans to KV (or memory) indefinitely (`apps/api/src/lib/pages-store.ts:90-167`). |
| Demo host | `createSamplePlan` defines the real block payloads with mock data (`apps/demo-host/lib/samplePlan.ts:45-196`). `useDefaultPlan` fetches `/v1/plan/default` when `planMode` allows, falling back to the sample plan otherwise (`apps/demo-host/lib/useDefaultPlan.ts:1-198`). The embed hydrates whichever `PageDoc` it receives (`apps/demo-host/app/page.tsx:1-200`). Block implementations live in `packages/blocks` with shadcn + Radix primitives and are exercised in Ladle stories. |
| Persistence | `persistEncodedPlan` writes `plan:<hash>` documents to KV (no TTL for default pages) or to an in-memory map when KV env vars are absent (`apps/api/src/lib/plan.ts:1-86`). `getDefaultPageHash`/`setDefaultPageHash` keep a pointer in KV or memory at `pages:default:<tenant>` (`apps/api/src/lib/pages-store.ts:30-99`). |

# 5. Proposed Solution

## 5.1 Shared Default Plan Module

- Create `packages/default-plan` (or reuse an existing shared package) that exports:
  - `DEFAULT_BLOCK_TEMPLATES`: array of `{ key, id, kind, defaultOrder }` describing the seven block instances currently defined in `createSamplePlan`.
  - `createDefaultDemoPlan(options)` that returns a `PageDoc` with deterministic timestamps, tenant ID, **UUID-compliant block IDs**, and the full block payloads (filter facets, hero slides, events, promo data, detail stub, mini chat).
  - `getDefaultBlockAllowlist()` to expose `{ key, id, kind }` triples for API enforcement.
- Move the actual block JSON from `apps/demo-host/lib/samplePlan.ts` into this module. The demo host can still pass tenant-specific overrides (title, path, sample events) via options, but the structure lives in one place.
- Provide utilities for:
  - `relabelBlock(block, overrides)` so admin UI can surface human-readable titles (preferring `data.title`, `data.headline`, `analytics.attributes.label` — same logic as today).
  - `summarizeBlock(block)` returning short text (e.g., "Filter bar — facets: date, category") for future preview cards.
- Document the block roster in the module README/table for quick reference:

  | Order | Key | Kind | Notes |
  | --- | --- | --- | --- |
  | 0 | `filter-bar` | `filter-bar` | Date/category facets, reset CTA |
  | 1 | `hero` | `hero-carousel` | Single slide with CTA |
  | 2 | `rail-1` | `collection-rail` | Events rail, streaming mode `initial` |
  | 3 | `map` | `map-grid` | Two pins, preset viewport |
  | 4 | `promo` | `promo-slot` | Sponsored slot metadata |
  | 5 | `detail` | `event-detail` | Modal layout with sample event |
  | 6 | `mini-chat` | `event-mini-chat` | Consent-required starter question |

  All template entries must provide UUID `id` values so the plan aligns with the v1.6 schema and future multi-tenant stores.

## 5.2 API Changes (`apps/api`)

1. Update `loadSeedPlan` to import `createDefaultDemoPlan` and pass the tenant ID so the seeded plan matches the shared templates. Remove the local `SEED_BLOCKS` definitions.
2. Replace `expectedSeedBlocks()` with `getDefaultBlockAllowlist()` from the shared module. Validation in `handleDefaultPlan` should assert both the block count and per-block `{ key, id, kind }` tuple to catch tampering.
3. Keep `persistEncodedPlan(..., { ttlSeconds: null })` so default plans never expire; extend logging to include whether the plan came from seed or storage (`seeded` attribute already exists on fetch spans).
4. Migration/backfill:
   - Add a one-off script (or extend `seed:default-plan`) that rewrites any existing default plan pointer with the new canonical plan. This should wipe stale `plan:<hash>` entries that only contain three promo slots.
   - Document the command in `apps/api/README.md` and in this spec's rollout section.
5. Contract adjustments:
   - Response shape remains `{ plan, encodedPlan, planHash, updatedAt }`.
   - `MAX_BLOCKS` now equals `DEFAULT_BLOCK_TEMPLATES.length` (7).
   - Error codes stay the same (`invalid_block_count`, `invalid_block_order`, `plan_conflict`, etc.).

## 5.3 Admin `/blocks` UI (`apps/admin`)

- Server component (`apps/admin/app/blocks/page.tsx`) continues to fetch the plan during render; ensure `fetchDefaultPlan` bubbles any API errors into a friendly inline message.
- Client component improvements:
  - Render the actual block names from the shared plan (the existing `resolveBlockTitle` logic already surfaces `data.title`/`headline`).
  - Add a compact preview per list item (e.g., hero headline text, filter facet chips, map pin count) using the new `summarizeBlock` helper so editors can distinguish blocks without leaving the page.
  - Maintain drag-and-drop + keyboard ordering (`BlocksClient` already handles both) but update empty-state copy to reference the richer blocks.
  - `Save` should continue to call `saveDefaultPlan(applyOrderToPlan(...))`, but telemetry events should now include `blockCount` to confirm all seven blocks are present.
  - Surface an info banner when the plan was served from the seed (e.g., `initialPlan.plan.meta?.planHash === 'sample-plan'`) so we know if persistence failed.
- Styling must stay on the shadcn + Radix stack already used by admin so controls, focus states, and accessibility affordances match the global design system. Future previews can embed Ladle-tested block fragments.

## 5.4 Demo Host Embed (`apps/demo-host`)

- Replace `createSamplePlan` usage with the shared default plan module. The demo host should call `createDefaultDemoPlan({ tenantId: 'demo', now: Date })` for its fallback plan so the admin and embed stay in sync even when the API is unreachable.
- Ensure `useDefaultPlan` keeps treating the API response as canonical. When the stored plan hash differs from the fallback hash, `Page` already calls `handle.hydrateNext({ plan })`; no changes required aside from importing the new fallback.
- Update the status panel copy to mention when the embed is showing saved default blocks vs. fallback sample data.
- When multiple reorders happen quickly, `planHash` changes each time; maintain the `currentHashRef` logic so the embed only hydrates when the hash actually differs (`apps/demo-host/app/page.tsx:169-183`).

## 5.5 Persistence & Telemetry

- KV vs. memory:
  - `writeDefaultPage` should continue writing to KV if `KV_REST_API_URL/TOKEN` exist; otherwise it uses the in-memory map (`apps/api/src/lib/pages-store.ts:30-105`). Document this so reviewers can test locally without KV.
  - Add structured logs for both storage modes (e.g., `[defaultPlan.update] mode=kv planHash=...` vs. `mode=memory`) to confirm we're persisting where we expect.
- Telemetry:
  - Extend the existing spans (`defaultPlan.fetch`, `defaultPlan.update`) with `block.count` and `block.keys` attributes for quick debugging.
  - Keep Plausible events in the admin UI (`sendAnalytics`) but include the number of reordered blocks so we can monitor adoption.

## 5.6 Ladle Workflow & Future Multi-Tenant Readiness

- Reaffirm that every block rendered in the default plan lives in `packages/blocks` with Ladle stories (empty/loading/populated/error) that use the same props the admin preview touches. Adding new blocks requires:
  1. Implementing the block in the shared block library with shadcn + Radix primitives and accessibility audits.
  2. Registering Ladle stories + axe checks.
  3. Adding the block metadata to `DEFAULT_BLOCK_TEMPLATES`.
  4. Shipping any admin copy or preview metadata in the shared helper functions.
- Multi-tenant readiness:
  - Keep tenant IDs explicit in every plan and pointer key so future admin accounts can seed unique hub pages (`pages:default:<tenant>`).
  - Document how the default plan module can accept per-tenant overrides (titles, themes) without duplicating block definitions, paving the way for multiple hub pages made up of blocks from the same library but hydrated with tenant-specific content.
  - This milestone stops at a single default plan but leaves storage, schema, and UI assumptions compatible with later multi-tenant authoring.

# 6. Work Plan & Deliverables

1. **Shared module** — create `packages/default-plan` with exports + README; migrate `createSamplePlan` consumers.
2. **API hook-up** — update `apps/api/src/lib/pages-store.ts` and `apps/api/src/http/plan-default.ts` to use the shared module, adjust validation, and extend logging.
3. **Seed script refresh** — update `apps/api/scripts/seed-default-plan.ts` to use the new plan; add an option to `--force` rewrite existing pointers if needed.
4. **Admin UI polish** — enhance `/blocks` to render the richer metadata, keep shadcn + Radix components, and ensure the drag/drop logic handles seven blocks (update tests in `apps/admin/__tests__/blocks.test.tsx`).
5. **Demo host alignment** — switch fallback data to the shared module, adjust status messaging, and verify the embed hydrates reordered plans.
6. **Docs + runbook** — add instructions to `docs/engineering/embed-dev.md`, `apps/api/README.md`, and the Ladle story guidelines covering how to reseed KV, add new blocks, and keep admin/embed previews in sync.

# 7. Testing & QA

- **Unit Tests**
  - `packages/default-plan`: snapshot the default plan and verify each block kind/order matches expectations.
  - `pages-store`: ensure `loadSeedPlan` returns seven blocks and that `writeDefaultPage` preserves order + metadata.
  - `BlocksClient`: update Vitest suite (`apps/admin/__tests__/blocks.test.tsx`) to assert reorder/save for the new block keys and success toasts.
- **Integration**
  - Playwright admin test: visit `/blocks`, drag hero below map, save, reload, confirm order persists.
  - Playwright demo test: reorder via admin API, load demo host, confirm embed header order matches new order (can query `[data-block="hero-carousel"]` etc.).
- **Manual**
  - Run `pnpm --filter @events-hub/api seed:default-plan -- --tenant demo` locally (memory mode) and on a preview environment (KV mode); verify logs/report.
  - Verify optimistic concurrency by simulating two saves with stale hashes (expect 412 and an auto-refresh banner).
  - **Playwright MCP note:** Codex CLI runs in a sandbox, so visual verification relies on the Playwright MCP integration. If the MCP isn’t already enabled, the agent must request access from the user before running the local visual suite; once granted, execute the admin/demo host scenarios above to confirm blocks render correctly.

# 8. Rollout Plan

1. Land shared module + API updates behind feature flag `NEXT_PUBLIC_PLAN_MODE=beta` (already respected by demo host). Keep admin UI talking to `/api/default-plan` during development.
2. Run the seed script in staging/prod after deploying the API changes so KV stores the seven-block plan.
3. Smoke-test `/blocks` and the demo host embed on the preview deployment before merging.
4. Once verified, flip `NEXT_PUBLIC_PLAN_MODE` to `prod` in the demo host env so the embed always fetches the persisted plan.
5. Monitor logs (`defaultPlan.fetch seeded=false mode=kv`) to ensure KV is serving the plan; fall back to memory if needed and document any incidents.

# 9. Open Questions (Current Status)

1. **Block previews:** Textual metadata is sufficient for this milestone; no visual thumbnails are required yet.
2. **Feature scope:** Keep the admin experience focused on ordering only—enable/disable toggles and broader content management remain out of scope until the full authoring system lands.
3. **Tenancy:** Only a single tenant (`demo` or an equivalent account ID) is needed right now. Multi-tenant support will be considered when account management is introduced.

# 10. Milestone Definition

This project aims to deliver a **minimum viable default-plan system** where:

- Blocks rendered in admin and demo embed match the production block library (shadcn/Radix UI, Ladle stories, UUID IDs, telemetry).
- Editors can reorder the canonical block list, save to KV, and immediately see the impact in the demo embed.
- The data model, storage keys, and shared plan module keep the door open for adding new blocks and scaling to multi-tenant hubs without re-architecting.

Full block authoring, per-tenant customization, and advanced content workflows remain out of scope, but the milestone secures the technical runway to build toward that future.
