---
title: "Live Embed Manual Test Harness"
date: "2025-11-11"
authors: ["ChatGPT Codex 5"]
status: "draft"
related_docs:
  - "../product/spec-v1.6.md"
  - "../product/admin-snippet.md"
  - "./2025-11-11-embed-testing-load-issues.md"
  - "./2025-11-09-events-hub-embed-final-spec-1.6.md"
---

# 1. Background

- The admin console ships the embed snippet generator at `apps/admin/app/snippets/SnippetGenerator.tsx`, which reads CDN manifests and emits the canonical `<div data-hub-embed>` container plus the dual script tags (ESM + UMD) mandated in the v1.6 spec.
- Demo-host manual routes (`apps/demo-host/app/manual/**/*`) currently import the SDK directly via `ManualEmbed`/`LegacyMountExample` without ever pasting the snippet. Those harnesses validate routing, lazy mount, and consent flows, but they do not exercise the real copy/paste workflow or CDN bundle wiring.
- QA gaps called out in `docs/specs/2025-11-11-embed-testing-load-issues.md` stem from this disconnect: we cannot show that the admin-generated snippet will actually boot on a CMS-style page without editing code.
- Customer demos increasingly require “show me how I copy this into WordPress.” Without a documented, automated harness we risk regressions in snippet generation, Trusted Types handling, and SRI/CSP compliance.

# 2. Problem Statement

We need a deterministic, documented workflow that walks through the exact steps an editor or CMS integrator would follow: open admin, copy the embed code, paste it into a host page, and confirm that the embed runs with real plans/telemetry. That workflow must live inside the demo host so it can piggyback on `pnpm dev:stack`, reuse consent toggles, and stay in sync with the rest of the harnesses.

Without this, we cannot:

1. Validate bundle/SRI regressions without leaving the monorepo.
2. Demonstrate the copy/paste experience to stakeholders (especially WordPress customers who only inject HTML blocks).
3. Triage bugs that only reproduce when the embed is booted via the real snippet (script tags, global bootstrapping, Trusted Types interactions, etc.).

# 3. Goals

1. **Real-time snippet execution:** Create a “Real-Time Embed Test” manual route that accepts raw snippet markup and instantiates the embed exactly as it would run on a CMS page.
2. **Documented workflow:** Encode the admin ➜ copy ➜ demo host ➜ run steps with inline guidance so PMs, QA, and partner engineers can reproduce them.
3. **Visibility & observability:** Surface script load status, SDK lifecycle status (ready/error), and telemetry events emitted by the embed so failures are actionable.
4. **Safety & parity:** Keep the harness compliant with the v1.6 spec—no iframes, respect Trusted Types, respect consent toggles, and surface warnings when snippets violate CSP/SRI rules.
5. **Repeatable tests:** Allow testers to store, rerun, and reset snippets without refreshing the page, and capture Playwright coverage so the workflow becomes part of CI.

# 4. Non-Goals

- Building a WYSIWYG snippet editor or replacing the admin snippet generator.
- Supporting arbitrary HTML/JS execution beyond the Events Hub embed snippet (non-`data-hub-embed` markup is rejected).
- Spinning up WordPress or another CMS; the harness runs inside the existing Next.js demo host.
- Delivering a multi-tenant snippet history UI—one sandbox page per environment is sufficient.

# 5. Target Flow (happy path)

1. Developer runs `pnpm dev:stack` (admin ⇢ 3001, demo host ⇢ 3000, CDN ⇢ 4002).
2. In admin, they open `/snippets`, pick a manifest (`hub-embed@latest` locally), adjust tenant/embed/basePath/historyMode/lazy, and copy the snippet.
3. They switch to the demo host, click the new navigation link “Real-Time Embed Test” (under Manual harness routes).
4. On that page they paste (or “Paste from clipboard”) the snippet, review validation badges, and optionally toggle helpers (force legacy, auto-run).
5. Clicking “Run embed” injects the container + script/link tags into the preview canvas, shows script load/SRI status, and listens for SDK readiness + telemetry events.
6. They interact with the mounted embed exactly as a CMS page would behave. To test another bundle, they edit the textarea and rerun—no code edits or reloads required.

# 6. Experience Requirements

## 6.1 Navigation & scaffolding

- Add a top-level nav item in `apps/demo-host/app/components/Navigation.tsx` labeled “Real-Time Embed Test” pointing to `/manual/live-embed`. Follow the existing active-state helper.
- Update `apps/demo-host/app/manual/page.tsx` to include a card for the new harness (title, summary, CTA).
- Reuse `apps/demo-host/app/manual/layout.tsx` so testers keep the Plan Status banner (`PlanStatusBanner`) and consent toggles (`ManualHarnessControls`).

