# Hybrid Dev + Preview — Implementation Plan

## Overview
- Stand up the hybrid local/preview workflow defined in the spec so engineers and agents can iterate locally yet validate runtime-coupled behavior against Vercel previews before merging.
- Align scripts, adapters, and test suites so “Lane L” (local) stays fast while “Lane P” (preview) is production-faithful.

## Current State (from Research)
- `pnpm dev:stack` fans out to Next dev servers and runs the API through `vercel dev`, so there is no standalone TS/Express adapter yet (`package.json:6-18`, `apps/api/package.json:5-11`).
- Playwright uses a single Chromium project pointed at `./tests` without local-vs-preview separation or webServer automation (`tooling/config/playwright.config.ts:3-15`).
- Turborepo tasks exist but do not capture the hybrid env/port expectations or telemetry switches from the spec (`turbo.json:3-35`).
- Preview smoke automation and parity canaries are absent; CI only exercises local Vitest suites today.

## Desired End State
- Local lane spins up demo-host (3000), admin (3001), and the API (4000) via explicit scripts that require no prompts and share the same routing logic as production adapters.
- Preview lane triggers a tagged smoke suite (Playwright + contract tests) against the Vercel preview URL when runtime-coupled code changes, with parity checks on headers/auth/ISR.
- Telemetry mode is configurable (`dev|noop|prod`) so sandboxed runs never emit production traffic while still validating payload shapes.
- Acceptance checks: local lane dev servers start with host `0.0.0.0`; Playwright local suites pass; preview smoke passes when escalated; parity canary green; CI publishes Playwright reports.

## Non-Goals
- Building a full Vercel runtime emulator locally.
- Rewriting business logic inside shared packages (`packages/*`) beyond adapter-friendly exports.
- Introducing new product features beyond the hybrid workflow wiring.

## Architecture & Approach
- Extract shared API handler wiring into `apps/api/src/app.ts` (or equivalent) so both local Express and Vercel adapters mount the same routes.
- Create dual adapters: `apps/api/adapters/local/server.ts` (Express/Fastify) and `apps/api/adapters/vercel/handler.ts` delegating to the shared app.
- Standardize port/env handling and telemetry mode through `.env.local.example` files and configuration helpers.
- Expand Playwright configuration into project “families”: local projects auto-start dev servers; preview projects consume `PREVIEW_URL`; add tagged tests and parity fixtures.
- Introduce MSW setup for deterministic local E2E and a lightweight parity canary comparing local vs preview headers/cookies/stream responses.
- Update CI to gate builds with local suites and conditionally run preview smoke via Vercel preview URL retrieval.
- Alternatives considered: keep relying on `vercel dev` for local API parity; rejected because it is interactive and slower, and spec mandates a local TS adapter. Using separate repos for preview smoke was also considered but dismissed to keep everything in-monorepo with Turborepo coordination.

## Phases

### Phase 1 — Local Lane Foundation
**Goal:** Provide spec-compliant local dev servers, env conventions, and shared API wiring.

**Changes**
- Code: `apps/api/src/app.ts` — factor route composition into a reusable creator consumed by adapters.
- Code: `apps/api/adapters/local/server.ts` — implement Express/Fastify server exposing `/health` and mounting the shared app on port 4000/host 0.0.0.0.
- Code: `apps/api/adapters/vercel/handler.ts` — load the shared app into the existing Vercel function exports to keep parity.
- Code: `apps/api/package.json` — replace `vercel dev` scripts with adapter-aware `dev`/`start` commands and add `test:contract:local` placeholder that Phase 2 will fill.
- Code: `package.json` — update `dev:stack` (and add `dev:lane:local` alias if useful) to call the new API dev command; ensure filters set PORT env defaults.
- Config/Infra: `.env.local.example` files for `apps/demo-host`, `apps/admin`, `apps/api` documenting ports, `NEXT_PUBLIC_API_URL`, and `TELEMETRY_MODE`; add README/runbook snippets (`docs/dev/hybrid-lanes.md` or existing runbook).
- Config/Infra: `turbo.json` — enable env passthrough for ports/telemetry (via `globalEnv` or task-specific `env`).

**Notes**
- Keep adapters thin so production serverless entry points remain untouched.
- Ensure health check endpoint reused by Playwright `webServer` probes returns 200 quickly.
- Document telemetry defaults (`noop` for tests) to avoid noisy logs.

**Success Criteria**  
**Automated**
- [ ] Build/typecheck passes: `pnpm -w build`
- [ ] Repo lint baseline: `pnpm -w lint`
- [ ] API unit/contract placeholder: `pnpm --filter @events-hub/api test`
- [ ] Static analysis for configs: `pnpm -w test` (verifies shared packages still compile)
**Manual**
- [ ] `pnpm dev:stack` starts demo-host (3000), admin (3001), API (4000) without prompts.
- [ ] Hitting `http://localhost:4000/health` returns `OK`.
- [ ] Changing telemetry mode to `noop` suppresses external network calls locally.

---

### Phase 2 — Test Matrix & Parity Tooling
**Goal:** Establish local vs preview Playwright/contract suites, MSW fixtures, and parity canary per spec.

**Changes**
- Code: `playwright.config.ts` & `playwright/projects/**` — define local projects (demo-host, admin, api) with `webServer` commands and preview projects consuming `PREVIEW_URL`; tag preview-only specs with `@preview`.
- Code: `playwright/fixtures/parity.ts` & `playwright/projects/demo/parity.canary.spec.ts` — add parity helpers and smoke specs comparing headers/cookies/stream behaviour.
- Code: `playwright/mocks/{handlers.ts,node.ts}` — introduce MSW handlers and shared fixture setup for deterministic local runs.
- Code: `apps/api/package.json` — add `test:contract:local`/`test:contract:preview` scripts backed by new `vitest.contract.ts`.
- Code: `apps/api/vitest.contract.ts` & `playwright/projects/api/*.contract.ts` — implement HTTP contract assertions reusable across lanes.
- Config/Docs: Update `docs/dev/hybrid-lanes.md` (or spec appendix) with guidance on tagging tests and when to escalate to preview.

