# Live Embed Manual Test Harness — Implementation Plan

## Overview
- Build a `/manual/live-embed` harness inside the demo host that accepts admin-generated snippets, validates them, and runs the embed exactly as a CMS page would, closing the QA gap highlighted in the spec.
- Provide guided instructions, script/SRI status, telemetry mirrors, and rerunnable snippets so PMs/QA/partners can reproduce end-to-end flows without editing code.
- Ticket/Spec: `docs/specs/2025-11-11-live-embed-manual-test.md`

## Current State (from Research)
- Manual harness pages mount `<ManualEmbed>` or legacy examples directly, bypassing the real snippet workflow the QA team needs (`apps/demo-host/app/manual/components/ManualEmbed.tsx:1`).
- Navigation and index cards have no entry point for a live snippet tester, so the workflow is undiscoverable (`apps/demo-host/app/components/Navigation.tsx:11`, `apps/demo-host/app/manual/page.tsx:3`).
- Admin snippet generator already emits the canonical `<div data-hub-embed>` container with module/nomodule scripts and integrity metadata, but there is no consumer to verify the emitted markup (`apps/admin/app/snippets/SnippetGenerator.tsx:46`).
- Env helpers expose admin/CDN origins and consent controls through the manual layout, which we can reuse for the new harness (`apps/demo-host/lib/env.ts:1`, `apps/demo-host/app/manual/layout.tsx:1`).
- No parser/runner hooks or Playwright scripts exist for paste-and-run snippets; telemetry is only validated indirectly via the embed SDK tests.

## Desired End State
- Demo host navigation exposes “Real-Time Embed Test,” leading to a route that documents the admin ➜ copy ➜ paste ➜ run flow and validates snippets before execution.
- Testers can paste snippets, review parsed container/script/link metadata, see validation errors/warnings, and persist/reuse snippets without reloading.
- Running a snippet injects cloned container/style/script nodes, logs script load lifecycle, exposes `window.__liveEmbedHarness`, mirrors `hub-embed:event` payloads, and surfaces consent/plan metadata without emitting new ClickHouse events.
- Harness warns on SRI, crossorigin, or origin mismatches, honors Trusted Types/nonces, supports force-legacy (UMD-only) mode, and times out if no ready signal appears within 10 s.
- Unit, integration, and Playwright coverage enforce parsing rules, runner cleanup, log export, and consent interactions; docs teach the workflow and troubleshooting steps.

## Non-Goals
- Building a WYSIWYG snippet editor or modifying admin snippet generation logic.
- Allowing arbitrary HTML/JS beyond validated Events Hub snippets (reject snippets lacking `data-hub-embed`).
- Shipping multi-container snippet support; stay with single-container flow until spec expands.
- Emitting new telemetry families or ClickHouse rows from the harness; logs stay local.
- Spinning up WordPress/other CMS stacks—demo host route suffices.

## Architecture & Approach
- **Route & UX scaffolding:** Add nav link/card + `/manual/live-embed/page.tsx` server component under the existing `ManualLayout`, rendering instructions (respecting `NEXT_PUBLIC_ADMIN_ORIGIN` / CDN origin), CTA buttons, and the client tester shell.
- **Client tester & hooks:** Implement `RealTimeEmbedTester` (client component) plus `useSnippetParser`, `usePersistentTextarea`, and `useSnippetRunner`. Hooks live under `apps/demo-host/app/manual/live-embed/` for co-location and are unit tested with Vitest.
- **Parser:** Use `DOMParser` to create a detached document, enforce exactly one container, classify module/nomodule scripts and stylesheet links, capture metadata, and produce `errors[]/warnings[]` for UI badges. Reject inline scripts, missing integrity/crossorigin, or extra nodes per spec §7.2.
- **Runner & instrumentation:** Runner clones descriptor nodes into a preview ref, injects scripts with `onload/onerror`, tracks status per script, attaches timeout guard, registers `window.__liveEmbedHarness`, wraps `window.HubEmbed` handles, observes ShadowRoot creation, and listens for `hub-embed:event` on the container.
- **Logging & persistence:** Maintain a structured log buffer (maybe via `liveSnippetLog.ts`) in React state, render a filterable panel, mirror entries to `console.info`, and provide “Copy log JSON.” Persist the raw snippet in `localStorage` so testers can reload/rerun.
- **Docs & testing:** Extend `docs/engineering/embed-dev.md` with the workflow + troubleshooting, cross-link from `docs/product/admin-snippet.md`, and add Playwright coverage under `playwright/tests/manual-live-embed.spec.ts` (demo project). Hook into existing QA scripts (`pnpm test:e2e:local`) and ensure Vitest + ESLint guard rails stay green.