## 6.2 Input & validation

- **Instructions block:** Reference the admin URL (respect `NEXT_PUBLIC_ADMIN_ORIGIN` fallbacking to `http://localhost:3001`). Remind testers to run `pnpm publish:embed` when manifests are missing and link to `docs/product/admin-snippet.md`.
- **Textarea:** Monospace, multi-line, labeled “Paste embed snippet”. Prefill with the last run stored in `localStorage['manualSnippet:last']`; if empty, show a commented sample snippet plus a reminder to copy from admin.
- **Controls:**
  - Buttons: “Paste from clipboard”, “Load latest local manifest” (optional helper that fetches `/api/snippets/latest` if we add that endpoint later), “Clear”.
  - Toggles: “Auto-run on paste”, “Force legacy fallback (UMD only)”, “Persist snippet between reloads”.
- **Validation badges** (update as text changes):
  - ✅ exactly one `data-hub-embed` container.
  - ✅ at least one `<script type="module" crossorigin="anonymous" integrity="…">`.
  - ⚠️ missing `nomodule` fallback.
  - ⚠️ inline script detected (block execution per `docs/specs/2025-11-09-events-hub-embed-final-spec-1.6.md` §9.3).
  - ⚠️ missing `crossorigin` or `integrity`.
  - Derived metadata (tenantId, embedId, basePath, historyMode, lazy flag) displayed in a summary table for quick sanity checks.
- Disable the “Run embed” button and show inline errors whenever validation fails.

## 6.3 Execution sandbox

- Layout:
  - **Status header:** pill badges for Module script, Nomodule script, Styles, and Embed lifecycle (pending/ready/error/timed out). Show errors inline (SRI mismatch, network failure, Trusted Types abort).
  - **Preview canvas:** `<section data-live-embed-preview>` where the snippet content is injected; no DOM mutations outside this node.
  - **Controls:** “Run embed” (primary), “Reset environment” (destroys injected nodes + captured handles), and the toggles listed above.
- Lifecycle:
  - Each run increments a `runId` stored on the preview root via `data-live-run-id`.
  - Before injecting, call `cleanup()` to remove prior DOM nodes, destroy captured handles (see §7.3), detach listeners, and reset status.
  - Append style `<link>` elements first, then script tags. When “Force legacy fallback” is toggled, skip module scripts so only UMD executes.
  - All scripts must be created via `document.createElement('script')` + attribute assignment; never rely on `innerHTML`.
  - Add `data-live-run-id` attributes to every injected element so console logs and UI status entries can reference the run.
  - Use a 10 s timeout; if no ready signal arrives, mark the run as timed out but keep controls enabled.

## 6.4 Observability & telemetry

- **Instrumentation hooks:**
  - Wrap `window.HubEmbed` as soon as it exists to capture returned `EmbedHandle` objects (store `{ runId, embedId, handle }` for cleanup). Only touch `window.EventsHubEmbed` when the snippet fails to register `HubEmbed` but clearly relies on the legacy global; use a lazy getter so the alias is never accessed unless it is the only available API. This prevents spurious `sdk.deprecation` events while the alias remains supported per the gap plan.
  - Listen for `CustomEvent('hub-embed:event')` on the preview canvas (the SDK dispatches these via `container.dispatchEvent(...)` inside `packages/embed-sdk/src/index.ts`). Append the last N events to a scrollable log with filters (consent, telemetry code, route).
  - Observe the preview canvas with `MutationObserver` and look for a descendant whose `.shadowRoot` is populated; that becomes the “ready” signal if no telemetry events fire.
- **Local logging only:** Stream run status, script outcomes, and captured telemetry events to the on-page log + console (`[demoHost.liveSnippet]` prefix). Do **not** emit new ClickHouse/OTel event families; the gap plan only authorizes the consent/adapter telemetry already defined in `packages/telemetry`. Any future pipeline events must be added to the plan first.
- Provide “Copy log” button to dump the most recent status payloads for bug reports.

## 6.5 Accessibility & editorial polish

- Follow WCAG 2.2 AA: all controls require visible labels, focus outlines, and `aria-describedby` relationships so validation errors announce via screen readers.
- Status messages should use `role="status"`/`aria-live="polite"` so readiness updates announce automatically.
- Preview canvas needs an offscreen description: “Embed mounts below; focus inside to interact with the real snippet.”
- Inline documentation references `docs/product/spec-v1.6.md` sections for CSP, Trusted Types, and analytics requirements so the page doubles as a runbook.

