# Admin Default Blocks MVP — Implementation Plan

## Overview
- Deliver API-backed default block ordering editable from the admin `/blocks` page and consumed by the demo host, replacing the inline sample plan while reusing existing plan persistence. 
- Align admin, API, and embed flows with the interim architecture so teams can validate cross-surface ordering ahead of full authoring tooling.

## Current State (from Research)
- Admin landing links to `/blocks`, but the route is missing, so editors hit a 404 and cannot alter default ordering; the demo host still renders a hard-coded `samplePage`. `apps/admin/app/page.tsx:4`, `apps/demo-host/app/page.tsx:43` ([docs/research/2025-10-31-admin-default-embed-research.md:20-47](docs/research/2025-10-31-admin-default-embed-research.md#L20))
- PageDoc schema enforces ordered `blocks` arrays; canonicalization rewrites indices so drag-and-drop updates can persist via existing helpers. `packages/page-schema/src/index.ts:297`, `packages/page-schema/src/index.ts:338` ([docs/research/2025-10-31-admin-default-embed-research.md:38-84](docs/research/2025-10-31-admin-default-embed-research.md#L38))
- API today only serves compose/plan-by-id endpoints; persistence utilities already write encoded plans to KV or memory with hashing. `apps/api/api/v1/compose.ts:182`, `apps/api/api/v1/plan/[id].ts:18`, `apps/api/src/lib/plan.ts:37` ([docs/research/2025-10-31-admin-default-embed-research.md:54-58](docs/research/2025-10-31-admin-default-embed-research.md#L54))
- Demo host bootstrap passes the inline plan to `bootstrapEmbed`, so it never refetches when admin ordering changes. `apps/demo-host/app/page.tsx:262` ([docs/research/2025-10-31-admin-default-embed-research.md:51-86](docs/research/2025-10-31-admin-default-embed-research.md#L51))

## Desired End State
- `GET/PUT /v1/plan/default` returns and persists a tenant-aware default `PageDoc`, storing encoded plans indefinitely and tracking the active hash pointer. `apps/api/api/v1/plan/default.ts` (new) ([docs/specs/2025-10-31-admin-default-blocks-spec.md:29-37](docs/specs/2025-10-31-admin-default-blocks-spec.md#L29))
- Admin `/blocks` page renders a keyboard-accessible drag-and-drop list of default blocks, saving reorderings via the new API and surfacing optimistic feedback. `apps/admin/app/blocks/page.tsx` ([docs/specs/2025-10-31-admin-default-blocks-spec.md:39-50](docs/specs/2025-10-31-admin-default-blocks-spec.md#L39))
- Demo host fetches the default plan on load, falls back to the inline sample only after repeated failures, and avoids flicker when hashes match. `apps/demo-host/app/page.tsx` ([docs/specs/2025-10-31-admin-default-blocks-spec.md:52-61](docs/specs/2025-10-31-admin-default-blocks-spec.md#L52))
- Observability and seeding flows cover KV fallback, admin console instrumentation, and CLI seed for shared environments. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:62-128](docs/specs/2025-10-31-admin-default-blocks-spec.md#L62))

## Non-Goals
- Rich block editing, theming, or AI-assisted authoring beyond ordering. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:20-25](docs/specs/2025-10-31-admin-default-blocks-spec.md#L20))
- Introducing new persistence layers; we only reuse plan encoding plus KV/memory helpers. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:22-35](docs/specs/2025-10-31-admin-default-blocks-spec.md#L22))
- Production-grade RBAC or final UX polish; MVP relies on environment isolation and minimal styling. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:41-50](docs/specs/2025-10-31-admin-default-blocks-spec.md#L41))

## Architecture & Approach
- Extend the API with a dedicated Node handler (`apps/api/api/v1/plan/default.ts`) that integrates new `pages-store` helpers for pointer reads/writes and uses `encodeCanonicalPlan` + `withPlanHash` for validation and persistence. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:29-37](docs/specs/2025-10-31-admin-default-blocks-spec.md#L29))
- New `apps/api/src/lib/pages-store.ts` abstracts KV vs in-memory storage with tenant-aware keys (`pages:default:<tenantId>`), ensuring default plans persist without TTL. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:33-36](docs/specs/2025-10-31-admin-default-blocks-spec.md#L33))
- Admin UI fetches the default plan server-side, streams to a client component using `@dnd-kit` for accessible drag-and-drop, and posts reordered arrays back to the API with optimistic state management. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:39-50](docs/specs/2025-10-31-admin-default-blocks-spec.md#L39))
- Demo host replaces the inline `samplePage` bootstrap with API hydration, using plan hashes to skip redundant resets and providing loading/error status. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:52-61](docs/specs/2025-10-31-admin-default-blocks-spec.md#L52))
- Seed script and documentation updates ensure shared environments can pre-populate the default plan and operators know how to monitor KV fallback modes. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:62-128](docs/specs/2025-10-31-admin-default-blocks-spec.md#L62))
- **Alternatives considered:** Reusing `/v1/compose` with a fixed preset would avoid a new endpoint but couples admin UI to composer internals and complicates persistence of manual ordering, so we follow the dedicated `/v1/plan/default` path to keep authoring autonomy and reuse pointer storage. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:29-37](docs/specs/2025-10-31-admin-default-blocks-spec.md#L29), [docs/research/2025-10-31-admin-default-embed-research.md:119-122](docs/research/2025-10-31-admin-default-embed-research.md#L119))

## Phases

### Phase 1 — Default Plan API Foundations
**Goal:** Serve tenant-aware default plans with durable persistence and pointer helpers.

**Changes**
- Code: `apps/api/src/lib/pages-store.ts` — new helper for `getDefaultPageHash`/`setDefaultPageHash`, KV + memory parity.
- Code: `apps/api/src/lib/plan.ts` — extend persistence utilities for no-TTL writes (if needed) and expose shared fallback seeds.
- Code: `apps/api/api/v1/plan/default.ts` — implement `GET/PUT` handlers with canonicalization, concurrency guard (etag/hash), and default seed.
- Config/Infra: `apps/api/vercel.json` if routing updates are required to expose the new endpoint; ensure `pages-store` dependencies registered.

**Notes**
- Default seed returns placeholder blocks (`block one`, `block who`, `block three`) when no persisted plan exists. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:31-33](docs/specs/2025-10-31-admin-default-blocks-spec.md#L31))
- Persist encoded plans under `plan:<hash>` without expiry and write `pages:default:<tenantId>` pointer; 412 responses protect against stale hashes.

**Success Criteria**  
**Automated**
- [ ] Build/typecheck passes: `pnpm -w build`
- [x] API unit tests (new + existing): `pnpm --filter @events-hub/api test`
- [ ] Lint (workspace): `pnpm -w lint`
- [x] Integration test covering GET/PUT flow via Vitest supertest harness.
- [ ] Seed script dry-run (if automated): `pnpm --filter @events-hub/api seed:default-plan -- --tenant demo` *(add script before running)*
**Manual**
- [ ] Verify local API `GET /v1/plan/default` returns seed payload with plan hash.
- [ ] Confirm `PUT /v1/plan/default` updates pointer and returns canonicalized order.
- [ ] Exercise KV-disabled mode to ensure memory fallback logs warning but responds correctly.

---

### Phase 2 — Admin Blocks UI
**Goal:** Provide accessible drag-and-drop ordering and persistence from the admin console.

**Changes**
- Code: `apps/admin/app/blocks/page.tsx` — server component fetching default plan and passing to client module.
- Code: `apps/admin/app/blocks/BlocksClient.tsx` (new) — client-side DnD kit list with optimistic reorder, status messaging, and keyboard sensor.
- Code: `apps/admin/package.json` — add `@dnd-kit/core`, `@dnd-kit/sortable`, possibly icons; update `pnpm-lock.yaml`.
- Code: `apps/admin/lib/plan-client.ts` (new) — typed fetch wrapper for `GET/PUT /v1/plan/default` with retry/backoff.
- Tests: `apps/admin/__tests__/blocks.test.tsx` — RTL coverage for reorder, disabled save, error handling, 412 retry path.
- Docs: `apps/admin/README.md` — mention `/blocks` feature flag and environment requirement if applicable.

**Notes**
- Use `NEXT_PUBLIC_API_BASE` with sensible fallback (localhost) and handle beta flag `NEXT_PUBLIC_PLAN_MODE`. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:39-50](docs/specs/2025-10-31-admin-default-blocks-spec.md#L39))
- Inline telemetry via `console.debug('admin-default-plan', …)` and optional `window.plausible` instrumentation. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:62-70](docs/specs/2025-10-31-admin-default-blocks-spec.md#L62))

**Success Criteria**  
**Automated**
- [x] Build/typecheck passes: `pnpm --filter @events-hub/admin build`
- [x] Admin unit tests: `pnpm --filter @events-hub/admin test`
- [x] Lint (admin app): `pnpm --filter @events-hub/admin lint`
- [ ] Workspace lint to validate shared TS types: `pnpm -w lint`
- [ ] Optional a11y smoke (if available): `pnpm -w check:a11y`

> **Build note:** `pnpm -w lint` is currently blocked by Turbo’s TLS/keychain handshake (`Unable to set up TLS. No keychain is available.`). Re-run once the machine keychain is fully unlocked or run Turbo with remote cache disabled.
**Manual**
- [ ] Reorder blocks via mouse and keyboard; ensure optimistic reorder matches API response.
- [ ] Validate disabled Save state during network call and success/error messaging.
- [ ] Confirm telemetry logs appear and no console errors in dev tools.

---

### Phase 3 — Demo Host Embed Integration & Rollout
**Goal:** Hydrate demo host from the API-backed plan, document rollout, and provide seeding utilities.

**Changes**
- Code: `apps/demo-host/app/page.tsx` — replace inline `samplePage` bootstrap with fetch against `/v1/plan/default`, error retries, and hash-aware reset guard.
- Code: `apps/demo-host/lib/useDefaultPlan.ts` (new) — encapsulate fetch, retries, and fallback to static sample.
- Code: `apps/demo-host/__tests__/page.test.tsx` — expand coverage for loading/error states and ensure `bootstrapEmbed` receives network plan.
- Docs: `docs/engineering/embed-dev.md` — add instructions for default plan API and troubleshooting. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:62-128](docs/specs/2025-10-31-admin-default-blocks-spec.md#L62))
- Scripts: `apps/api` or root `scripts/seed-default-plan.ts` — implement CLI referenced by spec for KV seeding.
- Config: `.env.example` updates for admin/demo host to surface `NEXT_PUBLIC_API_BASE` guidance. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:118-130](docs/specs/2025-10-31-admin-default-blocks-spec.md#L118))

**Notes**
- Maintain fallback to existing sample plan after two failed fetch attempts to guard demos. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:52-55](docs/specs/2025-10-31-admin-default-blocks-spec.md#L52))
- Roll out behind `NEXT_PUBLIC_PLAN_MODE=beta`, flipping to `prod` after seeding and QA. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:124-130](docs/specs/2025-10-31-admin-default-blocks-spec.md#L124))

**Success Criteria**  
**Automated**
- [x] Demo host unit/integration tests: `pnpm --filter @events-hub/demo-host test`
- [x] Build/typecheck: `pnpm --filter @events-hub/demo-host build`
- [ ] Workspace build/lint: `pnpm -w build`, `pnpm -w lint`
- [ ] Optional bundle budget check: `pnpm -w check:bundles`
**Manual**
- [ ] In beta mode, confirm demo host shows loading state, then renders API-backed blocks without flicker when hash unchanged.
- [ ] Toggle API failure (e.g., offline) to verify fallback sample plan and surfaced error message.
- [ ] Run seed script in staging KV and confirm admin + demo host reflect seeded order.

## Testing Strategy
- Unit: Cover API happy/error paths (seed fallback, 412 concurrency, KV failure), admin reorder logic including keyboard sensor, and demo host fetch flow with retries. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:62-90](docs/specs/2025-10-31-admin-default-blocks-spec.md#L62))
- Integration/E2E: Consider Playwright smoke to drag blocks and verify demo host view if existing e2e harness can be extended; otherwise rely on manual QA script described in spec. 
- Observability: Log KV fallback warnings, `console.debug` admin events, and embed status panel states; ensure logs include tenant + plan hash for traceability.

## Performance & Security
- Persistence without TTL keeps default plans cached; monitor KV write/read latency via existing OTEL spans. (`apps/api/api/v1/compose.ts` instrumentation reused) ([docs/research/2025-10-31-admin-default-embed-research.md:54-75](docs/research/2025-10-31-admin-default-embed-research.md#L54))
- API endpoints respect environment isolation; no new auth introduced, but document risk and ensure no sensitive data logged. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:139-142](docs/specs/2025-10-31-admin-default-blocks-spec.md#L139))
- Ensure client fetches enforce HTTPS in production and guard against stale hashes to prevent replay.

## Migration & Rollback
- Migration: Deploy API endpoint first, run seed script per tenant, enable admin UI behind feature flag, and finally switch demo host to API mode.
- Rollback: Flip `NEXT_PUBLIC_PLAN_MODE` to legacy/sample, revert demo host changes, and remove pointer entry from `pages:default:<tenantId>` (keeping last known encoded plan). Update admin UI flag to hide `/blocks` route if endpoint must be disabled.

## Risks & Mitigations
- Pointer drift if multiple saves race → enforce hash-based concurrency and refetch after 412. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:134-135](docs/specs/2025-10-31-admin-default-blocks-spec.md#L134))
- KV outages leading to empty responses → memory fallback plus admin banner/log warnings; document operational steps. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:135-136](docs/specs/2025-10-31-admin-default-blocks-spec.md#L135))
- Drag-and-drop accessibility gaps → leverage `KeyboardSensor`, provide instructions, and add automated a11y checks as capacity allows. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:49-50](docs/specs/2025-10-31-admin-default-blocks-spec.md#L49))
- Demo host flash when plan unchanged → compare hashes before reinitializing embed. ([docs/specs/2025-10-31-admin-default-blocks-spec.md:136-137](docs/specs/2025-10-31-admin-default-blocks-spec.md#L136))

## Timeline & Owners (optional)
- Phase 1 → 2-3 engineer days (Backend)
- Phase 2 → 3 engineer days (Frontend/admin)
- Phase 3 → 2 engineer days (Frontend/demo host + docs)

## References
- Spec: `docs/specs/2025-10-31-admin-default-blocks-spec.md`
- Research: `docs/research/2025-10-31-admin-default-embed-research.md`
- Supporting code/docs: `apps/api/src/lib/plan.ts`, `apps/demo-host/app/page.tsx`, `packages/page-schema/src/index.ts`
