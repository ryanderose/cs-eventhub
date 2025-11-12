---
title: "Embed Testing Load Issues Spec Walkthrough"
date: "2025-11-11 09:03 -0500"
researcher: "ChatGPT Codex 5"
question: "docs/specs/2025-11-11-embed-testing-load-issues.md"
scope: "Spec plus demo-host/admin components it references (default plan hydration, manual harnesses, SEO proxy, Express fragment API)"
assumptions: ["Local stack matches pnpm dev:stack described in the spec", "Observations correspond to commit 99c76d4 on feature/embed-production-ready"]
repository: "/Users/ryanderose/code/cs-eventhub"
branch: "feature/embed-production-ready"
commit_sha: "99c76d4"
status: "complete"
last_updated: "2025-11-11"
last_updated_by: "ChatGPT Codex 5"
directories_examined: ["docs/specs/", "apps/demo-host/app/", "apps/demo-host/lib/", "apps/api/src/", "packages/default-plan/"]
tags: ["research", "codebase", "embed-sdk", "demo-host"]
---

# Research: Embed Testing Load Issues Spec Walkthrough

**Planning Hand-off (TL;DR)**  
- Landing embed (`/`) streams the stored default plan via `useDefaultPlan`, logs plan metadata, and rehydrates on each `planHash` change, so admin ordering takes effect there immediately (`apps/demo-host/app/page.tsx:25-229`).  
- Manual harness pages instantiate `<ManualEmbed>`/`<LegacyMountExample>` without a `plan` prop, so each one recreates the seeded `createDefaultDemoPlan` ordering regardless of admin edits, which matches the stale ordering described in the spec (`apps/demo-host/app/manual/components/ManualEmbed.tsx:20-107`; `apps/demo-host/app/manual/routing/page.tsx:18-28`).  
- SEO inspector fetches `/fragment/{tenant}` and the proxy appends the tenant to `${API_BASE}/v1/fragment/${tenant}`, but the Express API only exposes `/v1/fragment` (no `/:tenant`), so every inspector card reports 404 errors and the spec’s console captures align with this routing gap (`apps/demo-host/app/components/SeoInspector.tsx:74-158`; `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:36-96`; `apps/api/src/app.ts:82-105`).

## Research Question (from spec)
Document how `docs/specs/2025-11-11-embed-testing-load-issues.md` maps onto the current demo-host/admin implementation, focusing on block ordering parity, fragment fetching, consent buffering, and manual harness behavior.

## System Overview (what exists today)
The demo host (Next.js App Router under `apps/demo-host/app`) boots the embed SDK inside `/` via `useDefaultPlan`, fetching `/api/default-plan` which proxies to the Express API’s `/v1/plan/default`. Manual routes under `/manual` and `/events` mount embeds explicitly through `<ManualEmbed>` or `<LegacyMountExample>`, each defaulting to the seeded plan from `@events-hub/default-plan`. The SEO Inspector component hits a local `/fragment/{tenant}` route that proxies to `${API_BASE}/v1/fragment/${tenant}`, while the Express API currently exposes `/v1/fragment` without a tenant path parameter. Consent helpers from the SDK are not invoked anywhere in `apps/demo-host`, so telemetry stays buffered as described by the spec.

## Evidence Log
- `docs/specs/2025-11-11-embed-testing-load-issues.md:3-86` — Scope, observed behavior, root-cause notes, and reproduction steps captured during Playwright MCP runs.
- `apps/demo-host/app/page.tsx:25-229` — Default embed entry point, `useDefaultPlan` integration, rehydration logic, and SEO inspector mount.
- `apps/demo-host/lib/useDefaultPlan.ts:1-200` — Hook behavior for API/fallback/default plan resolution, retries, and status tracking.
- `apps/demo-host/app/manual/components/ManualEmbed.tsx:20-107` — Manual harness embed wrapper that recreates the seeded plan when `plan` is absent.
- `apps/demo-host/app/manual/components/LegacyMountExample.tsx:12-69` — Legacy script-based mount using `createDefaultDemoPlan`.
- `apps/demo-host/app/components/SeoInspector.tsx:74-210` & `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:36-96` — Fragment fetch flow via `/fragment/{tenant}`.
- `apps/api/src/app.ts:82-105` — Express API routes showing `/v1/fragment` without a tenant slug.
- `apps/demo-host/app/api/default-plan/route.ts:7-132` & `apps/demo-host/lib/env.ts:3-149` — How the host derives API/config endpoints for plan fetching.
- `packages/default-plan/src/index.ts:1-95` — Seeded block templates defining default order used by the manual harness.

