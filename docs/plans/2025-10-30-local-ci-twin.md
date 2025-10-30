# Local CI Twin — Implementation Plan

## Overview
- Establish a local, repo-native "CI twin" that mirrors GitHub CI gates so engineers and agents can run the exact checks before pushing.
- Reduces CI round-trips and flakes by enforcing a single entrypoint and a pre-push guard that fails fast.

## Current State (from Research)
- CI gates: `pnpm -w lint`, `pnpm -w build`, `pnpm -w test`, `pnpm -w check:bundles`, optional `check:a11y`, plus SBOM and provenance; Vercel PR previews for demo-host and API (`.github/workflows/ci.yml:1`).
- Local scripts exist and map to the same Turborepo pipeline (`package.json:6`, `turbo.json:3`).
- E2E tooling present: Playwright config and smoke tests under `tooling/tests/smoke/*.spec.ts` (`playwright.config.ts:1`, `tooling/config/playwright.config.ts:1`).
- Dev orchestration: `pnpm dev:stack` starts demo-host, API (Vercel dev), embed static server, and CDN (`package.json:10`).
- No committed git hook manager or dev container detected.
- Key files/modules:
  - `.github/workflows/ci.yml:1` — CI job definitions and gates
  - `package.json:6` — workspace scripts (`build/test/lint/check:*`)
  - `turbo.json:3` — pipeline and outputs
  - `tooling/config/playwright.config.ts:1` — Playwright config
  - `tooling/tests/smoke/*.spec.ts:1` — e2e smoke checks
  - `scripts/serve-embed.ts:1` — local static embed CDN

## Desired End State
- One local entrypoint that replicates CI gates: setup, check (lint+build+unit), bundles, a11y, and e2e smoke.
- A pre-push hook runs the entrypoint and blocks pushes on failure.
- Optional repeatable runner via a Dev Container matching CI (Node 18.19, pnpm 8.15.4, Playwright browsers).
- Acceptance checks
  - `make check` (or equivalent) succeeds locally on clean workspace.
  - `git push` is blocked when gates fail; allowed when green.

## Non-Goals
- Change CI semantics or Vercel workflows.
- Introduce remote caching, ChatOps, or knowledge-repo automation.
- Migrate Node version (CI currently uses Node 18.19.0).

## Architecture & Approach
- Single entrypoint via `Makefile` (no extra toolchain) that shells out to existing repo scripts.
- Add `pnpm` scripts for gaps (e.g., `e2e:local`) and keep names aligned with CI gates.
- Lightweight git hooks via committed `.githooks/pre-push` and `core.hooksPath=.githooks`.
- Optional `.devcontainer/` for parity; installs pnpm and Playwright browsers.
- Alternatives considered
  - Justfile/Taskfile: nice ergonomics but adds tools; rejected for zero-dependency setup.
  - Husky/lefthook: popular, but plain `core.hooksPath` avoids new dev deps; adopt later if desired.

## Phases

### Phase 1 — Single Entrypoint + Scripts
**Goal:** Add `Makefile` targets that mirror CI and a root `e2e:local` script.

**Changes**
- Code: `Makefile` — targets `setup-ci`, `check`, `lint`, `build`, `test`, `bundles`, `a11y`, `e2e` that call existing `pnpm -w` scripts.
- Code: `package.json` — add `e2e:local` script: start `dev:stack`, wait for endpoints, run Playwright with env (`SMOKE_*`, `EMBED_*`).
- Code: optionally add `scripts/wait-for.mjs` or use `pnpm dlx wait-on` for readiness.
- Docs: `README.md:28` and `CONTRIBUTING.md` — document `make check` and local e2e env vars.

**Notes**
- Map Playwright envs to local stack:
  - `SMOKE_DEMO_URL=http://demo.localhost:3000`
  - `SMOKE_API_URL=http://localhost:3000`
  - `EMBED_CDN_BASE_URL=http://localhost:5173`
  - `EMBED_MANIFEST_URL=http://localhost:5173/manifest.json`
- Ensure `/etc/hosts` has `127.0.0.1 demo.localhost` (see `apps/demo-host/README.md`).

