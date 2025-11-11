# Embed Testing Load Issues — Implementation Plan

## Overview
- Align the demo host, manual harnesses, and SEO tooling with the stored default plan so QA can rely on live data ordering without console noise.
- Fix fragment routing, consent buffering, and harness messaging so spec §22 GA gates (telemetry, SEO parity) can be exercised during load tests.
- Ticket/spec: `docs/specs/2025-11-11-embed-testing-load-issues.md`.

## Current State (from Research)
- Landing embed (`apps/demo-host/app/page.tsx:25`) hydrates via `useDefaultPlan`, reorders on `planHash`, and exposes plan metadata/SEO inspector panels.
- Manual harnesses (e.g., `apps/demo-host/app/manual/routing/page.tsx:11-28`) render `<ManualEmbed>`/`LegacyMountExample` without a `plan` prop, so each uses `createDefaultDemoPlan` (`apps/demo-host/app/manual/components/ManualEmbed.tsx:20-107`; `LegacyMountExample.tsx:12-69`) and never observes admin edits.
- SEO inspector fetches `/fragment/{tenant}` (`apps/demo-host/app/components/SeoInspector.tsx:74-210`), but the Express API only exposes `/v1/fragment` without a tenant segment (`apps/api/src/app.ts:82-105`), producing 404s.
- Consent helpers from `@events-hub/embed-sdk` are never invoked across the demo host, so telemetry stays buffered and consoles repeat `[hub-embed]:consent CONSENT_PENDING` (spec lines 44-50).

## Desired End State
- Every embed surface (default page, manual harness permutations, legacy mount, multi-embed) reads the persisted default plan and rehydrates whenever `planHash` changes.
- SEO inspector proxy mirrors the Express API contract so fragment requests return 200s and parity cards leave error state.
- Demo host grants consent (with a tester-facing toggle) so telemetry drains and consent-related warnings vanish.
- Manual docs & UI clarify Trusted Types harness noise, and admin/demo host serve favicons to keep consoles clean.
- Acceptance: QA can reorder blocks in admin, refresh any manual route, and observe the same ordering with zero fragment/consent/favicons errors in DevTools.

## Non-Goals
- Reworking the embed SDK hydration algorithm or telemetry schema.
- Shipping a production CMP; demo host only needs a mock consent workflow.
- Changing actual default plan seeding logic in `packages/default-plan`.

## Architecture & Approach
- **Shared plan provider:** Build a `DemoPlanProvider` that wraps `useDefaultPlan` once and exposes `{plan, planHash, status}` via context/hooks, reused by `/manual`, `/events`, and legacy mounts to eliminate per-route fetch duplication.
- **Embed rehydration:** Update `ManualEmbed` and `LegacyMountExample` to accept `plan`+`planHash`, boot once, and call `handle.hydrateNext` when hashes change, matching `apps/demo-host/app/page.tsx` semantics.
- **Fragment routing:** Add `/api/v1/fragment/:tenant` + `/v1/fragment/:tenant` to Express so Next’s `/fragment/{tenant}` proxy can continue using REST-style paths without query rewrites; keep existing routes for backwards compatibility.
- **Consent shim:** Centralize `consent.grant('host')` + `consent.reset()` helpers with an opt-in toggle so testers can simulate pending/granted states without editing code.
- **DX polish:** Surface a Trusted Types callout in the manual UI/doc, and add favicons via Next’s `app/icon.png` pipeline to remove ambient 404s.
- **Alternatives considered:** letting each manual page fetch `/api/default-plan` independently would duplicate network/init work and complicate multi-embed pages; a shared provider ensures caching, consistent status UI, and single telemetry source, so we prefer it.

## Phases

### Phase 1 — Shared Default Plan Plumbing
**Goal:** Manual harnesses, `/events`, and legacy mounts hydrate the stored plan + rehydrate on `planHash` updates.

**Changes**
- Code: `apps/demo-host/lib/useDemoPlan.ts` (new) — wrap `useDefaultPlan` + expose context/provider with plan/planHash/status/source metadata.
- Code: `apps/demo-host/app/manual/layout.tsx` & `apps/demo-host/app/events/layout.tsx` — wrap children with the provider, pumping tenant/config props down.
- Code: `apps/demo-host/app/manual/components/ManualEmbed.tsx` — accept required `plan`, optional `planHash`; bootstrap once and call `handle.hydrateNext({ plan })` when the hash changes instead of re-creating handles.
- Code: `apps/demo-host/app/manual/components/LegacyMountExample.tsx` — same plan-prop + rehydration path, maintaining legacy script semantics.
- Code: `apps/demo-host/app/manual/*/*.tsx`, `apps/demo-host/app/events/[[...slug]]/page.tsx` — consume the plan context, pass `plan`, `planHash`, `tenantId` (and fallback state for skeletons) into embeds/multi-embeds.
- Tests: `apps/demo-host/app/manual/__tests__/plan-context.test.tsx` — ensure provider fetches once, exposes stored plan ordering, and rehydrates children when planHash changes.