## Detailed Findings

### Docs & Decisions
- The spec logs each harness’ behavior (admin editor success, landing embed parity, manual suite staleness, SEO inspector 404s, consent warnings, and Trusted Types aborts) plus missing favicons, providing console evidence for each (`docs/specs/2025-11-11-embed-testing-load-issues.md:11-86`).
- Root-cause sections tie those symptoms to specific files—`app/page.tsx` fetching stored plans, manual routes skipping those plans, and fragment routes lacking tenant parity—mirroring the code references gathered here (`docs/specs/2025-11-11-embed-testing-load-issues.md:22-78`).

### Domain & Data
- Default plans are `PageDoc` structures built from the seeded templates in `@events-hub/default-plan`, which hard-code the block ordering (filter bar → hero → rail → map → promo → detail → mini chat) and analytics metadata (`packages/default-plan/src/index.ts:1-95`).
- `useDefaultPlan` normalizes API responses to ensure `plan.meta.planHash` is populated and classifies origins as `seeded` vs `stored`, which is how the landing page differentiates fallback vs persisted plans (`apps/demo-host/lib/useDefaultPlan.ts:68-200`).

### Entry Points & Routing
- `/` mounts a container div and bootstraps the embed once per page load, then rehydrates when API-sourced `planHash` values change (hydration path in `apps/demo-host/app/page.tsx:81-138`).
- Manual harness routes (`/manual/routing`, `/manual/lazy`, `/manual/legacy`, `/manual/trusted-types`, `/manual/multi`) and the `/events` catch-all all render `<ManualEmbed>` (or `<LegacyMountExample>`) with route-specific configs but without a `plan` prop, so they never consult the stored default plan (`apps/demo-host/app/manual/routing/page.tsx:18-28`; `apps/demo-host/app/manual/lazy/page.tsx:7-20`; `apps/demo-host/app/manual/legacy/page.tsx:7-18`; `apps/demo-host/app/manual/multi/page.tsx:7-26`; `apps/demo-host/app/events/[[...slug]]/page.tsx:10-29`).
- SEO parity inspection operates via client-side fetches to `/fragment/{tenant}?view=list|detail`, hooking into the App Router route under `(seo)/fragment/[tenant]` (`apps/demo-host/app/components/SeoInspector.tsx:74-210`; `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:36-96`).

### Core Logic
- `useDefaultPlan` builds either an absolute `planEndpoint` or `${apiBase}/v1/plan/default?tenantId=…`, retries 412 conflicts, and flips between `loading`, `ready`, `fallback`, or `disabled` states while retaining the fallback plan as an immediate default (`apps/demo-host/lib/useDefaultPlan.ts:25-200`).
- The landing page caches the first API plan in `initialPlanRef` and calls `handle.hydrateNext({ plan })` only when a new `planHash` arrives, ensuring admin edits propagate automatically (`apps/demo-host/app/page.tsx:81-138`).
- `ManualEmbed` memoizes `planDoc = plan ?? createDefaultDemoPlan({ tenantId })`, so in the absence of a prop it always recreates the seeded ordering before calling `embedModule.create({ initialPlan: planDoc, …config })` (`apps/demo-host/app/manual/components/ManualEmbed.tsx:20-79`).
- `LegacyMountExample` mirrors that behavior for the legacy script-mount scenario, again using `createDefaultDemoPlan` for its `initialPlan` (`apps/demo-host/app/manual/components/LegacyMountExample.tsx:12-35`).
- The Trusted Types harness toggles `simulateTrustedTypesFailure`, which overrides `window.trustedTypes` to throw on policy creation and leaves console errors until the effect cleanup restores the descriptor (`apps/demo-host/app/manual/components/ManualEmbed.tsx:32-56`; `apps/demo-host/app/manual/trusted-types/page.tsx:7-16`).