**Notes**
- Reuse existing `apps/api/api/**` handlers via HTTP requests in contract tests to avoid double wiring.
- Use Playwright report directory (`playwright-report/`) with `trace: on-first-retry` for triage parity with CI.
- Guard preview specs with `test.skip(!process.env.PREVIEW_URL, ...)` to keep local runs green.

**Success Criteria**  
**Automated**
- [ ] Local E2E suite: `pnpm playwright test --project=demo-hosts-local --project=admin-local`
- [ ] API contract (local): `pnpm --filter @events-hub/api test:contract:local`
- [ ] Parity canary (local vs preview placeholder) runs locally with `PREVIEW_URL=http://localhost:3000`: `PREVIEW_URL=http://localhost:3000 pnpm playwright test --project=demo-hosts-preview --grep @parity`
- [ ] Workspace regression suite still passes: `pnpm -w test`
**Manual**
- [ ] Preview-tagged specs are skipped without `PREVIEW_URL` and execute when it is provided.
- [ ] MSW mocks can be toggled off to hit real API when desired.
- [ ] Parity failure surfaces mismatched headers in report output.

---

### Phase 3 — Preview Automation & Telemetry Guardrails
**Goal:** Wire preview smoke into CI, surface telemetry mode, and finish runbooks/backouts.

**Changes**
- Config/Infra: `.github/workflows/e2e.yml` — add conditional job fetching Vercel preview URL and running preview smoke (Playwright preview projects + contract tests) with artifacts upload.
- Code: `package.json` — add scripts `test:e2e:local`, `test:e2e:preview`, and `test:parity` to wrap Phase 2 commands for CI reuse.
- Code: `apps/api/src/config/telemetry.ts` (or similar) — centralize `TELEMETRY_MODE` handling and ensure `dev` writes to stdout while `noop` validates payloads with no network calls.
- Docs: Update agent runbook (`docs/engineering/ARCHITECTURE.md` or new `docs/runbooks/hybrid-dev.md`) to explain escalation criteria, telemetry flags, and rollback procedure.
- Config: Provide `.env.example` values in each app referencing preview smoke needs (`PREVIEW_URL`, cookie secrets placeholders).

**Notes**
- Gate preview job via label/path filter to avoid unnecessary Vercel API calls.
- Ensure secrets (`VERCEL_TOKEN`, `VERCEL_TEAM_ID`, etc.) documented for CI admins.
- Capture failure artefacts (Playwright report, parity diff logs) for debugging.

**Success Criteria**  
**Automated**
- [ ] CI workflow syntax validated: `act -W .github/workflows/e2e.yml` (or `pnpm lint` if action linting available)
- [ ] Preview smoke command runs locally with mock URL: `PREVIEW_URL=http://localhost:3000 pnpm test:e2e:preview`
- [ ] Telemetry mode unit tests (new): `pnpm --filter @events-hub/api test --runInBand --type telemetry`
- [ ] Repository checks remain green: `pnpm -w ci`
**Manual**
- [ ] GitHub Actions run shows preview smoke artifacts on label-triggered PR.
- [ ] Telemetry `noop` mode verified via logs/metrics (no external calls).
- [ ] Rollback procedure documented (switch scripts back to `vercel dev` if needed).

---

## Testing Strategy
- Unit: add tests for telemetry mode switches, API app factory, and MSW handlers to ensure deterministic responses.
- Integration/E2E: Playwright local suites cover login flows, default plan editing, embed rendering; preview-tagged smoke covers middleware/auth/ISR routes and parity canary.
- Observability: log parity diff results, expose `/health` endpoint metrics, and ensure telemetry client routes through `noop` during tests.

## Performance & Security
- Keep local servers lightweight with caching disabled; monitor startup times (<3 s) and memory footprint.
- Ensure Preview smoke uses least-privileged Vercel tokens; document secret storage.
- Validate that telemetry `noop` mode redacts sensitive data and that preview smoke does not leak tokens in logs.

## Migration & Rollback
- Migration: land adapters/tests incrementally per phase; guard new scripts behind documentation updates.
- Rollback: retain `vercel dev` script under `dev:vercel` for emergencies, allowing teams to revert by switching aliases; disable preview job by toggling workflow condition.

## Risks & Mitigations
- Divergence between Express adapter and Vercel handlers → Mitigate by centralizing route composition in shared `createApp`.
- Longer CI times due to preview smoke → Mitigate with conditional triggers and parallel jobs.
- MSW/fixture drift causing false positives → Mitigate with periodic contract tests hitting real API and parity canary checks.
- Telemetry misconfiguration leaking data → Mitigate with defaults to `noop` in `.env.local.example` and tests covering mode switching.

## Timeline & Owners (optional)
- Phase 1: 2–3 days — Backend platform + DevEx.
- Phase 2: 3–4 days — QA automation + Frontend infra.
- Phase 3: 2 days — DevOps + Observability owners.

## References
- Spec: `docs/specs/2025-11-2-cs-eventhub-hybrid-deploy-spec.md`
- Research: `docs/research/2025-11-02-hybrid-dev-preview-research.md`
- Related code/docs: `package.json:6-18`, `apps/api/package.json:5-11`, `tooling/config/playwright.config.ts:3-15`, `turbo.json:3-35`
