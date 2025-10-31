---
title: "Admin Default Blocks MVP"
date: "2025-10-31"
authors: ["ChatGPT Codex 5"]
status: "draft"
related_research: "../research/2025-10-31-admin-default-embed-research.md"
---

# 1. Background

The admin console currently renders only the landing page (`apps/admin/app/page.tsx`) with a link to `/blocks`, while the demo host embed mounts a hard-coded `samplePage` defined in `apps/demo-host/app/page.tsx`. To align with the v1.6 architecture (admin → content API → embed), we need an interim flow that sources the default block list from the API, enables lightweight reordering in the admin UI, and feeds the demo host embed without introducing a full database-backed authoring experience.

# 2. Goals

- Serve a default `PageDoc` plan from the API that contains three placeholder blocks named `block one`, `block who`, and `block three`.
- Expose the default plan in the admin `/blocks` route, rendering the block list within a drag-and-drop UI that lets editors change order and persist updates.
- Update the demo host embed so it hydrates from the API-backed default plan rather than the inline `samplePage`.
- Persist reordered plans using existing plan storage utilities so no new database is required for this milestone.

# 3. Non-Goals

- Building full block editing, theming, or content authoring interfaces.
- Introducing new persistence layers beyond the existing plan encoding + KV/memory cache helpers.
- Replacing the composer or AI-driven plan generation; this MVP only manages the static default plan.
- Designing final production UX for drag-and-drop; minimal styling is acceptable.

# 4. Solution Overview

## 4.1 Default Plan Service
- Implement a dedicated Node runtime handler at `apps/api/api/v1/plan/default.ts`.
- `GET /v1/plan/default` returns the active `PageDoc` plus the persisted `encodedPlan`. When no custom plan exists, the handler hydrates a built-in fallback that seeds the three placeholder blocks and derives a plan hash with `withPlanHash`.
- `PUT /v1/plan/default` accepts `{ plan: PageDoc }` where only `blocks.order` changes. The handler canonicalizes via `encodeCanonicalPlan`, validates, persists the encoded payload with a **new** helper that stores the plan without TTL, and writes the active plan hash to the pages-store pointer (`pages:default:<tenantId>`).
- Persistence & pointer strategy (aligned with v1.6 “Pages Store” direction):
  - New module `apps/api/src/lib/pages-store.ts` provides `getDefaultPageHash`, `setDefaultPageHash`, and abstracts KV vs memory fallback. This module will later plug into the durable Pages Store when it lands.
  - Encoded plans are written under `plan:<hash>` **without expiry** so default pages never evaporate; pointer entries also persist without TTL. Memory fallback mirrors this behaviour in-process.
- Tenant-aware keys (`pages:default:<tenantId>`) allow the MVP to scale once multiple tenants are onboarded without changing the API contract.
- Response payload on both methods: `{ plan: PageDoc, encodedPlan: string, planHash: string, updatedAt: string }`.

## 4.2 Admin `/blocks` Route
- Add `apps/admin/app/blocks/page.tsx` as a server component that fetches `GET /v1/plan/default` during render (API base sourced from `NEXT_PUBLIC_API_BASE` with a local fallback).
- The server component streams the initial plan into a `'use client'` child that renders the drag-and-drop list using `@dnd-kit/core` + `@dnd-kit/sortable`. We will add these libraries to the admin `package.json`.
- Row layout per block:
  - Drag handle icon, zero-based position badge, human-readable title (from `block.data.title ?? block.key`), and a caption showing `kind` and `id`.
  - Read-only block metadata drawer is deferred; MVP keeps the list compact within the page width.
- Saving:
  - `Save` button triggers `PUT /v1/plan/default` with the reordered `plan.blocks`.
  - Button disables and shows spinner while pending; optimistic reorder updates local state immediately and replays server canonical order on success.
  - Render inline success (`Plan updated`) or error messaging. Failures keep the optimistic order but surface an action to retry.
- Accessibility:
  - Provide keyboard reordering via `@dnd-kit/sortable` `KeyboardSensor`. Visible focus ring + instructions (`Press space to pick up`).

## 4.3 Demo Host Embed Bootstrap
- Replace the inline `samplePage` in `apps/demo-host/app/page.tsx` with a fetch shim:
  - During initial client effect, call `GET /v1/plan/default` using `getApiBase()`; fallback to the static sample only when the API call fails twice.
  - Pass the resolved `PageDoc` and `encodedPlan` to `bootstrapEmbed({ initialPlan, encodedPlan })`.
  - Surface loading (`Loading default blocks…`) and error (`Unable to load default plan`) states in the existing status panel.
- Cache the successful plan in component state; if the plan hash matches the previous response, skip resetting the embed to avoid flicker.

## 4.4 Shared Utilities & Observability
- Introduce `apps/api/src/lib/pages-store.ts` with helpers `getDefaultPageHash(tenantId)`, `setDefaultPageHash(tenantId, planHash)`, and `writeDefaultPage(plan)`; these wrap KV (no TTL) with in-memory fallback and mirror the interface expected from the upcoming durable Pages Store.
- `loadSeedPlan()` returns the fallback stub stamped with `version: '1.6'`, ensuring plans align with v1.6 schemas from day one.
- Extend telemetry:
  - Emit `defaultPlan.fetch` and `defaultPlan.update` spans with attributes (`tenantId`, `planHash`, `source`).
  - Log warnings when validation fails or when `persistEncodedPlan` falls back to memory.