**Notes**
- Guard for `planStatus === 'fallback'` to keep seeded data available when API is down (match default page messaging).
- Ensure provider supports Suspense/streaming by exposing loading/error boundaries for manual routes.

**Success Criteria**  
**Automated**
- [x] Build/typecheck: `pnpm -w build`
- [x] Unit tests (incl. new provider tests): `pnpm -w test --filter @events-hub/demo-host...`
- [x] Lint: `pnpm -w lint`
- [x] Bundle size guard (manual components live in embed demo bundle): `pnpm -w check:bundles`
**Manual**
- [ ] Reorder blocks in admin, visit `/manual`, `/manual/routing`, `/manual/multi`, `/events` — order matches default embed.
- [ ] Simulate plan update (save again) and confirm manual embeds update without full reload, no stale hero positions.
- [ ] Console on those routes shows no stale `createDefaultDemoPlan` log spam.

### Phase 2 — Fragment Proxy & SEO Inspector Recovery
**Goal:** SEO inspector fetches fragments successfully; no 404 noise.

**Changes**
- Code: `apps/api/src/app.ts` — register GET handlers for `/api/v1/fragment/:tenant` + `/v1/fragment/:tenant` that reuse `proxyFragment`.
- Code: `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts` — optionally normalize tenant IDs, add fallback query param for backwards compat, and tighten error messages surfaced to the inspector.
- Tests: add API route coverage in `apps/api/src/__tests__/fragment-route.test.ts` to assert both base + tenant paths succeed and forward headers.
- Tests: extend `apps/demo-host/app/components/__tests__/SeoInspector.test.tsx` (or add new) to mock the proxy and assert success UI when 200s return.

**Notes**
- Keep existing `/fragment` query-based access working for partners already pointing there.
- Document the canonical REST path in `docs/engineering/embed-dev.md` to prevent drift.

**Success Criteria**
**Automated**
- [x] API/unit tests updated: `pnpm -w test --filter @events-hub/api...`
- [x] Demo-host component tests: `pnpm -w test --filter @events-hub/demo-host...`
- [ ] Lint/build unaffected: `pnpm -w lint`, `pnpm -w build`
**Manual**
- [x] Load `/` with DevTools open — both SEO inspector cards leave error state after fetch completes.
- [x] No `/fragment/...` 404 entries remain in the network panel.

> **Phase 2 → Phase 3 Handoff**
> - Verified via Playwright (localhost:3000/3001) that SEO inspector cards now hydrate cleanly (0% diff, no errors) and there are no `/fragment/...` 404s. Screenshots + console logs captured in `playwright-mcp-output/1762872681774/` for reference.
> - Consent remains pending (expected until Phase 3) so SDK still logs `CONSENT_PENDING` warnings; telemetry buffers until the toggle is implemented.
> - Admin + demo host still lack favicons; both browsers log `/favicon.ico 404`—remains in Phase 4 scope.
> - Default plan currently reports hash `Z96cZqfXMis0xLJkri-KYKSslYTSwLLmfynKXRg8yXk`; manual harnesses already rehydrate via the new provider, so Phase 3 changes should use the shared context when wiring consent controls.

### Phase 3 — Consent Pipeline Integration
**Goal:** Demo host surfaces a consent toggle and grants consent by default so telemetry buffers flush.

**Changes**
- Code: `apps/demo-host/lib/consent.ts` — wrap `import { consent } from '@events-hub/embed-sdk'` with helpers to grant/reset from React effects.
- Code: `apps/demo-host/app/page.tsx` — add a Consent section that defaults to `granted`, calls `grant('host')` on mount, and logs state transitions for QA.
- Code: `apps/demo-host/app/manual/components/ManualEmbed.tsx` & `LegacyMountExample.tsx` — ensure embeds subscribe to consent events (if SDK exposes) or simply rely on global helper; surface status text when consent pending.
- Code: `apps/demo-host/app/manual/components/ManualHarnessControls.tsx` (new) — shared toggle for manual routes to flip consent on/off via context. Use React state + effect to call `grant`/`reset`.
- Docs: `docs/engineering/embed-dev.md` — describe the consent toggle workflow so QA knows how to test buffered telemetry.
- Tests: unit test helper to assert `grant('host')` invoked exactly once per mount and toggling resets state (mock the SDK).

**Notes**
- Keep the toggle client-side only; no need to persist across reloads.
- Ensure calling `consent.grant` before embed boot does not throw (gate behind `typeof window !== 'undefined'`).

**Success Criteria**
**Automated**
- [x] Consent helper tests: `pnpm -w test --filter @events-hub/demo-host...`
- [x] Lint/build still green: `pnpm -w lint`, `pnpm -w build`
**Manual**
- [ ] Load `/` and `/manual` with console open — consent warnings disappear once toggle set to granted.
- [ ] Flip toggle back to pending — embeds should log pending once, analytics pause, then resume when re-granted.