**Alternatives considered**
1. **Extend `<ManualEmbed>` to accept raw snippet strings:** Rejected because `<ManualEmbed>` relies on linked imports and bypasses real script/link tags; the harness must prove the admin snippet works verbatim.
2. **Emit telemetry via `packages/telemetry`:** Deferred to avoid schema/consent churn; local logs keep scope contained until the telemetry gap plan expands (§7.5).

## Phases

### Phase 1 — Harness Scaffolding & Guidance
**Goal:** Expose the live embed flow in the UI, layout, and content so testers have a discoverable, documented entry point.

**Changes**
- Code: `apps/demo-host/app/components/Navigation.tsx` — add “Real-Time Embed Test” link and active-state handling.
- Code: `apps/demo-host/app/manual/page.tsx` — add a card describing the live tester with CTA linking to `/manual/live-embed`.
- Code: `apps/demo-host/app/manual/live-embed/page.tsx` — create server component wiring instructions (admin origin, stack startup checklist), CTA buttons (paste, run, reset), and `<RealTimeEmbedTester />`.
- Code: `apps/demo-host/lib/env.ts` — expose helper(s) for resolved admin/CDN origins so instructions stay DRY and rerender when envs change.
- Docs: Inline copy referencing `pnpm dev:stack`, `pnpm publish:embed`, and consent toggles.

**Notes**
- Route should reuse `ManualLayout` so consent toggles + plan banner stay in scope.
- Keep page ISR-disabled (`export const revalidate = 0`) to avoid stale instructions.

**Success Criteria**  
**Automated**
- [ ] Build succeeds: `pnpm -w build`
- [ ] Lint passes: `pnpm -w lint`
- [ ] Type checks for demo host succeed implicitly via build (Next.js typegen)
**Manual**
- [ ] Navigation shows “Real-Time Embed Test” and routes correctly in dev stack.
- [ ] Instructions reference the resolved admin URL and explain snippet copy steps.
- [ ] Manual controls (plan banner, consent toggles) remain visible on the new route.

---

### Phase 2 — Snippet Parser, Validation, and Persistence
**Goal:** Implement the client-side parser/persistence pieces so snippets can be vetted before execution and stored for reruns.

**Changes**
- Code: `apps/demo-host/app/manual/live-embed/RealTimeEmbedTester.tsx` — add UI shell (textarea, validation badges, toggle panel, run/reset buttons, preview/log panes) that consumes parser + persistence hooks.
- Code: `apps/demo-host/app/manual/live-embed/useSnippetParser.ts` — implement DOMParser-based logic returning `SnippetDescriptor` + `errors/warnings`.
- Code: `apps/demo-host/app/manual/live-embed/usePersistentTextarea.ts` — synchronize snippet textarea with `localStorage`, including versioned key + reset helper.
- Tests: `apps/demo-host/app/manual/live-embed/__tests__/snippetParser.test.ts` — Vitest cases for success, missing container, inline script rejection, module/nomodule classification, and SRI/crossorigin badges.
- Docs/UI: Validation badges and inline guidance describing why Run is disabled until parser errors clear.

**Notes**
- Parser must never touch `window` so it can be tested in Vitest/JSDOM without DOM side effects.
- Persisted snippet should store timestamps and manifest IDs when available for later log correlation.

**Success Criteria**  
**Automated**
- [ ] Unit tests pass: `pnpm -w test`
- [ ] Lint passes: `pnpm -w lint`
- [ ] Demo host storybook/ladle lint unaffected (already covered via repo lint config)
**Manual**
- [ ] Blank/invalid snippets show actionable errors and keep Run disabled.
- [ ] Valid snippets surface parsed metadata (tenant, embedId, scripts) before execution.
- [ ] Snippet text persists across page reloads and can be reset via UI control.

---

### Phase 3 — Runner, Instrumentation, Logging, Docs, and E2E
**Goal:** Execute snippets safely, surface lifecycle/log data, and bake the workflow into automated + human-readable documentation.

**Changes**
- Code: `apps/demo-host/app/manual/live-embed/useSnippetRunner.ts` — manage preview ref, cleanup, cloning, script injection, timeout guard, `forceLegacy` toggle, and `window.__liveEmbedHarness` instrumentation (HubEmbed wrapper, destroyAll, MutationObserver).
- Code/UI: `RealTimeEmbedTester` — add log panel with severity filters, “Copy log JSON,” script status pills, telemetry mirror table, consent + plan hash indicators, timeout badges, and CDN origin mismatch warnings.
- Code: `apps/demo-host/app/manual/live-embed/__tests__/snippetRunner.test.tsx` — JSDOM tests for cleanup idempotence, timeout handling, force-legacy behavior, and harness hook installation.
- Code: `playwright/tests/manual-live-embed.spec.ts` (demo project) — script covering copy/paste, Run, consent toggle interaction, force-legacy toggle, and log export assertions.
- Docs: `docs/engineering/embed-dev.md` — add “Live Embed Manual Test” subsection with screenshots, troubleshooting (SRI mismatch, consent pending, missing manifests), and cross-link from `docs/product/admin-snippet.md`.

