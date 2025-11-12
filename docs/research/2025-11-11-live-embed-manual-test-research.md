---
title: "Live Embed Manual Harness Research"
date: "2025-11-11 12:02 EST"
researcher: "ChatGPT Codex 5"
question: "Document how the repo currently supports the live embed manual test workflow defined in docs/specs/2025-11-11-live-embed-manual-test.md."
scope: "docs/specs/2025-11-11-live-embed-manual-test.md plus related admin snippet tooling, demo-host manual harness code, embed SDK/telemetry, and associated tests."
assumptions: [
  "Playwright MCP access was not enabled, so browser tests are described from source only.",
  "All descriptions reflect commit 9dfe33d without modifying repository state."
]
repository: "cs-eventhub"
branch: "feature/embed-production-ready"
commit_sha: "9dfe33d"
status: "complete"
last_updated: "2025-11-11"
last_updated_by: "ChatGPT Codex 5"
directories_examined: ["docs/specs", "docs/product", "docs/engineering", "apps/admin/app", "apps/admin/lib", "apps/demo-host/app", "apps/demo-host/lib", "apps/api/src", "packages/embed-sdk/src", "packages/telemetry/src", "playwright/projects/demo"]
tags: ["research", "codebase", "manual-harness", "embed-sdk"]
---

# Research: Live Embed Manual Harness Research

**Planning Hand-off (TL;DR)**  
- The 2025-11-11 spec adds a `/manual/live-embed` manual route that pastes real admin-generated snippets, parses module/nomodule/style tags, runs them inside the demo host, and records script/telemetry status without emitting new pipeline events (`docs/specs/2025-11-11-live-embed-manual-test.md:31-190`).  
- Admin tooling already emits the canonical `<div data-hub-embed>` container plus dual scripts pulled from CDN manifests, enforcing SRI/crossorigin rules and bundle budgets; the new harness is expected to consume that exact output (`apps/admin/app/snippets/SnippetGenerator.tsx:46-259`, `docs/product/admin-snippet.md:1-37`).  
- Current manual harness pages share a plan/consent-aware layout but directly instantiate `<ManualEmbed>` rather than running snippets, which is the QA gap called out in the load-issues spec (`apps/demo-host/app/manual/components/ManualEmbed.tsx:1-150`, `apps/demo-host/app/manual/layout.tsx:1-15`, `docs/specs/2025-11-11-embed-testing-load-issues.md:22-33`).

## Research Question (from spec)
How the existing codebase, documentation, and tests underpin the live embed manual test harness described in `docs/specs/2025-11-11-live-embed-manual-test.md`, including the snippet workflow, manual harness infrastructure, embed SDK instrumentation, and QA coverage expectations (`docs/specs/2025-11-11-live-embed-manual-test.md:13-223`).

## System Overview (what exists today)
- **Spec snapshot:** The draft spec requires a deterministic workflow: copy the snippet from admin, paste it into a new demo-host route, validate SRI/Trusted Types/consent, observe telemetry, and store rerunnable snippets with Playwright coverage. It forbids arbitrary markup, insists on Shadow DOM except SEO fragments, and limits observability to on-page logs for now (`docs/specs/2025-11-11-live-embed-manual-test.md:13-214`).  
- **Admin plane:** `/snippets` in the admin console reads CDN manifests, blocks invalid bundles, and exposes tenant/embed/basePath/history/lazy controls before copying the final snippet string (`apps/admin/app/snippets/SnippetGenerator.tsx:46-210`).  
- **Demo host + manual harness:** `/manual` routes share a layout that injects plan context and consent toggles, while each page renders `<PlanAwareManualEmbed>` or `<PlanAwareLegacyMount>` to exercise routing, lazy mount, legacy injection, Trusted Types, and multi-embed scenarios (`apps/demo-host/app/manual/layout.tsx:1-15`, `apps/demo-host/app/manual/page.tsx:1-60`, `apps/demo-host/app/manual/routing/page.tsx:1-30`, `apps/demo-host/app/manual/multi/page.tsx:1-28`).  
- **Embed runtime:** `<ManualEmbed>` loads `@events-hub/embed-sdk`, applies theme tokens, hydrates with the shared default plan, and surfaces consent-aware status text while `packages/embed-sdk` dispatches `hub-embed:event` CustomEvents for telemetry listeners (`apps/demo-host/app/manual/components/ManualEmbed.tsx:1-152`, `packages/embed-sdk/src/index.ts:160-475`).  
- **Supporting services:** The demo host proxies SEO fragment requests to the Express API, which exposes `/v1/fragment` and plan endpoints; telemetry payloads conform to `packages/telemetry`’s `SdkEvent` schema, and consent buffering is centralized in `packages/embed-sdk/src/consent.ts` plus the host’s `useConsentController` hook (`apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:71-134`, `apps/api/src/app.ts:25-111`, `packages/telemetry/src/index.ts:1-47`, `apps/demo-host/lib/consent.ts:48-117`).  
- **Risks/open items:** The spec already highlights auto-mount timing, single-container enforcement, Trusted Types policy handling, and keeping observability scoped until the telemetry plan expands (`docs/specs/2025-11-11-live-embed-manual-test.md:216-223`).