> **Phase 3 → Phase 4 Handoff**
> - Consent plumbing is live across `/` plus every manual harness layout (`ManualHarnessControls`), auto-granting on mount and logging transitions under `[demoHost.consent]`. Playwright MCP verified `/` and `/manual` after the rebuild; toggling pending now emits a single `[hub-embed]:consent Consent revoked` warning per change, and flipping back drains telemetry immediately.
> - Manual routes originally failed to hydrate due to `_next/static` 404s, but restarting `pnpm --filter @events-hub/demo-host dev` resolved those asset errors—Phase 4 shouldn’t need additional Next fixes unless the dev server restarts without rebuilding.
> - Outstanding console noise ahead of Phase 4: `/favicon.ico` still 404s on both admin + demo host (expected Phase 4 scope), and `/events` briefly logged a 500 during early consent toggling while manual routes were still recompiling; that issue disappeared after the rebuild.
> - Trusted Types harness remains intentionally noisy; once Phase 4 adds the callout and favicons, re-run `/manual/trusted-types` to confirm the new messaging coexists with the consent banner.
> - Suggested next checks for Phase 4: ensure newly added favicons load in both apps (watch DevTools network tab), verify Trusted Types callout text renders, and keep an eye on consent logs when navigating between harnesses to confirm the controls stay mounted via the shared layout.

### Phase 4 — Harness Messaging & Favicons
**Goal:** Remove remaining console noise and clarify intentional Trusted Types errors.

**Changes**
- Code: `apps/demo-host/app/manual/trusted-types/page.tsx` — add inline callout (and optionally auto-clear console via `console.info`) explaining the scripted Trusted Types failure.
- Docs: `docs/engineering/embed-dev.md` (or `docs/manual-testing.md` if present) — add a section on interpreting Trusted Types harness logs and the consent toggle.
- Assets: add `apps/demo-host/app/icon.png` (and optionally `apple-icon.png`) plus `apps/admin/app/icon.png` via Next metadata so browsers stop requesting `/favicon.ico` fallback.
- Config: update `apps/demo-host/app/layout.tsx` and `apps/admin/app/layout.tsx` metadata to reference the new icons if needed.

**Notes**
- Use optimized SVG/PNG ≤ 4KB to avoid bloating bundles.

**Success Criteria**
**Automated**
- [x] Static assets picked up by Next build: `pnpm -w build`
- [x] Lint/style for doc updates: `pnpm -w lint`
**Manual**
- [ ] Reload admin blocks editor + demo host — DevTools no longer logs favicon 404s.
- [ ] Visit Trusted Types harness — page callout clarifies intentional failure; console clear message appears when navigating away (optional).

## Testing Strategy
- **Unit:** cover new plan context hook (fetch dedupe, rehydrate on planHash), consent helper toggles, SEO inspector success path, and Express fragment routing.
- **Integration:** extend demo-host React Testing Library suites to mount manual routes under the provider and assert plan order parity; add supertest coverage for `/api/v1/fragment/:tenant`.
- **E2E (optional/Playwright MCP):** once fixes land, re-run the manual harness tour to capture clean screenshots; document if MCP run is skipped.
- **Observability:** log consent transitions + planHash updates via `console.info` (already in default page) and ensure telemetry events emit `planHash` after consent granted.

## Performance & Security
- Shared provider avoids multiple `/api/default-plan` fetches, keeping plan hydrate latency within the spec’s ≤300 ms composer budget.
- Fragment path addition reuses existing handler, so CSP + sanitization stay intact; ensure new routes inherit existing middleware.
- Consent toggle must not persist PII; only call SDK helpers without storing user identifiers.
- Favicons served statically, no inline scripts added (maintain CSP from `docs/security/*`).

## Migration & Rollback
- Changes are mostly additive. If plan-provider rollout causes regressions, revert provider usage per route to fall back on seeded `createDefaultDemoPlan` (keep helper utility in git history).
- Fragment route additions can be toggled by removing the `/:tenant` registrations while leaving base path in place.
- Consent toggle can default to pending if issues occur, restoring prior behavior (buffered telemetry).

## Risks & Mitigations
- **Risk:** Manual embeds fail to rehydrate when planHash changes → add provider/unit tests + console asserts, and expose fallback skeleton when `planStatus === 'fallback'`.
- **Risk:** Fragment router mismatched tenant encoding → add contract tests hitting both path + query and document canonical path.
- **Risk:** Consent helper misfires on SSR → guard with `typeof window !== 'undefined'` and only import helper inside `useEffect`.
- **Risk:** Extra context/provider increases bundle size → tree-shake by colocating in `apps/demo-host/lib` and keep dependencies minimal.

## Timeline & Owners (tentative)
- Phase 1: 2 days — Demo Host owner
- Phase 2: 0.5 day — API owner
- Phase 3: 1 day — Demo Host owner
- Phase 4: 0.5 day — Demo Host/admin shared

## References
- Spec: `docs/specs/2025-11-11-embed-testing-load-issues.md`
- Research: `docs/research/2025-11-11-embed-testing-load-issues-research.md`
- Related code: `apps/demo-host/app/page.tsx`, `apps/demo-host/app/manual/components/ManualEmbed.tsx`, `apps/demo-host/app/components/SeoInspector.tsx`, `apps/api/src/app.ts`
