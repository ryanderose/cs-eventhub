# Hybrid Dev Servers + Preview Deployments — Implementation Plan

## Overview
- Introduce a hybrid workflow where local dev servers cover the fast inner loop and preview deployments validate runtime-coupled behavior before merge.
- Align apps (`apps/demo-hosts`, `apps/admin`, `apps/api`) and tooling with the approved spec so agents can run without interactive prompts.

## Current State (from Research)
- Local API execution relies on Vercel function handlers; there is no standalone Node adapter or health endpoint for readiness checks (`apps/api/api/v1/compose.ts:1`, `docs/research/2025-11-02-hybrid-dev-preview-research.md:94`).
- Playwright config targets the existing handlers but lacks distinct local/preview projects or parity checks (`playwright/config.ts:1`, `docs/research/2025-11-02-hybrid-dev-preview-research.md:55`).
- CI runs local suites only; preview smoke execution requires manual orchestration (`docs/research/2025-11-02-hybrid-dev-preview-research.md:116`).
- Telemetry helpers exist but no environment-aware mode prevents accidental prod event emission during tests (`packages/telemetry/src/index.ts:1`).

## Desired End State
- Local dev servers (`next dev`, Node/TS API) run on fixed ports with zero prompts; Playwright spins them up automatically when needed.
- Preview smoke suites target a supplied `PREVIEW_URL` and cover middleware/auth/ISR parity with lightweight canary checks.
- CI gate enforces local suites on every PR and conditionally runs preview smoke when runtime-coupled changes are detected.
- Telemetry honors `TELEMETRY_MODE` across apps and tests so non-prod runs use `dev` or `noop` sinks.

## Non-Goals
- Rewriting existing Vercel function handlers or edge logic beyond adapter reuse.
- Implementing full production observability pipelines or analytics storage.
- Replacing current data providers, AI composition, or embed/admin UI flows.

## Architecture & Approach
- Create a thin Express (or Fastify) adapter under `apps/api/adapters/local` that mounts the existing route handlers, exposes `/health`, and reuses plan/telemetry modules.
- Update package scripts and turborepo tasks so `pnpm --filter @events-hub/api dev` starts the local adapter while Vercel handlers remain intact for preview/prod.
- Expand Playwright configuration to define local projects (with `webServer` commands) and preview projects that read `PREVIEW_URL`, plus add parity-canary fixtures and MSW mocks per spec guidance.
- Introduce a telemetry mode toggle sourced from environment variables and surface it across apps/admin/embed to avoid prod emissions in tests.
- Extend CI with a conditional preview smoke job that fetches the Vercel preview URL and exercises preview Playwright + contract suites.
- **Alternatives considered:** Continue relying on `vercel dev` for local runs. This was rejected because it keeps runtime parity but violates the spec’s requirement for framework-native dev servers and increases startup latency for agents. The hybrid adapter approach balances speed and parity with explicit escalation.

## Phases

### Phase 1 — Local API Adapter & Environment Baseline
**Goal:** Provide spec-compliant local dev servers with telemetry guardrails.

**Changes**
- Code: `apps/api/adapters/local/server.ts` — mount shared handlers on an Express/Fastify instance, expose `/health`, reuse request context helpers.
- Code: `apps/api/src/routes/health.ts` & `apps/api/src/index.ts` — add health handler and export a bootstrap used by local adapter.
- Code: `apps/api/package.json` — align scripts with `tsx watch` for local dev and add `test:contract:preview`.
- Config: `turbo.json` — ensure `dev` task passes through `PORT`, `HOST`, `TELEMETRY_MODE`, and preview env placeholders.
- Config: `.env.example` files (`apps/*/.env.example`) — document required vars, add `TELEMETRY_MODE=dev`.
- Code: `packages/telemetry/src/index.ts` — honor `TELEMETRY_MODE` (`dev|noop|prod`) without network side effects in dev/tests.
- Docs: `docs/engineering/ARCHITECTURE.md` & `docs/engineering/embed-dev.md` — describe the new adapter and telemetry toggle.

**Notes**
- Keep existing Vercel handlers untouched; local adapter should import the same route builders to avoid duplication.
- Ensure ports remain configurable but default to 3000/3001/4000 with `0.0.0.0` bindings to satisfy sandbox requirements.

**Success Criteria**  
**Automated**
- [x] Build/typecheck passes: `pnpm -w build`
- [x] Unit tests pass (telemetry & API modules): `pnpm -w test`
- [x] Lint passes: `pnpm -w lint`
- [x] Contract tests hit local adapter: `pnpm --filter @events-hub/api test:contract:local`
**Manual**
- [x] `pnpm --filter @events-hub/api dev` starts on port 4000 and `curl http://localhost:4000/health` returns `OK`
- [x] Admin and demo apps render locally against the new API endpoint without prompts
- [x] Telemetry emits `dev` or `noop` output locally with no external calls

---

### Phase 2 — Playwright, Parity, and Mocking
**Goal:** Split Playwright projects for local vs preview runs and add parity canaries/MSW fixtures.

