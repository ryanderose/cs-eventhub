# Events Hub Embed v1.6 — Phase 3 Focus Spec  
**Acceptance Suite & Rollout Readiness**

**Status:** Draft, ready for implementation  
**Patched Date:** 2025-11-10  
**Owners:** QA & Docs (primary), Embed Platform, Admin Tooling, Telemetry  
**Audience:** QA leads, SDK/admin engineers, release managers, CI owners

> Phase 3 elevates the v1.6 embed release from “feature-complete” to “ship-ready.” It codifies the §12 acceptance matrix, backfills observability for consent/adapters, wires MCP-aware Playwright jobs into CI, and completes the documentation + release/rollback playbooks required before publishing the CDN bundle broadly.

---

## 0) Context & Background

- Phases 1–2 delivered runtime gaps (consent, Trusted Types, routing, lazy/legacy mount) and admin/CDN/SEO safeguards per `docs/plans/2025-11-10-events-hub-embed-v16-gap-plan.md`.  
- Adoption across 3,000+ host sites now hinges on a deterministic acceptance suite, explicit release levers, and supporting docs.  
- This focus spec extracts **Phase 3** from the gap plan and treats it as its own shippable project encompassing QA automation, DevEx workflow updates, telemetry visibility, and rollback drills.

---

## 1) Goals

- Encode every §12 acceptance criterion (consent gating, adapters, routing, lazy mount, legacy mount, overlay isolation, Trusted Types abort, snippet refusal, deprecation telemetry) as deterministic automated coverage.
- Require contributors to run the new acceptance suite + bundle budgets before merging via scripted hooks and PR template attestations.
- Instrument consent state transitions and partner adapter callbacks end-to-end (SDK → telemetry package → API spans) for ClickHouse/OTel dashboards.
- Document the finished behavior (routing modes, consent API, TT requirements, `[hub-embed]` troubleshooting, MCP-approval flow) so support teams can reason about failures without digging through source.
- Validate release and rollback mechanics through rehearsed dry runs prior to public rollout.

---

## 2) Non-goals

- Re-implement runtime functionality already delivered in Phases 1–2 (consent buffering, router ownership, lazy mount, admin manifest enforcement, SEO parity harness).  
- Modify backend AI/composer logic beyond the telemetry hooks noted below.  
- Introduce new data providers, CMP integrations, or non-shadow embed variants.

---

## 3) Deliverables & Requirements

### 3.1 Acceptance automation (Playwright + Vitest)

| Area | Requirement |
| --- | --- |
| **Playwright suite** | Create `apps/demo-host/e2e/embed.spec.ts` covering consent gating, lazy mount, path deep links, click interception scopes, legacy mount insertion, partner adapter buffering, overlay isolation, Trusted Types abort flow, router ownership arbitration, multi-instance analytics, and deprecation telemetry. Tag each scenario with `@acceptance` and annotate with `test.step` references to spec §12. Reuse manual harness fixtures (`apps/demo-host/app/manual/**`) via new helpers `apps/demo-host/e2e/utils.ts` that spin up MSW stubs and consent controls (`apps/demo-host/lib/useDemoPlan.tsx`, `apps/demo-host/lib/consent.ts`). |
| **Manual harness spec** | Expand `playwright/projects/demo/manual-harness.spec.ts` into granular scenarios aligned with the checklist below; capture `[hub-embed]` console output for troubleshooting and attach artifacts when Trusted Types aborts occur. |
| **Admin UI tests** | Add `apps/admin/__tests__/snippet-generator.test.tsx` verifying manifest drift refusal, missing integrity detection, and enforced `crossorigin="anonymous"`. Provide fixtures for valid + tampered manifests based on `apps/cdn/public/hub-embed@latest/manifest.json`. |
| **Shared helpers** | Provide reusable helper utilities that mount harness routes, register mock partner adapters (`window.HubEmbed.registerPartnerAdapter`), and expose consent toggles so scenarios only express intent. |

### 3.2 Acceptance checklist (canonical scenarios)

Every item must have both automated coverage and, where noted, manual verification steps documented in the release checklist.