## 6.6 Error/help states

- Inline callouts covering:
  - No manifests detected → “Run `pnpm publish:embed` from repo root.”
  - SRI mismatch → “Regenerate bundles; the CDN files no longer match admin manifests.”
  - Consent pending → prompt testers to toggle the Manual Harness Controls.
  - Trusted Types failure → remind that the snippet must run in an environment that provides a Trusted Types policy (per §9.3).
- Allow rerunning the same snippet even after errors without clearing the textarea.

# 7. Technical Plan

## 7.1 Routes & component structure

- Add `apps/demo-host/app/manual/live-embed/page.tsx` (server component) that renders copy plus `<RealTimeEmbedTester />`.
- Add `apps/demo-host/app/manual/live-embed/RealTimeEmbedTester.tsx` (client) plus supporting hooks:
  - `useSnippetParser` (pure parsing/validation).
  - `useSnippetRunner` (DOM injection, instrumentation, logging).
  - `usePersistentTextarea` (localStorage sync).
- Extend `apps/demo-host/app/components/Navigation.tsx` and `apps/demo-host/app/manual/page.tsx` with the new link/card.
- Optional helper module: `apps/demo-host/lib/liveSnippetLog.ts` that standardizes the local log entry shape (timestamp, runId, message, metadata). No shared telemetry schema changes are required.

## 7.2 Snippet parsing & validation

Algorithm (runs entirely on the client):

1. Normalize input (`\r\n` → `\n`, trim edges). Reject empty strings.
2. Use `DOMParser.parseFromString(snippet, 'text/html')` to obtain a detached document.
3. Collect nodes:
   - Exactly one `[data-hub-embed]` container; capture its attributes (tenantId, embedId, data-base-path, data-history-mode, data-lazy).
   - `<script>` tags: classify into module vs nomodule based on attributes. Reject inline JS (non-empty `textContent`) to uphold CSP §9.3.
   - `<link rel="stylesheet">` tags, verifying `crossorigin="anonymous"` and copying `integrity` when supplied.
4. Return a `SnippetDescriptor`:

```ts
type ScriptSpec = { type: 'module' | 'nomodule'; src: string; integrity: string; crossorigin: string };
type LinkSpec = { rel: string; href: string; integrity?: string; crossorigin?: string };
type SnippetDescriptor = {
  container: HTMLElement;
  moduleScripts: ScriptSpec[];
  nomoduleScripts: ScriptSpec[];
  styleLinks: LinkSpec[];
  metadata: { tenantId?: string; embedId?: string; basePath?: string; historyMode?: string; lazy?: boolean };
  warnings: string[];
  errors: string[];
};
```

5. Expose validation metadata so the UI can highlight missing pieces and disable the Run button while `errors.length > 0`.
6. Write Vitest coverage under `apps/demo-host/app/manual/live-embed/__tests__/snippetParser.test.ts`.

## 7.3 Sandbox lifecycle & instrumentation

- Shared preview element via `useRef<HTMLDivElement>(null)`. Each run increments `runId`.
- Runner steps:
  1. `cleanup(runId?)`: destroy captured handles (see instrumentation below), remove all children from the preview element, cancel timers, detach listeners, reset status.
  2. Clone the descriptor nodes (never reuse originals), stamp `data-live-run-id`, and append the container plus style links.
  3. Inject scripts:
     - Create actual `<script>` elements per spec; copy `src`, `type`/`nomodule`, `integrity`, `crossorigin`, `nonce`, `referrerpolicy`.
     - Attach `onload` / `onerror` handlers that update `scriptStatus[scriptId]` and append a structured entry to the local log panel (no pipeline emission).
     - When “Force legacy fallback” is on, skip module scripts so only UMD runs (simulate Safari 12-/IE).
  4. Start a 10-second timeout. If no ready signal fires, mark run as timed out (status pill + log entry) but leave preview intact.
