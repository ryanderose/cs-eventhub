# Events Hub Embed Phase 3 — Implementation Plan

## Overview
- Build the Phase 3 acceptance suite, observability hooks, and release workflows required to graduate the v1.6 embed from feature-complete to ship-ready per `docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md`.
- Deliver deterministic automation for §12 scenarios, enforce CI + PR attestations, instrument consent/partner telemetry end-to-end, and finalize release/rollback documentation before the CDN bundle is published broadly.

## Current State (from Research)
- `apps/demo-host/app/manual/page.tsx:36` exposes lazy, legacy, routing, Trusted Types, and multi-embed manual harness routes already wired to MSW handlers.
- `apps/demo-host/lib/useDemoPlan.tsx:33` and `apps/demo-host/lib/consent.ts:1` provide mock data + consent toggles that acceptance tests can reuse without duplicating fixtures.
- `packages/telemetry/src/index.ts:24` defines the `SdkEvent` schema (hydration, promo, chat, etc.) but lacks consent/adapters events. `apps/api/src/lib/telemetry.ts:1` bridges events into OTel traces.
- `apps/admin/app/snippets/SnippetGenerator.tsx:46` and `apps/admin/lib/embed-manifest.ts:1` enforce manifest integrity but do not yet expose automated regression tests; `apps/cdn/public/hub-embed@latest/manifest.json` is the source of truth for fixtures.
- `docs/engineering/embed-dev.md:44` and `docs/engineering/ARCHITECTURE.md:8` document manual harness usage and high-level topology, yet omit MCP/acceptance requirements and the new observability flow.

## Desired End State
- Every acceptance checklist item (consent gating, lazy/legacy mount, routing arbitration, partner adapters, Trusted Types abort, overlay isolation, snippet refusal, deprecation telemetry) has tagged Playwright coverage plus documented manual verification steps.
- Contributors must attest (via PR template + CI job) that `@acceptance` tests and bundle budgets passed locally; CI blocks merges when acceptance coverage or budgets fail.
- Telemetry includes `sdk.consentGranted`, `sdk.consentRevoked`, `sdk.partnerImpression`, `sdk.partnerClick`, and `sdk.deprecation` events emitted by the SDK, recorded in ClickHouse, and stitched into API OTel spans with consent state attributes.
- Docs and runbooks describe routing/consent/Trusted Types behavior, `[hub-embed]` troubleshooting, Playwright MCP enablement, and tested release + rollback playbooks with manifest hashes and snippet kill-switch steps.

## Non-Goals
- Reworking runtime features already shipped in Phases 1–2 (consent buffering, router ownership, lazy mount logic, SEO harness, manifest enforcement).
- Changing interpreter/composer logic beyond emitting the new telemetry hooks.
- Introducing additional data providers, CMP integrations, or non-Shadow DOM embed variants.

## Architecture & Approach
- Reuse the demo-host manual harness as the canonical testbed by adding Playwright helpers that mount its routes, toggle consent, and register partner adapters; avoid duplicating fixtures or stubbing UI flows elsewhere.
- Encapsulate telemetry additions inside `packages/telemetry` and `packages/embed-sdk`, ensuring the API layer merely forwards enriched events into existing observability pipelines.
- Extend CI/Turbo/PR workflows so acceptance + budgets run automatically in both local scripts and GitHub Actions; MCP approval instructions unblock contributors when Playwright requires sandbox elevation.
- Treat documentation and release/rollback playbooks as first-class deliverables with their own verification steps so ops/support teams can reason about issues without diving into code.
- **Alternatives considered:** building a parallel “acceptance host” app was rejected in favor of extending the already battle-tested manual harness (lower maintenance). Emitting consent telemetry only from the API was also rejected because SDK-side visibility is required to reason about buffering before network calls.

## Phases

### Phase 1 — Harness & Helper Foundations
**Goal:** Provide deterministic fixtures, shared Playwright helpers, and admin snippet unit coverage that make the acceptance suite reliable.