## Detailed Findings

### Docs & Decisions
- Live Embed Manual Test Harness spec defines goals, non-goals, happy path, UX, technical plan, testing, and risks for the new `/manual/live-embed` workflow (`docs/specs/2025-11-11-live-embed-manual-test.md:13-223`).  
- The prior load-issues investigation documents the gap: manual harnesses bypass stored plans and never execute the copied snippet, so QA cannot validate CMS-style workflows or Trusted Types/SRI behaviors (`docs/specs/2025-11-11-embed-testing-load-issues.md:1-87`).  
- `docs/product/admin-snippet.md` explains why snippets must originate from published manifests, enforce SRI/crossorigin, and refuse incomplete bundles, reinforcing the harness’s validation rules (`docs/product/admin-snippet.md:1-37`).  
- `docs/engineering/embed-dev.md` outlines existing manual harness routes, consent toggle expectations, SEO parity inspector, and plan reseeding workflow that the new route must integrate with (`docs/engineering/embed-dev.md:44-85`).

### Domain & Data
- Plan data flows through `useDefaultPlan`, which fetches `/v1/plan/default` (with retries, fallback states, seeded/stored origins) and exposes plan hash/status/error metadata used by both the home page and manual layout (`apps/demo-host/lib/useDefaultPlan.ts:1-253`).  
- `DemoPlanProvider` memoizes the fallback plan via `createDefaultDemoPlan`, resolves API/config endpoints from host/env, and shares `plan`, `planHash`, and status so manual pages can hydrate the same document (`apps/demo-host/lib/useDemoPlan.tsx:1-85`).  
- Admin snippet manifests capture bundle reports, SRI hashes, asset lists, and module/nomodule/style tags; these types underpin validation logic both in the generator and the planned harness parser (`apps/admin/lib/snippet-types.ts:1-56`).  
- `fetchSnippetList` hits `/api/snippet` with JSON headers and propagates default tenant/basePath/CDN origin settings so the UI and spec instructions can reference a consistent source of truth (`apps/admin/lib/plan-client.ts:1-196`).

### Entry Points & Routing
- `Navigation.tsx` renders top-level links for the default embed and manual harnesses, highlighting active routes; the spec mandates adding “Real-Time Embed Test” pointing at `/manual/live-embed` using this helper (`apps/demo-host/app/components/Navigation.tsx:1-52`, `docs/specs/2025-11-11-live-embed-manual-test.md:56-60`).  
- `/manual` index lists each harness with titles, summaries, and CTAs, so adding another card is straightforward (`apps/demo-host/app/manual/page.tsx:1-60`).  
- Layout wraps every manual page in `DemoPlanProvider`, `PlanStatusBanner`, and `ManualHarnessControls`, which the new route must reuse to keep consent and plan context consistent (`apps/demo-host/app/manual/layout.tsx:1-15`).  
- Existing harness pages (routing, lazy, legacy, Trusted Types, multi-embed, `/events` path routing) demonstrate how plan-aware components are mounted for different scenarios (`apps/demo-host/app/manual/routing/page.tsx:1-30`, `apps/demo-host/app/events/[[...slug]]/page.tsx:1-32`, `apps/demo-host/app/manual/lazy/page.tsx:1-21`, `apps/demo-host/app/manual/legacy/page.tsx:1-19`, `apps/demo-host/app/manual/trusted-types/page.tsx:1-27`, `apps/demo-host/app/manual/multi/page.tsx:1-28`).  
- The SEO Parity Inspector fetches `/fragment/<tenant>` via a Next.js route group that proxies to the API and computes CSS hashes/JSON-LD parity, so the live harness page can link to these diagnostics for SRI/CDN sanity checks (`apps/demo-host/app/components/SeoInspector.tsx:82-178`, `apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:71-134`, `apps/api/src/app.ts:25-111`).  
- The home page entry point already sets consent radios, plan data attributes, and the primary embed container, illustrating how runtime envs and telemetry statuses are surfaced to testers (`apps/demo-host/app/page.tsx:1-270`).