1. **Consent gating** – Pending consent blocks `hub-embed:event` emissions until `HubEmbed.consent.grant()`; verify via manual harness controls.
2. **Lazy mount** – `/manual/lazy` route defers network requests (`performance.getEntriesByType('resource')` stays empty) until IntersectionObserver triggers.
3. **Legacy mount** – Script placeholder (`PlanAwareLegacyMount` → `LegacyMountExample`) ensures SDK inserts container before `script#manual-legacy-loader`.
4. **Path routing & router ownership** – `/events` + `/manual/multi` harness: confirm `historyMode='path'` rewrites URLs and `[data-router-root]` arbitration logs `[hub-embed]:router` transitions.
5. **Partner adapters** – Mock adapter impressions/clicks buffer until consent granted; uses `packages/embed-sdk/src/partners.ts`.
6. **Trusted Types abort** – `/manual/trusted-types` harness renders safe fallback UI and logs `[hub-embed]:sdk TRUSTED_TYPES_ABORT`; capture screenshot artifact.
7. **Deprecation telemetry** – Accessing `window.EventsHubEmbed` fires single `sdk.deprecation` event per session.
8. **Snippet refusal** – Admin spec ensures tampered manifest disables Copy button with actionable callout.
9. **Overlay isolation** – Map/chat overlays stay under the embed ShadowRoot; DOM ancestry validated.

### 3.3 CI, MCP, and workflow updates

- **Playwright MCP requirement:** Document in `docs/engineering/embed-dev.md` that local + CI Playwright runs depend on the Playwright MCP integration; add approval instructions and troubleshooting (e.g., granting MCP before running `pnpm playwright test --project=demo-hosts-local --grep @acceptance`).  
- **CI job:** Create `acceptance-harness` job that runs the `@acceptance` suite post-`pnpm -w test`. Wire it via Turbo + GitHub Actions; failures block merges.  
- **Scripts:** Update `scripts/turbo-run.sh` to include `budgets:embed` and `pnpm playwright test --grep @acceptance` in the default `ci` pipeline, respecting `TURBO_ALLOW_MISSING_TOKEN`.  
- **PR template:** `.github/pull_request_template.md` gains checkboxes for (1) budgets, (2) acceptance suite, (3) Playwright MCP approval recorded.  
- **Workspace commands:** Ensure `pnpm -w e2e` aggregates the new suite; document fallback commands for local focus (e.g., `pnpm --filter=demo-host e2e -- --grep @acceptance`).

### 3.4 Documentation & knowledge sharing

- `docs/engineering/embed-dev.md` – Update routing mode guidance, consent API usage (`HubEmbed.consent.grant/revoke`), Trusted Types requirements, `[hub-embed]` troubleshooting catalogue, Playwright MCP instructions, and manual harness tips (clearing consent via `window.HubEmbed.consent.revoke()` when validating buffered telemetry).  
- `docs/engineering/ARCHITECTURE.md` – Reflect new observability flow (consent/adapters events into telemetry + API spans) and acceptance suite placement in CI.  
- Add an appendix referencing the acceptance checklist and manual fallback steps for dry runs.

### 3.5 Observability instrumentation

- `packages/telemetry/src/index.ts` – Add structured events `sdk.consentGranted`, `sdk.consentRevoked`, `sdk.partnerImpression`, `sdk.partnerClick` with required attributes (`embedId`, `planHash`, `routeName`, `partnerId`).  
- `apps/api/src/lib/telemetry.ts` – Stitch events into OTel spans via attributes like `sdk.consent.status` and `sdk.partner.event`; ensure ClickHouse captures buffered vs flushed counts.  
- Update tests to assert event emission order relative to consent state transitions.

### 3.6 Release & rollback readiness

- **Dry-run release:** Publish manifest to staging CDN, verify Admin + demo host consume latest bundle, and confirm budgets stay under Phase-A ceilings.  
- **Rollback drill:** Switch CDN alias back to previous version, disable snippet generator via feature flag, and ensure telemetry logs capture deprecation warnings rather than fatal errors.  
- **Documentation:** Add release checklist + rollback playbook references to `docs/ops/ROLLBACK.md` addendum from plan §Migration.  
- **Manual sign-off:** Track completion in release issue template with artifacts (Playwright report, staging manifest hash, rollback confirmation).