**Notes**
- Logging should avoid user PII and remain local; no `packages/telemetry` wiring changes.
- Provide cleanup on route unmount to avoid leaking global harness state between runs.

**Success Criteria**  
**Automated**
- [ ] Unit/integration tests pass: `pnpm -w test`
- [ ] Playwright coverage updated: `pnpm test:e2e:local`
- [ ] Accessibility/bundle checks unaffected: `pnpm -w check:a11y`, `pnpm -w check:bundles`
- [ ] Supply-chain checks still pass: `pnpm -w security:sbom`
**Manual**
- [ ] Running a valid snippet loads module + nomodule scripts, shows readiness log entries, and mirrors `hub-embed:event` payloads.
- [ ] Force-legacy mode only loads UMD bundle (confirmed via Network tab/log).
- [ ] “Copy log JSON” produces structured payload for bug reports; resetting clears preview + logs without reload.

## Testing Strategy
- **Unit (Vitest):** Parser edge cases (missing container, inline script rejection, integrity/crossorigin enforcement), runner lifecycle (cleanup, timeout, force-legacy), and persistence hook behavior.
- **React testing:** Shallow render of `RealTimeEmbedTester` to confirm UI gating, badge rendering, and persistence/resets via Testing Library.
- **Playwright:** New manual harness spec covering copy/paste, run success, timeout path (tampered URL), consent toggle interactions, and log export; tag with `@manual` for selective runs.
- **Accessibility:** Reuse Ladle/a11y scripts to confirm new controls meet WCAG 2.2 AA (focus order, ARIA labels).
- **Observability verification:** Console log payloads include runId, planHash, tenantId, script statuses; confirm no telemetry calls hit ClickHouse pipelines.

## Performance & Security
- Respect 10 s timeout and unmount cleanup to avoid dangling scripts; repeated runs should not leak handles or degrade P95/P99 budgets.
- Enforce Trusted Types/nonces by copying snippet-provided nonce attributes and avoiding `innerHTML`.
- Validate integrity/crossorigin per snippet; warn when CDN origin mismatches current demo origin to catch misconfigurations early.
- Keep Shadow DOM requirement intact—only run embed via snippet; do not bypass `useShadowDom`.
- Ensure logging avoids PII and stays client-side; no network calls beyond snippet scripts.

## Migration & Rollback
- Feature is additive: new route + components. Rolling back simply removes `/manual/live-embed` and related hooks; existing manual harnesses remain untouched.
- Parser/runner hooks are isolated to the route, so no shared modules need schema changes.
- Docs can be reverted independently if necessary; no data migrations involved.

## Risks & Mitigations
- **Auto-mount timing changes** → Wrap HubEmbed registration with polling fallback + timeout so harness degrades gracefully if future bundles change boot order.
- **Trusted Types/nonces conflicts** → Mirror snippet-provided nonce and avoid mutating script text to prevent CSP violations; add tests for nonce-preserving injections.
- **Multi-container future requirements** → Architect parser data model to accept arrays even if UI currently enforces a single container, minimizing rework later.
- **Telemetry scope creep** → Keep logging local and document in code comments why telemetry isn’t emitted; revisit only after telemetry gap plan updates.
- **Playwright flakiness** → Use deterministic fixtures (seeded default plan, stubbed manifests) and rely on `pnpm dev:stack` env toggles for stable runs.

## Timeline & Owners (tentative)
- Phase 1: 1 day — Demo host UI owner
- Phase 2: 2 days — Frontend engineer owning parser/hooks/tests
- Phase 3: 3 days — Frontend + QA pairing for runner, instrumentation, Playwright, docs

## References
- Spec/Ticket: `docs/specs/2025-11-11-live-embed-manual-test.md`
- Research: `docs/research/2025-11-11-live-embed-manual-test-research.md`
- Related code:
  - `apps/demo-host/app/components/Navigation.tsx:11`
  - `apps/demo-host/app/manual/page.tsx:3`
  - `apps/demo-host/app/manual/components/ManualEmbed.tsx:1`
  - `apps/demo-host/lib/env.ts:1`
  - `apps/admin/app/snippets/SnippetGenerator.tsx:46`