### Core Logic
- `SnippetGenerator` fetches manifest summaries, enforces readiness checks, renders bundle budget stats, and writes the final snippet (container + styles + module/nomodule scripts) to a read-only textarea for clipboard copying (`apps/admin/app/snippets/SnippetGenerator.tsx:46-259`).  
- `<ManualEmbed>` loads the embed module (linked or external), applies the shared theme, handles Trusted Types failure simulation, and rehydrates when `planHash` changes; statuses convey consent state and mount progress (`apps/demo-host/app/manual/components/ManualEmbed.tsx:1-152`).  
- `<LegacyMountExample>` mirrors manual embed bootstrapping but relies on `legacyMountBefore` to insert the container before a placeholder script, covering CMS script-only injections (`apps/demo-host/app/manual/components/LegacyMountExample.tsx:1-109`).  
- `PlanAwareManualEmbed` and `PlanAwareLegacyMount` consume `useDemoPlanContext` to pass the real plan/tenant/planHash down, ensuring parity with the stored plan (`apps/demo-host/app/manual/components/PlanAwareManualEmbed.tsx:1-13`, `apps/demo-host/app/manual/components/PlanAwareLegacyMount.tsx:1-13`).  
- `loadEmbedModule` handles linked imports or loads `NEXT_PUBLIC_EMBED_SRC` via script tags, caching the global `EventsHubEmbed` so multiple harnesses can reuse it (`apps/demo-host/lib/embed-loader.ts:1-101`).  
- `packages/embed-sdk` dispatches `hub-embed:event` CustomEvents whenever consented telemetry flushes, renders blocks inside a ShadowRoot, supports lazy hydration, and installs `window.HubEmbed` plus a backward-compatible alias; these are the instrumentation points the spec wants to wrap (`packages/embed-sdk/src/index.ts:160-520`).  
- Consent buffering lives in `packages/embed-sdk/src/consent.ts`, while the demo host’s `useConsentController` forwards UI toggles to `consent.grant/revoke` and logs `[demoHost.consent]` events, aligning with the spec’s insistence on respecting Trusted Types/consent budgets (`packages/embed-sdk/src/consent.ts:1-79`, `apps/demo-host/lib/consent.ts:24-117`).  
- The spec details helper hooks (`useSnippetParser`, `useSnippetRunner`, `usePersistentTextarea`), DOMParser-based validation, script injection order, and instrumentation (`window.__liveEmbedHarness`, MutationObserver, log entries) that need to run entirely client-side without touching pipeline telemetry yet (`docs/specs/2025-11-11-live-embed-manual-test.md:121-190`).

### Integrations
- Environment helpers derive API/config/CDN/admin origins based on hostnames, `.env` overrides, and linked vs external embed mode, ensuring the harness instructions can populate accurate URLs for testers (`apps/demo-host/lib/env.ts:1-151`, `docs/specs/2025-11-11-live-embed-manual-test.md:176-183`).  
- The SEO fragment proxy forwards headers (including `x-embed-config`) and respects cache controls while hashing CSS, so parity checks mirror production responses; Express exposes both `/v1/fragment` and `/v1/fragment/:tenant` for compatibility (`apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:71-134`, `apps/api/src/app.ts:25-111`).  
- Admin snippet generation reads `apps/cdn/public/hub-embed@*/manifest.json`, enforcing Phase A/B budgets before exposing script URLs with integrity hashes, which the live harness will need to validate against (`docs/product/admin-snippet.md:5-30`).  
- Telemetry events follow the `SdkEvent` union (block hydration, section changes, promo/chat events, sdk.deprecation) and wrap tenant/embed identifiers plus route metadata; the spec explicitly keeps the new harness logging local until the telemetry gap plan expands (`packages/telemetry/src/index.ts:1-47`, `docs/specs/2025-11-11-live-embed-manual-test.md:186-190`).