---

## 4) Testing & Validation Strategy

- **Unit/Vitest:**  
  - `apps/admin/__tests__/snippet-generator.test.tsx` for manifest drift logic.  
  - Consent + partner telemetry tests inside `packages/telemetry/src/__tests__`.  
- **Integration:**  
  - Demo host e2e helpers verifying manual harness pages mount with MSW stubs.  
  - API telemetry integration ensuring OTel spans include consent attributes.  
- **E2E/Acceptance (Playwright):**  
  - `pnpm playwright test --project=demo-hosts-local --grep @acceptance` (CI-gated).  
  - Scenario-level artifacts for TT aborts + overlay isolation DOM snapshots.  
- **Observability validation:**  
  - Local ClickHouse/OTel exporters confirm receipt of new events during manual harness runs (`pnpm dev:stack` + acceptance scenario).  
- **Regression guardrails:**  
  - Continue running `pnpm -w test`, `pnpm -w e2e`, `pnpm -w budgets:embed`, `pnpm -w check:a11y`, `pnpm -w security:sbom`, and `pnpm -w ci`.

---

## 5) Dependencies & Inputs

- Phase 1 runtime changes (`packages/embed-sdk`, router helpers, Trusted Types, consent buffering).  
- Phase 2 admin/CDN/SEO updates (manifest enforcement, JSON-LD parity, bundle budget wiring).  
- Manual harness fixtures under `apps/demo-host/app/manual/**` and consent utilities `apps/demo-host/lib/consent.ts`.  
- Telemetry schema baseline at `packages/telemetry/src/index.ts`.

---

## 6) Milestones & Timeline (target one sprint)

1. **Week 1** – Build shared Playwright helpers, expand manual-harness spec, land admin unit tests, implement telemetry events (unit-tested).  
2. **Week 2** – Finalize acceptance suite coverage, integrate CI job + PR template, update documentation, run dry-run release + rollback drill, archive artifacts.  
3. **Exit criteria** – All acceptance checks automated + green, docs merged, release checklist signed, and telemetry dashboards showing consent/adapters events.

---

## 7) Risks & Mitigations

- **Playwright flakiness due to manual harness dependencies** → use deterministic repo fixtures/MSW, run in headless + headed on CI, capture artifacts for debugging.  
- **MCP access blockers** → document enablement steps, add fallback instructions for obtaining user approval, and gate CI job until MCP approval is confirmed.  
- **New telemetry noise** → guard events behind consent state checks; add sampling controls if ClickHouse volume spikes.  
- **Release rollback gaps** → rehearsal plus documented playbook ensures operators can revert CDN alias + disable snippet generator quickly.

---

## 8) Success Metrics

- 100% of acceptance checklist automated with deterministic Playwright specs tagged `@acceptance`.  
- CI `acceptance-harness` job mandatory + green before merge; PR template attestation enforced.  
- Telemetry dashboards show consent transition + partner adapter events correlated with spans.  
- Documentation reflects final routing/consent/TT behavior and MCP workflow.  
- Release + rollback drills completed with recorded manifest hashes and console logs.

---

## 9) References

- `docs/plans/2025-11-10-events-hub-embed-v16-gap-plan.md` (Phase 3 source)  
- `docs/specs/2025-11-09-events-hub-embed-final-spec-1.6.md` (§12 acceptance requirements)  
- Manual harness context: `apps/demo-host/app/manual/**`, `apps/demo-host/lib/useDemoPlan.tsx`, `apps/demo-host/lib/consent.ts`  
- Telemetry baseline: `packages/telemetry/src/index.ts`, `apps/api/src/lib/telemetry.ts`  
- Admin manifest logic: `apps/cdn/public/hub-embed@latest/manifest.json`, `apps/admin/lib/embed-manifest.ts`