**Changes**
- Code: `apps/demo-host/e2e/utils.ts` — new helper module to launch manual harness routes, register `window.HubEmbed` adapters, and expose consent toggles/MSW resets for each scenario.
- Code: `apps/demo-host/e2e/fixtures/consent.ts` (or similar) — encapsulate grant/revoke helpers plus buffering assertions reused by specs.
- Code: `playwright/projects/demo/manual-harness.spec.ts` — expand into scenario-specific tests per checklist, capture `[hub-embed]` logs, attach Trusted Types abort screenshots, and map each `test.step` to §12 references.
- Code: `apps/admin/__tests__/snippet-generator.test.tsx` — add Vitest coverage for manifest drift refusal, missing SRI detection, and enforced `crossorigin="anonymous"`, including fixtures derived from `apps/cdn/public/hub-embed@latest/manifest.json`.
- Config: `apps/admin/__tests__/__fixtures__/manifest-valid.json` & `manifest-tampered.json` — canonical fixtures to keep snippet tests deterministic.
- Docs (light): add helper usage notes to test README (if present) so contributors know how to invoke the helpers.

**Notes**
- Ensure helper APIs stay framework-agnostic so `embed.spec.ts` can compose them later.
- Keep fixtures under source control; avoid reading CDN artifacts at runtime to prevent flaky tests.

**Success Criteria**  
**Automated**
- [ ] Repository unit tests pass with helper + admin suites: `pnpm -w test`.
- [ ] Manual harness Playwright subset stays green: `pnpm playwright test --project=demo-hosts-local --grep manual-harness`.
- [ ] Lint/style remain clean: `pnpm -w lint`.
**Manual**
- [ ] Verified manual harness runs still expose consent toggles/MSW controls via `pnpm dev:stack`.
- [ ] Trusted Types abort scenario captures and stores screenshots/logs for debugging.
- [ ] Admin snippet generator refuses tampered manifests in the UI after fixtures load.

---

### Phase 2 — Acceptance Suite & CI / MCP Enforcement
**Goal:** Land the canonical `@acceptance` Playwright suite and wire it into CI, Turbo scripts, and PR workflows with MCP guidance.

**Changes**
- Code: `apps/demo-host/e2e/embed.spec.ts` — implement end-to-end coverage for all nine acceptance scenarios (consent gating, lazy mount, legacy mount, routing arbitration, partner adapters, overlay isolation, Trusted Types abort, snippet refusal via admin flow, deprecation telemetry). Tag tests with `@acceptance` and annotate `test.step` with spec references.
- Code: `apps/demo-host/e2e/msw-server.ts` (or equivalent) — centralize MSW bootstrapping and expose utilities for Playwright to manipulate consent/adapters deterministically.
- Config: `playwright.config.ts` & `playwright/projects/demo/*.ts` — register/update the `demo-hosts-local` project, ensure `@acceptance` grep is available, and configure artifact retention (screenshots, traces) for CI.
- Scripts: `scripts/turbo-run.sh`, `turbo.json`, and `package.json` — add acceptance + `budgets:embed` steps to the `ci` pipeline and respect `TURBO_ALLOW_MISSING_TOKEN` fallbacks.
- CI: `.github/workflows/ci.yml` (or dedicated workflow) — add `acceptance-harness` job that runs `pnpm playwright test --project=demo-hosts-local --grep @acceptance` after unit tests; enable artifact uploads and require job success before merge.
- Repo hygiene: `.github/pull_request_template.md` — add checkboxes for bundle budgets, `@acceptance` suite, and MCP approval acknowledgment.
- Developer docs: reference MCP enablement + troubleshooting inside `docs/engineering/embed-dev.md` when describing how to run the suite locally.

**Notes**
- Ensure CI secrets (Playwright MCP approval) are documented and gating logic is visible to contributors before they open PRs.
- Keep acceptance tags granular so future suites (preview/parity) can coexist without rework.