### Integrations
- `/api/default-plan` (Next route) proxies GET/PUT requests to `/v1/plan/default` on whichever API base is derived from env vars or hostnames, adding Vercel bypass headers when present (`apps/demo-host/app/api/default-plan/route.ts:7-132`).
- `getApiBase`/`getConfigUrl` compute remote hosts by swapping `demo-host` prefixes for `api`/`config`, which is how both `/` and `/fragment` know where to send upstream requests (`apps/demo-host/lib/env.ts:3-145`).
- SEO inspector’s `/fragment/{tenant}` proxy forwards to `${normalizeApiBase(apiBase)}/v1/fragment/${tenant}` with the requested `view`/`slug`, hashing CSS for parity reporting (`apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:36-96`).
- The Express API only registers `/api/v1/fragment` and `/v1/fragment` without a tenant segment, so `/v1/fragment/demo` coming from the proxy is guaranteed to 404 (`apps/api/src/app.ts:82-105`).

### Configuration & Secrets
- The landing page chooses between linked/external embed modes, embed source URLs, config URLs, and API bases via the helpers in `apps/demo-host/lib/env.ts`, while the plan endpoint defaults to `/api/default-plan` but can be overridden through `NEXT_PUBLIC_DEFAULT_PLAN_ENDPOINT` (`apps/demo-host/app/page.tsx:30-46`; `apps/demo-host/lib/env.ts:97-145`).
- `/api/default-plan` resolves the API base via `DEMO_API_BASE`, `ADMIN_API_BASE`, `API_BASE`, or derived hostnames, and forwards optional Vercel protection bypass headers—the same values the spec used while running against `pnpm dev:stack` (`apps/demo-host/app/api/default-plan/route.ts:7-91`).

### Tests & Observability
- The landing page logs each plan load via `console.info('[demoHost.defaultPlan]', …)` and mirrors status/metadata in `data-plan-*` attributes for debugging (`apps/demo-host/app/page.tsx:63-195`).
- Manual embeddings expose per-harness status strings (`Mounting embed…`, `Embed ready`, `Failed to mount embed`) but, per the spec, there is no consent integration to flush buffered telemetry events, hence the persistent `[hub-embed]:consent CONSENT_PENDING` output across routes (`apps/demo-host/app/manual/components/ManualEmbed.tsx:58-106`; `docs/specs/2025-11-11-embed-testing-load-issues.md:17-18,44-50`).
- Trusted Types harness deliberately surfaces `[hub-embed]:sdk TRUSTED_TYPES_ABORT` errors by forcing policy creation to fail until cleanup runs (`docs/specs/2025-11-11-embed-testing-load-issues.md:17-18`; `apps/demo-host/app/manual/components/ManualEmbed.tsx:32-56`).

### API/UI Surface
- Admin default-blocks editor (`http://localhost:3001/blocks`) is called out in the spec as functioning for reorder/save but logging a missing favicon, while the landing embed’s UI reports plan mode/source/origin and hosts the SEO inspector alongside the embed container (`docs/specs/2025-11-11-embed-testing-load-issues.md:11-18`; `apps/demo-host/app/page.tsx:175-229`).
- Manual harness UIs describe the scenario being exercised (routing, lazy mount, legacy mount, Trusted Types, multi-embed) and embed `<ManualEmbed>` components inline without additional plan wiring (`apps/demo-host/app/manual/routing/page.tsx:11-28`; `apps/demo-host/app/manual/lazy/page.tsx:7-20`; `apps/demo-host/app/manual/legacy/page.tsx:7-18`; `apps/demo-host/app/manual/multi/page.tsx:7-26`; `apps/demo-host/app/manual/trusted-types/page.tsx:7-16`; `apps/demo-host/app/events/[[...slug]]/page.tsx:10-29`).
- SEO inspector renders parity metrics and JSON-LD copy controls per view, reflecting the fetch state and surfacing errors when `/fragment/{tenant}` 404s (`apps/demo-host/app/components/SeoInspector.tsx:74-210`).