- Provide a CLI script (`pnpm --filter @events-hub/api seed:default-plan -- --tenant demo`) that invokes the same pages-store helpers to write the fallback plan per tenant for staging/production.

# 5. Functional Requirements

## 5.1 API
- `GET /v1/plan/default` (Node runtime, cached `no-store`):
  - Optional query `tenantId` defaults to `demo`.
  - Reads the pointer for the tenant; when missing, loads the seeded fallback, writes it through the pages-store helper (no TTL), and returns the resulting hash.
  - Responds with 200 and `{ plan, encodedPlan, planHash, updatedAt }`.
- `PUT /v1/plan/default`:
  - Validates body schema (`{ plan: PageDoc }`) using the existing Zod validator in `packages/page-schema`.
  - Guard rails: exactly three blocks, fixed `id`/`key`/`kind`, and contiguous `order` values. Reject with 400 when constraints fail.
  - Server overwrites `plan.updatedAt` with `new Date().toISOString()` to ensure a trusted timestamp.
  - Canonicalizes the plan, persists encoded plan without expiry, updates pointer, and returns the canonical payload (same shape as GET). Response always reflects `plan.version = '1.6'`.
  - Emit 412 when the request `plan.meta.planHash` mismatches the stored pointer to prevent lost updates; clients must refetch before retrying.
- Error handling:
  - 503 when the pointer cannot be persisted (KV outage + memory fallback disabled via env guard).
  - JSON responses include `{ error: string, message?: string }`.

## 5.2 Admin UI
- Server component fetch uses `cache: 'no-store'` to reflect the latest order and forwards `tenantId=demo`.
- Client component:
  - Maintains local drag state and `pendingPlanHash` to handle optimistic updates + 412 retry.
  - Surfaces keyboard shortcuts and aria attributes (`aria-roledescription="sortable"`).
  - Disables `Save` until the order differs from the canonical payload.
- Include dismissible inline `Callout` component for errors; success state auto-dismisses after 4 seconds.

## 5.3 Demo Host
- Initialize loading state to `loading` and show the current spinner UI message.
- Attempt fetch on mount; retries once with exponential backoff (250ms) before showing error.
- When API returns 412, treat as stale data, refetch immediately (no user-facing error).
- On success, update the embed only when `planHash` changes.

## 5.4 Telemetry & Logging
- API logs:
  - `info` on successful PUT with fields `{ tenantId, planHash, source: 'admin' }`.
  - `warn` on validation failures plus offending block ids.
  - `error` on persistence failures.
  - `debug` (gated by env) indicating storage backend in use (`store: 'kv' | 'memory'`), aiding rollout monitoring.
- Admin UI:
  - Send structured `console.debug` events (`admin-default-plan`, `{ action: 'save', status }`) to aid QA.
  - Surface toast metrics to future analytics by funneling into `window.plausible` when present (no-op otherwise).


# 6. UX Flow (Happy Path)

1. Admin visits `/blocks`.
2. UI loads default plan via API and renders three list items in current order.
3. User drags an item to a new position.
4. User clicks `Save`.
5. Admin UI posts updated plan to API, receives canonicalized response, and refreshes local state.
6. User navigates to the demo host; the embed fetches the same plan from API and renders blocks in the saved order.

# 7. Testing Strategy

- **API**: Vitest coverage for `GET /v1/plan/default`, `PUT /v1/plan/default`, pointer fallback (KV + memory), validation failures, and optimistic concurrency (expect 412 on stale hash).
- **Admin UI**: React Testing Library verifies drag reorder output, disabled `Save` logic, optimistic rollback on 412, and accessibility props (`aria-describedby`, keyboard reorder).
- **Demo Host**: integration test stubs `fetch` to assert loading/error transitions and that `bootstrapEmbed` receives the fetched plan.
- **Manual QA**: smoke test across local dev and staged Vercel preview, including disabling KV to confirm memory fallback, and confirm demo host reflects reordered plan after refresh.

# 8. Rollout & Migration

- Add `NEXT_PUBLIC_API_BASE` to the admin `.env.example` pointing at the local API (`http://localhost:3001`).
- Wire the API app to expose `GET/PUT /v1/plan/default`; update `docs/engineering/embed-dev.md` with fetch instructions and troubleshooting tips.
- Provide `pnpm --filter @events-hub/api seed:default-plan -- --tenant <tenantId>` to pre-populate KV before enabling the admin UI in shared environments.
- Roll out behind `NEXT_PUBLIC_PLAN_MODE=beta` and flip to `prod` once the seed script runs and QA signs off.

# 9. Risks & Mitigations

- **Pointer drift**: concurrent updates could overwrite state; the 412 guard and client refetch mitigate silent stomps.
- **KV outages**: memory fallback keeps the API available; we log a warning and surface a banner in admin when fallback is active.
- **Drag accessibility gaps**: `KeyboardSensor` plus explicit instructions cover MVP needs; document outstanding gaps for future sprints.
- **Demo host flash of old data**: embed resets only when plan hash changes to avoid flicker.

# 10. Resolved Questions

- **Endpoint placement**: implement a dedicated `/v1/plan/default` handler; `/v1/compose` remains focused on AI-generated plans.
- **Auth requirements**: rely on environment isolation for MVP (admin only deploys to internal previews); capture production-grade RBAC as follow-up.
- **UI fidelity**: each list item shows title + kind/id metadata; richer previews remain out of scope until we have real content.