**Success Criteria**  
**Automated**
- [ ] Acceptance suite green locally and in CI: `pnpm playwright test --project=demo-hosts-local --grep @acceptance`.
- [ ] Turbo CI pipeline runs budgets + acceptance: `pnpm -w budgets:embed` as part of `pnpm -w ci`.
- [ ] Workspace e2e aggregate succeeds: `pnpm -w e2e`.
- [ ] Repo linting stays clean: `pnpm -w lint`.
**Manual**
- [ ] GitHub `acceptance-harness` job blocks merges on failure (verified via test PR).
- [ ] PR template checkboxes visible and enforced in reviews.
- [ ] MCP approval flow documented/tested so contributors can obtain access before running Playwright.

---

### Phase 3 — Telemetry & Observability Instrumentation
**Goal:** Emit and persist consent/adapters/deprecation telemetry with schema + tests spanning SDK, telemetry package, and API.

**Changes**
- Code: `packages/telemetry/src/index.ts` — extend `SdkEvent` union with `sdk.consentGranted`, `sdk.consentRevoked`, `sdk.partnerImpression`, `sdk.partnerClick`, `sdk.deprecation`; define required attributes (`embedId`, `planHash`, `routeName`, `partnerId`, `consentState`).
- Tests: `packages/telemetry/src/__tests__/sdk-events.spec.ts` — add unit coverage for serialization, schema validation, and ordering relative to consent buffering.
- Code: `packages/embed-sdk/src/consent/index.ts` & `packages/embed-sdk/src/partners.ts` — emit new telemetry events when consent state changes or partner adapters flush buffered events; guard emissions until consent is granted.
- Code: `packages/embed-sdk/src/telemetry.ts` — ensure event pipeline supports the new event types and attaches `[hub-embed]` console breadcrumbs (used by acceptance logging).
- Code: `apps/api/src/lib/telemetry.ts` — enrich spans with attributes (`sdk.consent.status`, `sdk.partner.event`, `sdk.partner.bufferedCount`) and forward events to ClickHouse.
- Docs: update telemetry README (if present) to describe payloads and sampling controls.
- Config: `dev/docker-compose.yml` and ClickHouse dashboards — ensure local stack captures the new events for validation (may just require documentation updates).

**Notes**
- Emit events only after verifying consent state to avoid telemetry noise; include sampling/feature flags if ClickHouse load spikes.
- Align attribute naming with existing schema conventions to keep analytics queries simple.

**Success Criteria**  
**Automated**
- [ ] Unit + integration suites cover new telemetry: `pnpm -w test`.
- [ ] Type-safe builds succeed: `pnpm -w build`.
- [ ] SDK lint/tests remain healthy: `pnpm --filter @events-hub/embed-sdk test` (runs via workspace but callable directly).
**Manual**
- [ ] Using `pnpm dev:stack`, trigger consent grant/revoke + adapter flows and confirm ClickHouse/OTel exporters record the new events with expected attributes.
- [ ] Validate acceptance logs show `sdk.deprecation` when `window.EventsHubEmbed` is accessed.
- [ ] Confirm telemetry volume stays within existing ClickHouse retention budgets (per ops guidance).

---

### Phase 4 — Documentation, Release Checklist & Rollback Drill
**Goal:** Finalize contributor + ops documentation and rehearse dry-run release/rollback before public CDN rollout.

**Changes**
- Docs: `docs/engineering/embed-dev.md` — add routing mode matrix, consent API guide (`HubEmbed.consent.grant/revoke`), TT troubleshooting, `[hub-embed]` log catalog, and Playwright MCP instructions.
- Docs: `docs/engineering/ARCHITECTURE.md` — depict new acceptance suite + telemetry flow in the system map.
- Docs: `docs/ops/ROLLBACK.md` — add manifest rollback steps, snippet generator kill-switch instructions, and telemetry expectations during rollback.
- Docs: create `docs/releases/phase3-acceptance-checklist.md` (or similar) summarizing canonical acceptance scenarios, manual verification steps, and artifact requirements.
- Templates: update `.github/ISSUE_TEMPLATE/release.md` (or create) to capture dry-run artifacts (Playwright report, manifest hash, rollback confirmation).
- Release rehearsal: run `pnpm publish:embed` against staging/CDN sandbox, verify demo-host/admin consume the staged manifest, then roll back via CDN alias switch and snippet-generator disable flag.

