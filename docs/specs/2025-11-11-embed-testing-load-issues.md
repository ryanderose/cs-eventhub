# 2025-11-11 — Embed Testing Load Issues

## Scope
- Admin default-blocks editor (`http://localhost:3001/blocks`)
- Demo host root + manual harness routes (`http://localhost:3000`, `/manual`, `/manual/routing`, `/events`, `/manual/lazy`, `/manual/legacy`, `/manual/trusted-types`, `/manual/multi`)

Playwright MCP was used to capture screenshots and console output while the local stack (`pnpm dev:stack`) was already running.

## Observed Behaviour

| Area | What we saw | Console output |
| --- | --- | --- |
| Admin blocks editor | Reordering + saving works, but browser logs `http://localhost:3001/favicon.ico 404`. No telemetry/errors tied to saves. | `Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3001/favicon.ico` |
| Default embed (`/`) | Landing embed immediately reflects admin ordering (after moving *Filter bar* above *Map grid* the page rendered that order). SEO inspector panel never leaves “error” state. | `Failed to load resource: 404 @ http://localhost:3000/fragment/demo?view=list`, same for `view=detail`, repeated consent warnings |
| Manual suite entry (`/manual`) | Navigation hub renders, but every linked harness shares the stale block order (hero second, map fourth, promo fifth) regardless of admin changes. | Same `fragment` 404s + consent warnings |
| Query/hash routing (`/manual/routing`) | `historyMode="query"` and `"hash"` embeds never adopt admin ordering. Screenshots show hero immediately below filter bar while default embed shows map there. | Same 404s + consent warnings |
| Path routing (`/events`), Lazy mount, Legacy mount, Multi-embed | All reuse the stale block order. Lazy + legacy harnesses log the same 404 + consent warnings; lazy adds an info log about deferred hydration. | `CONSENT_PENDING — Event buffered until consent is granted {bytes: ...}` repeated on every page |
| Trusted Types (`/manual/trusted-types`) | Harness intentionally aborts hydration and shows the inline error UI. Errors remain in the console even after navigating away because DevTools keeps the history. | `[hub-embed]:sdk TRUSTED_TYPES_ABORT — Trusted Types policy creation failed` (expected for this test) |

## Root Causes & Required Fixes

### 1. Manual harnesses ignore the stored default plan
- `apps/demo-host/app/page.tsx:30-138` hydrates the landing embed with `useDefaultPlan`, which fetches `/api/default-plan` (or `/v1/plan/default`) and re-hydrates the existing embed whenever `planHash` changes.
- Every manual route renders `<ManualEmbed>` without a `plan` prop (`apps/demo-host/app/manual/**/*.tsx`), and `ManualEmbed` always falls back to `createDefaultDemoPlan` (`apps/demo-host/app/manual/components/ManualEmbed.tsx:20-78`). The helper is seeded data from `@events-hub/default-plan`, so none of those instances ever read the admin-controlled ordering.
- `LegacyMountExample` does the same (`apps/demo-host/app/manual/components/LegacyMountExample.tsx:12-52`), so even the legacy harness is detached from real plans.

**Fix**
1. Lift the `useDefaultPlan` hook (or a lightweight fetcher) into a shared context/provider that can be reused by manual pages.
2. Pass the returned `plan`, `planHash`, and status down to every `<ManualEmbed>`/`LegacyMountExample` instance so they hydrate with the exact stored document.
3. Ensure each harness re-hydrates when `planHash` changes just like the landing page does (call `handle.hydrateNext({ plan })` or destroy + recreate).

Without this, the manual suite can never validate block-order-sensitive behaviours.

### 2. SEO parity inspector cannot fetch fragments
- The inspector issues `/fragment/<tenant>?view=…` requests (`apps/demo-host/app/components/SeoInspector.tsx:74-101`), which hit the route group proxy (`apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:36-63`). The proxy forwards to `${API_BASE}/v1/fragment/${tenant}`.
- The Express API, however, only registers `/api/v1/fragment` and `/v1/fragment` *without* the tenant suffix (`apps/api/src/app.ts:82-105`). Requests to `/v1/fragment/demo` therefore 404 before reaching the proxy.

