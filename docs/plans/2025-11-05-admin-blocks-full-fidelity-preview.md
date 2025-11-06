# Admin Blocks Full-Fidelity Preview — Implementation Plan

## Overview
- Replace the placeholder default-plan seed with the full block roster so `/blocks` and the demo host stay in sync, matching the spec in `docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md`.
- Deliver a shared module that encapsulates block metadata, wire it through the API pointer store, and refresh both admin UI and demo host fallback logic.

## Current State (from Research)
- API `loadSeedPlan` emits three promo-slot stubs, so persisted plans never contain hero/filter/map blocks even though the demo host fallback plan does (`apps/api/src/lib/pages-store.ts:108`).
- Admin `/blocks` fetches `/v1/plan/default` and offers reorder/save/reset but the list shows indistinguishable placeholder rows, reducing editor trust (`apps/admin/app/blocks/BlocksClient.tsx:25`).
- Demo host’s `useDefaultPlan` hydrates the embed with API data when available, but otherwise falls back to `apps/demo-host/lib/samplePlan.ts`, so it routinely diverges from what the admin UI shows (`apps/demo-host/lib/useDefaultPlan.ts:29`).
- Persistence relies on `writeDefaultPage` storing encoded `PageDoc`s in Vercel KV (or in-memory) and a `pages:default:<tenant>` pointer, but there is no migration path to rewrite old placeholder plans (`apps/api/src/lib/pages-store.ts:30`).
- Tests cover reorder/save/conflict flows for the current stub data set in both admin Vitest suites and API default-plan tests (`apps/admin/__tests__/blocks.test.tsx:1`, `apps/api/__tests__/default-plan.test.ts:1`).
- Key files/modules:
  - `apps/api/src/lib/pages-store.ts:30` — pointer store, seed helpers, KV/memory persistence.
  - `apps/api/src/http/plan-default.ts:12` — GET/PUT request handling, validation, telemetry.
  - `apps/demo-host/lib/samplePlan.ts:18` — richer fallback plan currently unused by API.
  - `apps/admin/lib/plan-client.ts:3` — server/client bindings for `/v1/plan/default`.
  - `apps/demo-host/app/page.tsx:18` — embed hydration orchestrator using plan hashes.

## Desired End State
- A canonical shared module exports the seven default block templates with UUID ids, metadata helpers, and deterministic timestamps.
- `GET/PUT /v1/plan/default` always reads/writes the canonical plan, persists to KV/in-memory stores, validates `{key,id,kind}` tuples, and logs seed vs. stored usage.
- Admin `/blocks` renders the true block set with textual previews, telemetry showing accurate block counts, and accessible drag/drop semantics unchanged.
- Demo host fallback uses the same module so API outages still present the canonical plan, and status UI explains whether data is seeded vs. stored.
- Seed scripts can rewrite existing KV data to the new plan, and docs/runbooks explain how to reseed local + preview environments.

## Non-Goals
- Editing block content beyond ordering (copy/images/filters remain static).
- Building visual thumbnails; textual metadata per block suffices per spec.
- Delivering multi-tenant authoring flows or RBAC; only the current tenant pointer is addressed.
- Altering embed SDK rendering beyond feeding it the correct `PageDoc`.

## Architecture & Approach
- Introduce `packages/default-plan` exporting `DEFAULT_BLOCK_TEMPLATES`, `createDefaultDemoPlan`, metadata helpers, and tenant-aware overrides so admin, API, and demo host consume identical data.
- API seed + validation layers import the module, derive allowlists from it, canonicalize via `@events-hub/page-schema`, and persist through existing KV helpers with extended telemetry/logging.
- Admin UI augments list items with metadata summaries using helpers from the shared module, keeps existing drag/drop workflow, and surfaces status banners when data originated from seed vs. storage.
- Demo host fallback simply calls `createDefaultDemoPlan` and displays status about saved vs. fallback plans while keeping hydration logic intact.
- Alternatives considered:
  - **Re-export sample plan from the demo host** — rejected because it would keep plan logic in an app package and make API/admin imports cyclic; a standalone shared package gives clear ownership.
  - **Store per-block metadata documents** — rejected because it would complicate pointer reads and require cross-collection joins without immediate benefit; a single canonical `PageDoc` keeps persistence simple.

## Phases

### Phase 1 — Shared Default Plan Package
**Goal:** Centralize the full-fidelity block templates and helpers for reuse across apps.

**Changes**
- Code: `packages/default-plan/index.ts` — move JSON from `apps/demo-host/lib/samplePlan.ts`, ensure UUID ids, deterministic timestamps, helper exports.
- Code: `packages/default-plan/README.md` — document roster, usage patterns, multi-tenant override extensibility.
- Tests: `packages/default-plan/__tests__/default-plan.test.ts` — snapshot plan structure, verify key order/kind metadata.