**Changes**
- Code: `playwright.config.ts` — define `demo-hosts-local`, `admin-local`, `api-local`, and preview counterparts; wire `webServer` commands per spec.
- Code: `playwright/fixtures/parity.ts` & `playwright/projects/**/parity.canary.spec.ts` — implement header/status parity checks.
- Code: `playwright/mocks/handlers.ts` & `playwright/mocks/node.ts` — scaffold MSW handlers and server lifecycle hooks.
- Code: `apps/demo-host/lib/env.ts` & `apps/admin/lib/env.ts` (or equivalent) — expose `PREVIEW_URL` fallbacks and `NEXT_PUBLIC_API_URL` defaults for local tests.
- Tests: Tag runtime-coupled specs with preview-only markers and ensure local projects reuse MSW fixtures.
- Docs: `docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md` appendix note linking to actual Playwright paths.

**Notes**
- Preview projects must no-op when `PREVIEW_URL` is unset (skip with clear message) to keep local runs fast.
- Ensure Playwright report artifacts separate local vs preview runs for CI triage.

**Success Criteria**  
**Automated**
- [ ] Local Playwright suites pass: `pnpm playwright test --project=demo-hosts-local --project=admin-local`
- [ ] API parity/contract checks succeed locally: `pnpm --filter @events-hub/api test:contract:local`
- [ ] Preview suites run with injected URL: `PREVIEW_URL="https://example-preview" pnpm playwright test --project=demo-hosts-preview --project=admin-preview`
- [ ] Parity canary passes for critical routes: `PREVIEW_URL="https://example-preview" pnpm playwright test --project=demo-hosts-preview --grep parity`
**Manual**
- [ ] MSW handlers verified (toggle them off to confirm failures, then back on)
- [ ] Preview smoke confirms middleware/auth/ISR headers match expectation
- [ ] Playwright HTML reports capture traces for failing preview runs

---

### Phase 3 — CI Workflow & Runbook
**Goal:** Automate hybrid gating in CI and document the operational playbook.

**Changes**
- Config: `.github/workflows/e2e.yml` — add preview-smoke job gated by path/label rules, install Playwright deps, fetch Vercel preview URL, run preview suites.
- Scripts: `scripts/` (new or existing) — helper to detect runtime-coupled changes (e.g., path-based check) feeding CI condition.
- Docs: `docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md` DoD/Runbook sections updated with CI command references.
- Docs: `README.md` and `docs/engineering/ARCHITECTURE.md` — add quickstart for triggering preview smoke and interpreting artifacts.
- Observability: ensure CI uploads Playwright reports (`playwright-report`) for both jobs and reference them in runbook.

**Notes**
- Use GitHub Actions caching for pnpm; keep preview job optional but non-blocking when escalation criteria not met.
- Document fallback: rerun preview smoke manually using the recorded commands when automation is skipped.

**Success Criteria**  
**Automated**
- [ ] GitHub Actions local job green with new commands: `pnpm -w build`, `pnpm playwright test --project=demo-hosts-local --project=admin-local`, `pnpm --filter @events-hub/api test:contract:local`
- [ ] Preview job executes successfully when `PREVIEW_URL` provided, including contract + preview Playwright suites
- [ ] CI artifacts upload for both jobs (HTML report + traces)
**Manual**
- [ ] Runbook entry verified by following steps on a fresh clone
- [ ] Preview escalation trigger documented and tested on a sample PR
- [ ] Engineers can locate CI reports within 2 clicks from PR checks

---

## Testing Strategy
- Unit: expand telemetry mode tests to cover `dev|noop|prod`; add adapter bootstrap tests ensuring handlers mount and `/health` responds.
- Integration: Playwright local suites cover embed/admin flows with MSW mocks; preview suites exercise middleware/auth/ISR; parity canary compares headers/status for sensitive routes.
- Contract: Vitest-based contract tests hit both local adapter and preview URL to guarantee response shapes and caching headers.
- Observability: add structured logs for adapter startup and parity mismatches; emit metrics counters gated by `TELEMETRY_MODE`.

## Performance & Security
- Local adapter must reuse shared caching layers to avoid divergence; watch for increased cold-start time (<1s target) and memory footprint.
- Ensure preview smoke handles secrets securely (use GitHub secrets for Vercel tokens) and never logs tokens.
- Validate `TELEMETRY_MODE` defaults to `noop` in CI to prevent external calls.

## Migration & Rollback
- Migration: introduce local adapter alongside existing Vercel handlers; update scripts and docs once verified.
- Rollback: revert to previous `pnpm --filter @events-hub/api dev` command pointing at `vercel dev` and disable preview CI job via workflow dispatch if adapter issues emerge.
- Data: no schema changes; preview smoke jobs can be disabled without affecting production data.

## Risks & Mitigations
- Local adapter drift from Vercel handlers → Mitigate by importing shared routing modules and covering with contract tests.
- Preview URL availability flakiness → Cache last known preview URL in CI step and add retries/backoff.
- Increased CI time → Run preview smoke conditionally and keep suite limited to critical runtime-coupled specs.
- Telemetry misconfiguration → Default to `noop` when variable unset and add CI check ensuring mode is logged at startup.

## Timeline & Owners (optional)
- Phase 1 → 3-4 days, API platform owner
- Phase 2 → 3 days, QA/Frontend owner
- Phase 3 → 2 days, Dev Experience owner

## References
- Spec: `docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md`
- Research: `docs/research/2025-11-02-hybrid-dev-preview-research.md`
- Related code/docs: `apps/api/api/v1/compose.ts:1`, `packages/telemetry/src/index.ts:1`, `playwright/config.ts:1`