**Fix**
1. Update `apps/api/src/app.ts` to also register `/api/v1/fragment/:tenant` and `/v1/fragment/:tenant` (passing the slugged tenant through to `proxyFragment`), or
2. Change the proxy to call `${apiBase}/v1/fragment?tenantId=${tenant}` instead of embedding the tenant into the path.

Until one of those happens, both SEO inspector cards will stay in the error state and every page load will spam the browser console with 404s.

### 3. Consent pipeline never resolves
- All embeds (landing + manual) emit `[hub-embed]:consent CONSENT_PENDING — Event buffered until consent is granted`. Neither `apps/demo-host/app/page.tsx` nor the manual components invoke `consent.grant(...)` from `@events-hub/embed-sdk`, and a repo-wide search shows no consent integration under `apps/demo-host`.
- Because the consent state never transitions, analytics and telemetry events remain buffered and the console warning repeats whenever blocks hydrate.

**Fix**
1. Plumb a minimal consent provider into the demo host (call `consent.grant('host')` once the page loads, or implement the CMP shim described in the product spec).
2. Expose controls in the harness so testers can toggle consent and observe the telemetry behaviour intentionally.

### 4. Trusted Types harness produces hard errors (expected but noisy)
- `/manual/trusted-types` sets `simulateTrustedTypesFailure` on `<ManualEmbed>` (`apps/demo-host/app/manual/trusted-types/page.tsx`) which forces `ManualEmbed` to override `window.trustedTypes` and throw when policy creation is attempted (`apps/demo-host/app/manual/components/ManualEmbed.tsx:32-55`).
- This is the desired behaviour for that scenario, but note that DevTools keeps the error entries when navigating to subsequent harnesses, so testers can misattribute them.

**Action**
- Add a note to the manual test doc / UI explaining that the console errors are intentional and scoped to the Trusted Types page, or automatically clear the console/log a recovery message when navigating away to avoid confusion.

### 5. Missing favicons in admin + demo host
- Both apps request `/favicon.ico` but neither `apps/admin/app` nor `apps/demo-host/app` ships one, so the browser logs 404s on every load.

**Fix**
- Add the favicons (or update `metadata.icons`) so Next can serve them. This removes the last remaining console errors on the admin page.

## Recommended Work Plan
1. **Plan plumbing**
   - Create a shared `useDemoPlan` hook (wraps `useDefaultPlan`) and expose it through context.
   - Update every manual route to consume that plan and hand it to `<ManualEmbed>`/`LegacyMountExample`, ensuring they re-hydrate on `planHash` changes.
   - Backfill tests that assert block order parity between `/` and each harness.
2. **Fragment proxy parity**
   - Align Express and Next fragment routes by adding the missing `/:tenant` handlers or by switching everything to a query-string tenant id.
   - Once aligned, re-run the SEO inspector and verify the console is clean.
3. **Consent wiring**
   - Import `consent` from `@events-hub/embed-sdk` inside `apps/demo-host/app/page.tsx` and `ManualEmbed`.
   - Call `consent.grant('host')` after the CMP (or a simple mock) approves tracking to flush buffered events in local testing.
4. **DX/Docs polish**
   - Document the Trusted Types harness behaviour inside `/manual/trusted-types`.
   - Drop favicons into both apps to suppress the persistent 404 noise.

Once those are addressed the landing page, all manual harnesses, and the supporting SEO widgets should behave consistently with the admin plan ordering and provide clean consoles for the rest of the manual test suite.

## Reproduction Notes
1. Visit `http://localhost:3001/blocks`, move “Map grid” below “Filter bar”, click **Save** — console only shows the favicon 404.
2. Visit `http://localhost:3000` — embed order updates immediately, but SEO inspector cards log fragment 404s.
3. Visit `http://localhost:3000/manual/routing` (and the other harness routes) — embeds keep the old order and console output matches the default page (`fragment` 404s + consent warnings).
4. Visit `http://localhost:3000/manual/trusted-types` — the harness surfaces Trusted Types errors by design; note that the console retains those entries until cleared manually.