**Success Criteria**  
**Automated**
- [ ] Build/typecheck passes: `pnpm -w build`
- [ ] Unit tests pass: `pnpm -w test`
- [ ] Lint/style passes: `pnpm -w lint`
- [ ] Bundle budgets pass: `pnpm -w check:bundles`
- [ ] A11y checks run: `pnpm -w check:a11y || true`
- [ ] E2E smoke runs locally: `pnpm -w e2e:local`
**Manual**
- [ ] `make check` runs all gates and returns 0.
- [ ] E2E verifies demo page loads and API fragment responds.
- [ ] Failures are visible and actionable locally.

---

### Phase 2 — Pre-push Guard
**Goal:** Block `git push` when local CI twin fails.

**Changes**
- Code: `.githooks/pre-push` — shell script that runs `make check` (or `pnpm -w ci && pnpm -w e2e:local`).
- Docs: `CONTRIBUTING.md` — add `git config core.hooksPath .githooks` and opt-out env `SKIP_LOCAL_CI=1`.

**Notes**
- Make hook resilient: print summary and exit nonzero on failure; skip when `SKIP_LOCAL_CI=1` or in CI (`CI=1`).

**Success Criteria**  
**Automated**
- [ ] Hook file is executable: `test -x .githooks/pre-push`
- [ ] Hook path configured: `git config --get core.hooksPath` outputs `.githooks`
**Manual**
- [ ] Intentionally break lint → `git push` is blocked with clear message.
- [ ] Set `SKIP_LOCAL_CI=1` → `git push` proceeds.

---

### Phase 3 — Runner Parity (Dev Container)
**Goal:** Reproducible local runs that match CI.

**Changes**
- Config: `.devcontainer/devcontainer.json` — Node 18 base; features to install pnpm 8.15.4.
- Config: `postCreateCommand` — `pnpm i --frozen-lockfile && npx playwright install --with-deps`.
- Docs: `docs/engineering/ARCHITECTURE.md:94` — mention devcontainer option.

**Notes**
- Keep Node version in sync with `.github/workflows/ci.yml:13`.

**Success Criteria**  
**Automated**
- [ ] Workspace opens and runs `make check` in container.
**Manual**
- [ ] Playwright browsers available; e2e runs headless in container.

---

### Phase 4 — Optional: `act` Workflow Parity
**Goal:** Allow running `.github/workflows/ci.yml` locally for PRs.

**Changes**
- Config: `.actrc` — map `ubuntu-latest` to a Node image with pnpm and Playwright deps.
- Docs: `docs/engineering/ARCHITECTURE.md` — `act` usage (`act pull_request -j setup`).

**Notes**
- Not all Actions features are supported; treat as a convenience, not a source of truth.

**Success Criteria**  
**Automated**
- [ ] `act -n -j setup` dry run parses workflow
**Manual**
- [ ] `act pull_request -j setup` runs core gates locally

## Testing Strategy
- Unit: continue `pnpm -w test`; ensure smoke tests for API fragment and demo page cover happy-paths (`tooling/tests/smoke/*.spec.ts`).
- E2E: env-driven Playwright runs against local stack; add `wait-on` guards; keep quick (≤2 min).
- Observability: print URLs and timing to stdout; retain traces on first retry (already in config).

## Performance & Security
- Budgets: preserve current bundle and a11y checks; keep e2e under 2 minutes.
- Security: no secrets in local env; SBOM/provenance remain CI-only.

## Migration & Rollback
- Hook can be disabled via `git config --unset core.hooksPath` or `SKIP_LOCAL_CI=1`.
- Makefile is additive; CI unaffected. Revert by removing `Makefile` and hook directory.

## Risks & Mitigations
- Playwright browsers missing → install via devcontainer or `npx playwright install`.
- `demo.localhost` DNS not present → add `/etc/hosts` entry (documented in `apps/demo-host/README.md`).
- Port conflicts on 3000/5173 → allow overriding via env and document.

## Timeline & Owners (optional)
- Phase 1: 0.5 day — Platform
- Phase 2: 0.25 day — Platform
- Phase 3: 0.5 day — Platform
- Phase 4 (optional): 0.5 day — Platform

## References
- Spec: `docs/pre_github_CI_Testing.md`
- Research: `docs/research/102925-local_ci_testing_research.md`
- Related:
  - `.github/workflows/ci.yml:1`
  - `package.json:6`
  - `turbo.json:3`
  - `tooling/config/playwright.config.ts:1`
  - `tooling/tests/smoke/demo.spec.ts:1`
  - `tooling/tests/smoke/api.spec.ts:1`