## Code References (Index)
- `docs/specs/2025-11-11-embed-testing-load-issues.md:3-86` — Spec describing scope, observations, and root-cause analysis for embed testing.
- `apps/demo-host/app/page.tsx:25-229` — Default embed bootstrap, plan rehydration, status reporting, SEO inspector mount.
- `apps/demo-host/lib/useDefaultPlan.ts:25-200` — Default plan fetching logic, retries, origin metadata.
- `apps/demo-host/app/manual/components/ManualEmbed.tsx:20-107` — Manual embed wrapper using seeded plans and optional Trusted Types failure simulation.
- `apps/demo-host/app/manual/components/LegacyMountExample.tsx:12-69` — Legacy script mount that also uses the seeded plan.
- `apps/demo-host/app/manual/routing/page.tsx:18-28`, `apps/demo-host/app/manual/lazy/page.tsx:7-20`, `apps/demo-host/app/manual/multi/page.tsx:7-26`, `apps/demo-host/app/manual/legacy/page.tsx:7-18`, `apps/demo-host/app/manual/trusted-types/page.tsx:7-16`, `apps/demo-host/app/events/[[...slug]]/page.tsx:10-29` — Harness surfaces using `<ManualEmbed>` with route-specific configs but no stored plan.
- `apps/demo-host/app/components/SeoInspector.tsx:74-210` & `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:36-96` — Fragment fetch UI + proxy implementation adding `/v1/fragment/{tenant}`.
- `apps/api/src/app.ts:82-105` — Express route table limited to `/v1/fragment` without tenant slugs.
- `apps/demo-host/app/api/default-plan/route.ts:7-132` — Next API route proxying default-plan requests to the Express API.
- `apps/demo-host/lib/env.ts:3-149` — Helpers deriving API/config URLs and embed mode inputs.
- `packages/default-plan/src/index.ts:1-95` — Seeded block templates referenced by manual embeds.

## Architecture & Patterns (as implemented)
- **Plan sourcing:** `useDefaultPlan` abstracts fallback vs API-sourced plans and feeds both the landing embed and derived telemetry metadata. Manual harnesses bypass this abstraction and talk directly to the SDK, so their inputs stay static.
- **Proxy layering:** The demo host exposes lightweight Next routes (`/api/default-plan`, `/fragment/{tenant}`) that forward to the Express API, but the fragment proxy currently assumes a tenant slug path that the Express layer does not serve.
- **Embed wrappers:** The default page, manual harness, and legacy mount all wrap the same embed SDK but with different bootstrapping styles (container + handle vs direct `embedModule.create`). Trusted Types simulation is implemented as a client-side hook overriding globals during the mount effect.

## Related Documentation
- `docs/specs/2025-11-11-embed-testing-load-issues.md:3-86` — Primary reference for observed failures during embed testing load checks.

## Open Questions
- How and where should consent be granted inside the demo host to unblock buffered telemetry (`docs/specs/2025-11-11-embed-testing-load-issues.md:44-50`)? Clarifying the intended CMP shim would confirm whether the host should auto-grant consent or expose UI controls.
- Should fragment requests include the tenant in the path or as a query parameter? The proxy and Express API currently disagree, so determining the canonical contract would guide the necessary routing updates (`apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:36-96`; `apps/api/src/app.ts:82-105`).

## Follow-up
- [2025-11-11 09:03] Initial research pass recorded; no further updates yet.