- Instrumentation:
  - Before injecting, install `window.__liveEmbedHarness`:
    - Wrap `window.HubEmbed` once it registers. Only attach to `window.EventsHubEmbed` if the snippet fails to expose `HubEmbed`; use a lazy getter so the alias isn’t touched during normal runs, preserving the deprecation guard guarantees.
    - Provide `window.__liveEmbedHarness.destroyAll()` for debugging and to ensure we can clean up even if the embed fails mid-run.
  - Listen for `CustomEvent('hub-embed:event')` on the preview container; mirror events into the local log alongside consent status (from `useConsentStatus`) and plan hash (from `useDemoPlanContext`).
  - Use `MutationObserver` to detect when the container gains a ShadowRoot; combined with `HubEmbed` handle instrumentation we can flip status to “ready”.

## 7.4 Local dev & env compatibility

- Respect env helpers from `apps/demo-host/lib/env.ts`:
  - Use `process.env.NEXT_PUBLIC_ADMIN_ORIGIN ?? 'http://localhost:3001'` for instruction links.
  - Surface the resolved CDN origin in the UI (read from snippet or `ADMIN_EMBED_CDN_ORIGIN`), with a warning if it doesn’t match the currently running CDN server.
  - Keep the route ISR-disabled (`export const revalidate = 0`) so instructions stay current during dev.
- Document how to test preview/prod snippets: set `NEXT_PUBLIC_EMBED_SRC` or `ADMIN_EMBED_CDN_ORIGIN` and ensure CORS allows `localhost`.

## 7.5 Telemetry & logging

- Keep observability scoped to the harness UI + console:
  - Every run writes structured objects to a local log (stored in React state) and mirrors them to `console.info('[demoHost.liveSnippet]', payload)`.
  - The log captures run metadata (tenantId, embedId, planHash, manifestId, historyMode, lazy, forceLegacy), script load outcomes, timeout events, and any `hub-embed:event` payloads surfaced by the SDK.
  - Provide “Copy log JSON” to export the latest log buffer for bug reports.
- Rationale: the v1.6 gap plan currently limits pipeline telemetry changes to the consent + partner adapter work. Until that plan expands, do **not** emit new event families (e.g., `manual.snippet-test.*`) through `packages/telemetry`; doing so would add unaudited ClickHouse rows and potentially bypass consent budgets. Once the plan is updated, this section can be revised to describe the approved telemetry surface.

## 7.6 Documentation & DX

- Update `docs/engineering/embed-dev.md` with a subsection that:
  - Lists prerequisites (run `pnpm publish:embed`, set `ADMIN_EMBED_CDN_ORIGIN`, start `pnpm dev:stack`).
  - Walks through the admin ➜ copy ➜ demo host ➜ run steps with screenshots.
  - Includes troubleshooting tips mirroring the inline error callouts.
- Cross-link from `docs/product/admin-snippet.md` so PMs know how to validate bundles end-to-end.

# 8. Testing Strategy

- **Unit (Vitest):**
  - Parser enforces container/script/link rules.
  - Runner handles script success/failure, timeouts, and cleanup idempotently.
- **Integration (React Testing Library):**
  - Page renders instructions, disables Run until validation passes, persists snippets via `localStorage`.
  - Force-legacy toggle removes module scripts before execution.
- **Playwright (extend existing manual harness suite):**
  - Copy snippet from admin (stub `fetchSnippetList`), paste into tester, click Run, assert `[data-live-embed-preview] section[data-block="hero-carousel"]` appears.
  - Flip consent to “pending” via Manual Harness Controls and ensure telemetry log shows buffered events before consent is granted.
- **Manual QA checklist (documented in spec + docs):**
  - Run with lazy flag true/false.
  - Simulate SRI mismatch (tamper script URL) and confirm failure surfaces.
  - Toggle “Force legacy fallback” and verify only UMD requests fire (inspect Network tab).

# 9. Risks & Open Questions

1. **Auto-mount timing:** The harness assumes the CDN bundle registers `window.HubEmbed` synchronously. If future bundles change boot order, we may need a polling fallback before wrapping `create`.
2. **Multiple containers per snippet:** Future multi-embed snippets might bundle several containers; this spec enforces a single container for clarity. Revisit when multi-embed requirements land.
3. **Trusted Types policies:** Injected scripts must respect host Trusted Types. We need tests ensuring snippets that include a `nonce` keep working when we add instrumentation attributes.
4. **Observability scope creep:** If we later decide to push harness metrics into ClickHouse/OTel, we must update `docs/plans/2025-11-10-events-hub-embed-v16-gap-plan.md` first so schema changes and consent gating are reviewed. For now, keep logs confined to the UI/console.

Delivering this harness gives us a “WordPress-like” manual test that mirrors customer workflows, keeps us aligned with the v1.6 product spec, and plugs the QA gap between admin snippet generation and real-world embeds.