**Notes**
- Keep block definitions referencing `packages/blocks` props only; avoid importing React components to stay tree-shakeable.
- Publish new package name in the workspace via `package.json` + `tsconfig` path updates so other packages resolve it cleanly.

**Success Criteria**  
**Automated**
- [x] Workspace build passes: `pnpm -w build`
- [x] Package-level tests run: `pnpm --filter @events-hub/default-plan test`
- [x] Lint stays green: `pnpm -w lint`
**Manual**
- [x] Inspect generated plan to confirm metadata (titles, ids, analytics labels) matches former `samplePlan`
- [x] Confirm README enumerates all blocks and usage instructions

---

### Phase 2 — API Integration & Migration
**Goal:** Serve and persist the shared plan through `/v1/plan/default`, plus refresh stored hashes.

**Changes**
- Code: `apps/api/src/lib/pages-store.ts` — replace inline seed with `createDefaultDemoPlan`, import allowlist, add logging for storage mode + seeded flag.
- Code: `apps/api/src/http/plan-default.ts` — validate `{key,id,kind}` via `getDefaultBlockAllowlist`, set `MAX_BLOCKS` to template length, attach telemetry attributes.
- Code: `apps/api/scripts/seed-default-plan.ts` — parameterize tenant, add `--force` rewrite to purge old placeholder hashes, reuse shared module.
- Tests: `apps/api/__tests__/default-plan.test.ts` — update fixtures to expect seven blocks and new validation paths.
- Docs: `apps/api/README.md` + `docs/engineering/embed-dev.md` — document seeding commands, KV vs. memory expectations.

**Notes**
- Need idempotent migration: when `--force` runs, delete old `plan:<hash>` docs and repoint `pages:default:<tenant>` to new hash within one transaction to avoid dangling pointers.
- Maintain optimistic concurrency semantics; ensure plan hash computation stable when only order changes.

**Success Criteria**  
**Automated**
- [x] API unit tests: `pnpm --filter @events-hub/api test`
- [x] Workspace build/lint: `pnpm -w build`, `pnpm -w lint`
- [x] Contract/e2e smoke (API): `pnpm playwright test --project=api-preview --grep @default-plan`
**Manual**
- [ ] Run `pnpm --filter @events-hub/api seed:default-plan -- --tenant demo --force` locally (memory mode) and confirm logs show `mode=memory seeded=false`
- [ ] Hit `GET /v1/plan/default` in local/staging and verify block list/metadata matches shared templates
- [ ] Validate rollback path by restoring previous plan hash backups if needed

---

### Phase 3 — Admin `/blocks` Parity & UX Enhancements
**Goal:** Display the real block roster with informative previews while retaining accessibility and telemetry.

**Changes**
- Code: `apps/admin/app/blocks/BlocksClient.tsx` — import metadata helpers, render summary text per block, show seed-vs-stored banner, include `blockCount` in analytics payloads.
- Code: `apps/admin/app/blocks/page.tsx` — enhance error/loading states, ensure server component surfaces API issues clearly.
- Code: `apps/admin/lib/plan-client.ts` — expose seed metadata (e.g., `plan.meta.seeded`) for UI banner.
- Tests: `apps/admin/__tests__/blocks.test.tsx` — update fixtures to include seven blocks, add expectations for preview text, concurrency banners, and analytics payloads.
- Styles: ensure any new UI leverages existing shadcn + Radix primitives for consistent focus states (`apps/admin/app/blocks/BlocksClient.tsx`).

**Notes**
- Keep drag/drop semantics identical to preserve existing accessibility coverage; new metadata must not break keyboard flows.
- Use feature flag or environment guard if we need to hide previews until API deploy is live.
- 2025-11-06: Added host-derived API base fallback in `apps/admin/lib/plan-client.ts` so Vercel preview/prod domains resolve `/v1/plan/default` without extra env vars. Blocks page now passes the incoming host to reuse the same logic.

**Success Criteria**  
**Automated**
- [x] Admin unit/UI tests: `pnpm --filter @events-hub/admin test`
- [x] Lint/typecheck: `pnpm -w lint`, `pnpm -w build`
- [ ] Playwright admin run: `pnpm playwright test --project=admin-preview --grep @blocks`
**Manual**
- [x] Verify `/blocks` lists hero/filter/map/etc. with clear summaries in local dev
- [x] Drag hero below map, save, reload page, confirm order persists and banner disappears once plan is stored
- [x] Confirm toast/telemetry indicates correct `blockCount`

_Manual note: `/blocks` occasionally required multiple refreshes on `localhost:3000` before the new order appeared, but the saved plan always surfaced after a couple of reloads._

---

### Phase 4 — Demo Host Alignment, Telemetry, and Docs
**Goal:** Ensure the embed always reflects saved order, even offline, and document the workflow end-to-end.