**Notes**
- Store dry-run evidence (logs, manifest hashes, screenshots) alongside the release issue so future rollbacks can rely on precedents.
- Coordinate with release managers to schedule the drill when CDN + admin teams are available.

**Success Criteria**  
**Automated**
- [ ] Docs + configs lint clean: `pnpm -w lint`.
- [ ] Staged publish completes without errors: `TURBO_ALLOW_MISSING_TOKEN=1 pnpm publish:embed` (against staging env).
- [ ] Bundle budgets verified post-publish: `pnpm -w budgets:embed`.
**Manual**
- [ ] Documented release checklist appended to ops handbook and reviewed by QA + release leads.
- [ ] Dry-run release+rollback executed with manifest hashes, snippet disable proof, and telemetry screenshots stored in release issue.
- [ ] Support teams attest that new docs unblock them (runbook sign-off).

## Testing Strategy
- **Unit:** Vitest suites for admin snippet generator, telemetry serializers, and embed SDK consent/adapters logic (`pnpm -w test`).
- **Integration:** Manual harness helper tests plus API telemetry integration verifying OTel spans carry consent state (consider MSW-backed tests under `apps/demo-host/e2e/utils.ts`).
- **E2E:** Playwright `@acceptance` suite running via `pnpm playwright test --project=demo-hosts-local --grep @acceptance`; maintain artifacts for TT aborts + overlay isolation.
- **Observability validation:** Run scenarios via `pnpm dev:stack` and inspect ClickHouse/OTel dashboards to ensure new events flow through `packages/telemetry` → `apps/api`. Document queries in the release checklist.
- **Regressions:** Continue CI gates `pnpm -w test`, `pnpm -w e2e`, `pnpm -w check:a11y`, `pnpm -w security:sbom`, `pnpm -w check:bundles` in addition to the new acceptance job.

## Performance & Security
- Keep `budgets:embed` within Phase-A ceilings; acceptance job must fail if bundle budgets regress.
- Trusted Types abort scenario validates the safe fallback UI and prevents inline script escapes; ensure TT policies remain enforced.
- Overlay isolation tests prove map/chat overlays never escape the ShadowRoot, maintaining CSP + privacy guarantees.
- Telemetry must respect consent: no partner events before consent grant, and consent revoke must flush caches and stop emissions.

## Migration & Rollback
- No schema migrations, but telemetry consumers must handle new event types gracefully; provide versioned docs in `packages/telemetry/CHANGELOG.md` if needed.
- Release drill documents how to publish to staging CDN, promote to production, revert the alias, and disable snippet generation quickly if regressions appear.
- Acceptance suite + budgets act as preflight gates before re-promoting any rollback build.

## Risks & Mitigations
- **Playwright flakiness (manual harness dependencies)** → deterministic helpers/MSW resets, artifact capture, and headless/headed runs in CI as outlined in Phase 2.
- **MCP approval delays** → document request paths, add fallback instructions, and surface failure messaging early in scripts.
- **Telemetry noise or PII drift** → guard emissions behind consent, add sampling toggles, and review ClickHouse dashboards before GA.
- **Release rollback gaps** → enforce rehearsal plus documented playbooks with clear owners and contact paths.
- **Contributor confusion about new workflows** → PR template + docs highlight requirements; `scripts/turbo-run.sh` automates the needed commands.

## Timeline & Owners (tentative)
- Phase 1 (Week 1, QA + demo-host owners)
- Phase 2 (Week 1–2 overlap, QA + DevEx)
- Phase 3 (Week 2, telemetry + API owners)
- Phase 4 (Week 2, Docs + Release managers)

## References
- Spec: `docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md`
- Research: `docs/research/2025-11-11-phase3-acceptance-spec-research.md`
- Related code/docs: `apps/demo-host/app/manual/page.tsx:36`, `apps/demo-host/lib/useDemoPlan.tsx:33`, `apps/admin/app/snippets/SnippetGenerator.tsx:46`, `packages/telemetry/src/index.ts:24`, `docs/engineering/embed-dev.md:44`