### Configuration & Secrets
- `NEXT_PUBLIC_EMBED_MODE`, `NEXT_PUBLIC_EMBED_SRC`, `NEXT_PUBLIC_CONFIG_URL`, `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_PLAN_MODE`, and `NEXT_PUBLIC_DEFAULT_PLAN_ENDPOINT` determine how embeds load, where config/plans are fetched, and whether fallback data is allowed; `getApiBase` even infers remote hosts from demo-host subdomains (`apps/demo-host/lib/env.ts:1-151`, `docs/engineering/embed-dev.md:15-42`).  
- The spec’s instructions block must reference `NEXT_PUBLIC_ADMIN_ORIGIN` (defaulting to `http://localhost:3001`) and warn when CDN origins don’t match the currently running server, reinforcing environment parity for QA (`docs/specs/2025-11-11-live-embed-manual-test.md:64-183`).  
- `ManualHarnessControls` calls `useConsentController({ source: 'manual-harness', defaultStatus: 'granted' })` so testers can flip consent states from the UI while `PlanStatusBanner` relays plan origin/status from `useDemoPlanContext` (`apps/demo-host/app/manual/components/ManualHarnessControls.tsx:1-47`, `apps/demo-host/app/components/PlanStatusBanner.tsx:1-35`).

### Tests & Observability
- Vitest coverage (`apps/demo-host/app/manual/__tests__/plan-context.test.tsx`) verifies that `DemoPlanProvider` shares stored plan ordering once and that `<ManualEmbed>` reuses an existing handle when `planHash` changes, matching the spec’s expectation that plan rehydration is deterministic across harnesses.  
- Playwright smoke tests (`playwright/projects/demo/manual-harness.spec.ts:1-64`) navigate each manual route, assert status messages, and exercise lazy/legacy/trusted/multi scenarios; the spec extends this by requesting a Playwright flow that copies/pastes a snippet and asserts hero blocks appear in the live harness (`docs/specs/2025-11-11-live-embed-manual-test.md:200-214`).  
- The home page and manual layouts expose ARIA `role="status"` elements, data attributes (`data-plan-*`, `data-consent-status`), and console logs (`[demoHost.defaultPlan]`, `[demoHost.consent]`) for observability without hitting pipeline telemetry, consistent with the spec’s local-log requirement (`apps/demo-host/app/page.tsx:70-270`, `apps/demo-host/lib/consent.ts:24-76`, `docs/specs/2025-11-11-live-embed-manual-test.md:186-190`).  
- Manual QA steps outlined in the spec (lazy flag toggles, SRI mismatch simulation, consent pending tests) build on existing harness behaviors like lazy observer deferral and Trusted Types abort warnings (`docs/specs/2025-11-11-live-embed-manual-test.md:200-214`, `apps/demo-host/app/manual/lazy/page.tsx:1-21`, `apps/demo-host/app/manual/trusted-types/page.tsx:1-27`).

### API/UI Surface (as applicable)
- Admin UI exposes manifest selectors, tenant/embed/basePath fields, lazy/history toggles, snippet textarea, copy button, bundle budget stats, and asset listings, all backed by `fetchSnippetList`; these controls match the spec’s requirement to remind testers to run `pnpm publish:embed` and to validate SRI/crossorigin before running snippets (`apps/admin/app/snippets/SnippetGenerator.tsx:46-259`, `docs/specs/2025-11-11-live-embed-manual-test.md:64-91`).  
- Manual harness pages provide textual guidance, status banners, and specific embed props (e.g., `historyMode`, `basePath`, `lazy`, `simulateTrustedTypesFailure`), giving the new live harness a consistent UX baseline for instructions, toggles, and error callouts (`apps/demo-host/app/manual/routing/page.tsx:11-28`, `apps/demo-host/app/manual/legacy/page.tsx:9-17`, `apps/demo-host/app/manual/trusted-types/page.tsx:11-24`).  
- The SEO inspector UI surfaces parity stats, errors, and copyable JSON-LD, aligning with the spec’s desire to show script load status, telemetry events, and warnings inline for quick debugging (`apps/demo-host/app/components/SeoInspector.tsx:82-178`, `docs/specs/2025-11-11-live-embed-manual-test.md:78-105`).