**Changes**
- Code: `apps/demo-host/lib/useDefaultPlan.ts` & `apps/demo-host/lib/samplePlan.ts` — replace bespoke sample plan with shared module fallback, expose status strings for seed vs. persisted plans.
- Code: `apps/demo-host/app/page.tsx` — update status panel copy, log plan hashes for debugging, ensure hydration respects shared metadata.
- Observability: extend telemetry/logging (both admin + API) with block counts/keys, add Plausible events for reorder saves containing new block names.
- Docs: `docs/engineering/embed-dev.md`, `docs/dev/blocks.md` (if exists) — add instructions for reseeding, verifying demo host parity, and using Ladle stories when adding new blocks.
- Playwright: add/extend scenario `playwright/projects/demo-hosts/default-plan.spec.ts` to reorder via admin API then assert embed order updates.

**Notes**
- Maintain `planMode` guard (`NEXT_PUBLIC_PLAN_MODE`) so we can deploy safely; update env docs after validation.
- Ensure fallback hash differs from stored hash to avoid unnecessary hydrations when offline.

**Success Criteria**  
**Automated**
- [x] Demo host unit tests: `pnpm --filter @events-hub/demo-host test`
- [x] E2E parity tests: `pnpm test:parity`
- [x] Workspace checks: `pnpm -w build`, `pnpm -w lint`, `pnpm check:bundles`
**Manual**
- [ ] In preview deployment, reorder blocks via `/blocks`, then confirm demo host embed reflects change after refresh
- [ ] Toggle `NEXT_PUBLIC_PLAN_MODE=beta` locally to ensure fallback copy indicates seed usage
- [ ] Review telemetry dashboards/logs to confirm new attributes arrive (block count, keys, seeded flag)

## Testing Strategy
- **Unit**: Cover shared module outputs (order, ids, metadata), API validation paths, admin preview rendering, and demo host fallback selection. Use Vitest snapshots where JSON stability matters.
- **Integration/E2E**: Extend Playwright suites to (1) reorder blocks via admin UI, (2) confirm `/v1/plan/default` persists new order, and (3) assert the demo host embed (or status panel) reflects the change. Include API contract tests for invalid block counts/ids.
- **Observability**: Add structured logs (`defaultPlan.fetch` / `defaultPlan.update`) with `mode`, `seeded`, and `block.keys`, plus Plausible events for reorder actions. If available, ensure OTEL spans record same attributes for correlation.
- **Playwright MCP requirement**: Local Playwright runs that need full browser access must use the Playwright MCP integration noted in the spec. Before executing the admin/demo host visual suites, request/enable MCP access so the sandboxed CLI can launch browsers; once granted, run the scenarios above.

## Performance & Security
- Performance: Default plan JSON stays small (<20 KB). Monitor bundle size impact of the shared module via `pnpm check:bundles`. Ensure helper imports avoid pulling React into serverless handlers.
- Security: Validate all `{key,id,kind}` triples server-side to prevent tampered payloads, continue optimistic concurrency to guard against overwrites, and keep KV credentials scoped to API only. No additional PII introduced; continue to scrub logs.

## Migration & Rollback
- Migration: Run updated `seed:default-plan` with `--force` in each environment immediately after deploying API changes to hydrate KV with the canonical plan. Document the command and expected logs in `apps/api/README.md`.
- Backfill: If KV unavailable, memory store auto-seeds on first GET; add warning logs so operators know persistence is degraded.
- Rollback: Retain prior `plan:<hash>` documents (before pruning) or export them before running `--force`. In an incident, restore pointer to old hash via `setDefaultPageHash` script and redeploy previous API build.

## Risks & Mitigations
- **Risk: Mismatched schemas between shared module and page-schema** → Add unit tests that validate `createDefaultDemoPlan` output against `PageDocSchema`.
- **Risk: Seed script wipes existing customer plans** → Gate `--force` behind explicit flag and log target tenant/hash before mutation; dry-run mode for verification.
- **Risk: Admin UI previews break accessibility** → Reuse shadcn + Radix components and rerun accessibility checks (`pnpm check:a11y`) before shipping.
- **Risk: Demo host hydration loops due to hash drift** → Maintain deterministic hashing by keeping timestamps stable and writing tests covering hash recalculation on reorder-only changes.

## Timeline & Owners
- Phase 1 — 1.5d (Platform team)  
- Phase 2 — 2d (API + Infra)  
- Phase 3 — 2d (Admin UX)  
- Phase 4 — 1.5d (Demo host + Docs)

## References
- Spec: `docs/specs/2025-02-15-admin-blocks-full-fidelity-spec.md`
- Research: `docs/research/2025-11-05-admin-blocks-default-plan-research.md`
- Related code: `apps/api/src/lib/pages-store.ts`, `apps/admin/app/blocks/BlocksClient.tsx`, `apps/demo-host/lib/samplePlan.ts`