## Evidence Log
- `docs/specs/2025-11-11-live-embed-manual-test.md:13-223` — Full specification for the Real-Time Embed Test harness (background, requirements, plan, testing, risks).  
- `docs/specs/2025-11-11-embed-testing-load-issues.md:1-87` — QA findings explaining why current manual harnesses do not validate admin plans or snippets.  
- `apps/admin/app/snippets/SnippetGenerator.tsx:46-259` — Admin snippet generator logic, validation, and UI that produce the copy/paste snippet.  
- `apps/demo-host/app/manual/components/ManualEmbed.tsx:1-152` — Manual embed component that currently hydrates via shared plan context instead of pasted snippets.  
- `apps/demo-host/lib/useDefaultPlan.ts:1-253` — Default plan fetcher handling API calls, fallbacks, and plan hash propagation.  
- `packages/embed-sdk/src/index.ts:160-520` — Embed SDK runtime emitting `hub-embed:event`, installing `window.HubEmbed`, and supporting lazy/legacy mounts plus telemetry dispatch.

## Code References (Index)
- `docs/specs/2025-11-11-live-embed-manual-test.md:13-223` — Source spec for the live harness flow.  
- `apps/admin/app/snippets/SnippetGenerator.tsx:46-259` — UI + logic for generating snippets from CDN manifests.  
- `apps/demo-host/app/manual/layout.tsx:1-15` — Shared plan/consent layout used by all manual routes.  
- `apps/demo-host/app/manual/components/ManualEmbed.tsx:1-152` — Current embed-mounting logic within manual harness pages.  
- `packages/embed-sdk/src/index.ts:160-520` — Core client runtime, event emission, and lifecycle hooks that the live harness will instrument.

## Architecture & Patterns (as implemented)
- **Snippet generation → harness execution:** Admin gathers manifest metadata and enforces budgets before publishing a snippet, while the demo host currently bypasses that snippet by instantiating embeds directly; the spec bridges this gap by routing snippets through a parser/runner layered atop the existing manual layout and plan provider (`apps/admin/app/snippets/SnippetGenerator.tsx:46-259`, `apps/demo-host/app/manual/layout.tsx:1-15`, `docs/specs/2025-11-11-live-embed-manual-test.md:31-190`).  
- **Plan context + consent controls:** `DemoPlanProvider` + `ManualHarnessControls` supply real data and CMP simulation to every harness, ensuring telemetry buffers and plan hashes mirror production behavior before instrumentation hooks are added (`apps/demo-host/lib/useDemoPlan.tsx:1-85`, `apps/demo-host/app/manual/components/ManualHarnessControls.tsx:1-47`).  
- **Runtime orchestration:** `loadEmbedModule` abstracts linked/external loading, while the embed SDK handles Shadow DOM, router ownership, consent-aware telemetry, and CustomEvent emission; the planned harness instrumentation (MutationObserver, `window.__liveEmbedHarness`) hooks directly into this runtime without diverging from spec-mandated behaviors (`apps/demo-host/lib/embed-loader.ts:1-101`, `packages/embed-sdk/src/index.ts:160-475`, `docs/specs/2025-11-11-live-embed-manual-test.md:160-175`).  
- **Observability boundary:** Console/status/log outputs remain local (PlanStatusBanner, consent statuses, SEO inspector, proposed snippet log) to avoid unaudited ClickHouse writes until the telemetry gap plan approves new event families (`apps/demo-host/app/page.tsx:70-270`, `docs/specs/2025-11-11-live-embed-manual-test.md:186-190`).

## Related Documentation
- `docs/specs/2025-11-11-live-embed-manual-test.md` — Target harness spec.  
- `docs/specs/2025-11-11-embed-testing-load-issues.md` — Root-cause analysis feeding the spec.  
- `docs/product/admin-snippet.md` — Snippet generator contract and refusal logic.  
- `docs/engineering/embed-dev.md` — Manual harness overview, consent toggle guidance, and parity workflow instructions.

## Open Questions
- How to detect `window.HubEmbed` registration if future bundles change boot order, as noted in the spec’s auto-mount risk (`docs/specs/2025-11-11-live-embed-manual-test.md:218-223`).  
- Whether the harness should eventually support multi-container snippets once multi-embed requirements land (`docs/specs/2025-11-11-live-embed-manual-test.md:218-223`).  
- How Trusted Types policies with nonces interact with injected instrumentation attributes when the snippet already includes a `nonce`, per the identified risk (`docs/specs/2025-11-11-live-embed-manual-test.md:219-223`).  
- When observability can expand beyond local logs without violating the telemetry gap plan (`docs/specs/2025-11-11-live-embed-manual-test.md:220-223`).

## Follow-up (append only, as needed)
- [2025-11-11 12:02] Initial research baseline captured for the live embed manual harness scope.
