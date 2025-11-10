# Events Hub CI & Local Testing Reference (2025-01-14)

## Repository & CI Survey

### Toolchains & Ecosystems
- Node.js 18.19.0 is the default runtime (.nvmrc) with pnpm 8.15.4 and Turbo 1.13 (`scripts/turbo-run.sh` enforces remote cache credentials). E2E workflows bump to Node 20 for newer Playwright binaries.
- Frontend apps (`apps/demo-host`, `apps/admin`) are Next.js 14.2 React apps that depend on workspace UI/tokens packages; builds are handled through Turbo and Next.
- The API (`apps/api`) is an Express/Vercel Functions project (tsx-driven local adapter) that shares TypeScript utilities from `packages/*` (telemetry, router helpers, AI packages, etc.).
- The embed SDK (`packages/embed-sdk`) ships a Preact widget bundled by tsup + tsc and deployed through the CDN app plus `scripts/publish-embed.ts`.
- Testing tooling: Vitest 1.5 (unit), Playwright 1.45 (e2e, parity, smoke), custom contract tests (`apps/api/vitest.contract.ts`), and Turbo tasks `check:a11y`, `check:bundles`, `security:*` implemented in `tooling/scripts/*`.

### Workflow Overview
| Workflow (file) | Triggers | Jobs / OS / Env | Commands & artifacts |
| --- | --- | --- | --- |
| CI (`.github/workflows/ci.yml`) | push to `main`, all PRs | `setup` on `ubuntu-latest`, Node 18.19, pnpm 8.15 (cache). `vercel-preview` + comment jobs reuse ubuntu. | `pnpm install --frozen-lockfile`, `pnpm -w lint`, `build`, `test`, `check:bundles`, `check:a11y \|\| true`, `security:sbom`, `security:provenance`. Vercel preview job re-installs deps, builds, and runs `pnpm dlx vercel pull/build/deploy` for `apps/demo-host` & `apps/api`, writing URLs to the PR.
| E2E (`.github/workflows/e2e.yml`) | push to `main`/`trunk`, all PRs | `local` job on ubuntu, Node 20, pnpm 8.15. `preview-smoke` job requires PR title/body hints and Vercel secrets. | Shared steps: `pnpm install --frozen-lockfile`, `pnpm exec playwright install --with-deps`, `pnpm -w build`. Local suite runs `pnpm test:e2e:local`, `pnpm --filter @events-hub/api test:contract:local`, and `pnpm --filter @events-hub/api test -- --runInBand --type telemetry` then uploads `playwright-report`. Preview suite fetches preview URLs via `node scripts/get-vercel-preview-url.mjs`, then runs `pnpm --filter @events-hub/api test:contract:preview`, `pnpm test:e2e:preview`, and `pnpm test:parity` with bypass headers.
| Promote demo & API (`deploy-demo-and-api.yml`) | Manual (`workflow_dispatch`) with env inputs | ubuntu, Node 18.19, pnpm 8.15, Playwright browsers installed | Verifies alias targets, promotes Vercel preview URLs to beta/prod via `pnpm dlx vercel alias set`, runs smoke tests `pnpm exec playwright test tooling/tests/smoke` against promoted URLs, and summarizes aliases.
| Publish embed canary (`publish-canary.yml`) | push to `main` | ubuntu, Node 18.19, pnpm 8.15 | Builds embed SDK (`pnpm --filter @events-hub/embed-sdk build`), runs `pnpm tsx scripts/publish-embed.ts` with canary args, generates SBOM/provenance (`pnpm -w security:*`), deploys CDN assets from `apps/cdn` via `pnpm dlx vercel pull/build/deploy`, and uploads provenance artifacts.
| Publish embed release (`publish-embed.yml`) | tag `embed-sdk@*` | ubuntu, Node 18.19, pnpm 8.15 | Validates tag vs package version, builds SDK, publishes immutable assets + manifests, runs SBOM/provenance, deploys CDN, installs Playwright Chromium, and executes `pnpm exec playwright test tooling/tests/smoke/embed.spec.ts` before updating the minor manifest alias.
| Refresh pnpm lockfile (`lockfile-refresh.yml`) | manual input or PR label `refresh-lockfile` | ubuntu, Node 18.19 | Checks out target ref, runs `pnpm install --lockfile-only`, and commits `pnpm-lock.yaml` via `git-auto-commit`.
| CodeQL (`codeql.yml` + `reusable-codeql.yml`) | push to `main`, PRs, weekly cron | ubuntu, GitHub CodeQL JS config `tooling/config/codeql.yml` | Standard checkout, `github/codeql-action` init/autobuild/analyze for JavaScript/TypeScript in `apps` and `packages`.
| Release Drafter (`release-drafter.yml`) | push to `main`, manual | ubuntu | Runs `release-drafter/release-drafter@v6` using repo config to update draft notes.

## Local Command & Script Map

### Workspace-level pnpm scripts
| Command | Purpose & scope | Details |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | Install dependencies exactly as CI | Use Node 18.19 (`nvm use`), pnpm 8.15.4 (via Corepack), and the bundled `.pnpm-store` cache. Fails if `pnpm-lock.yaml` is stale. |
| `pnpm -w lint` | ESLint over all workspaces | Runs through Turbo via `scripts/turbo-run.sh`; respects `tooling/config/eslint.config.mjs`. Requires `TURBO_TOKEN` unless `TURBO_ALLOW_MISSING_TOKEN=1`. |
| `pnpm -w build` | Type-check/build every package/app | Turbo triggers Next builds, tsup bundles, `tsc` for libs. Writes to `.next`, `dist`, `.ladle-story`. |
| `pnpm -w test` | Vitest suites workspace-wide | Uses `scripts/run-vitest.mjs` to forward args, apply `--passWithNoTests`, and optionally `--runInBand`. |
| `pnpm -w check:bundles` / `check:a11y` | Placeholder bundle + accessibility checks | Currently both call `tooling/scripts/bundle-check.mjs` (generates `bundle-reports/budget.json` with stub data). `check:a11y` is non-blocking in CI (`|| true`). |
| `pnpm -w security:sbom` / `security:provenance` | Supply-chain artifacts | Run `tooling/scripts/sbom.mjs` and `tooling/scripts/provenance.mjs` to write stub files (`.sbom/`, `provenance/`). |
| `pnpm dev` | Turbo-powered parallel dev tasks | `./scripts/turbo-run.sh run dev --parallel`; each package defines its own `dev` script. |
| `pnpm dev:stack` | Full stack preview | Launches demo host, admin, API, embed watcher, and CDN (`scripts/serve-embed.ts`) via `concurrently`. Ports 3000/3001/4000/5173 must be free. |
| `pnpm dev:cdn` | Serve embed dist locally | Uses `scripts/serve-embed.ts` to host `packages/embed-sdk/dist` with permissive CORS. Requires a prior SDK build. |
| `pnpm e2e:serve*` | Manually start specific dev servers | `e2e:serve` runs demo/admin/api in parallel with polling env vars for file watchers. |
| `pnpm test:e2e:local` | One-command local Playwright run | `scripts/run-e2e.mjs local` installs browsers, boots servers, waits for health checks, and executes Playwright projects `demo-hosts-local`, `admin-local`, `api-local`. |
| `pnpm test:e2e:preview` | Preview Playwright smoke | Runs Playwright with `--project demo-hosts-preview admin-preview api-preview --grep @preview`. Requires `PREVIEW_*` URLs and (optionally) Vercel protection bypass headers. |
| `pnpm test:parity` | Header parity regression | Executes `playwright/projects/demo/parity.canary.spec.ts` comparing preview vs baseline API headers. Needs `PREVIEW_URL` plus optional `VERCEL_PROTECTION_*`. |
| `pnpm publish:embed` | Local embed manifest build | Thin wrapper over `scripts/publish-embed.ts`; used by CDN build + release workflows. |

### Package-specific targets
| Package / path | Key scripts | Notes |
| --- | --- | --- |
| `apps/demo-host` | `dev`, `build`, `start`, `lint`, `test` | Next.js app; `build` also ensures embed SDK built. Tests inherit root Vitest config. |
| `apps/admin` | `dev`, `build`, `start`, `lint`, `test` | Similar Next app. |
| `apps/api` | `dev` (tsx watcher for adapters/local/server.ts), `test` (Vitest via `scripts/run-vitest.mjs`), `test:contract:local`/`preview` (driven by `scripts/run-e2e.mjs` or Vitest contract config), `seed:default-plan` | Contract tests live under `playwright/projects/api/*.contract.ts`; preview variant requires `PREVIEW_URL`. `test -- --runInBand --type telemetry` sets `VITEST_TEST_TYPE=telemetry` to limit suites. |
| `apps/cdn` | `dev` (`vercel dev`), `build` | `build` chains `pnpm --filter @events-hub/embed-sdk build` and a root `publish:embed`. |
| `packages/embed-sdk` | `build`, `build:deps`, `dev`, `lint`, `test` | `build:deps` ensures router helpers/page schema/telemetry built first. `dev` runs `tsup --watch` for rapid embed iteration. |
| `tooling` | `check:a11y`, `check:bundles`, `security:*` | Stubs currently but hold the interface CI expects. |

### Helper scripts & prerequisites
- `scripts/turbo-run.sh`: wraps Turbo commands, loading `.env.turbo[.local]`, `TURBO_TOKEN`, `TURBO_TEAM`, and setting a CA bundle for non-macOS hosts. Without credentials you must set `TURBO_ALLOW_MISSING_TOKEN=1` (will disable remote caching).
- `scripts/run-vitest.mjs`: ensures `vitest run --config vitest.config.ts --passWithNoTests`, supports `--runInBand` (maps to `--maxWorkers 1`) and `--type <tag>` (sets `VITEST_TEST_TYPE`).
- `scripts/run-e2e.mjs`: orchestrates local servers + Playwright runs (`local` and `api-contract` scenarios) with process cleanup and readiness probes.
- `scripts/get-vercel-preview-url.mjs`: requires `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID` to fetch the READY preview deployment URL matching the current PR head SHA. Used by preview smoke workflow; can run locally for manual verification.
- `scripts/publish-embed.ts`: copies `packages/embed-sdk/dist` into `apps/cdn/public/<subpath>`, computes SHA-384 integrities, and emits manifests/aliases. Requires a prior SDK build; used by both canary and release workflows.
- `scripts/serve-embed.ts`: tiny HTTP server with permissive CORS hosting `packages/embed-sdk/dist` on `http://localhost:5173` for local demo/admin testing.
- `tooling/scripts/bundle-check.mjs`, `sbom.mjs`, `provenance.mjs`: stub generators for bundle budgets, SBOM, and provenance artifacts (write to `bundle-reports/`, `.sbom/`, `provenance/`).
- `tooling/tests/smoke/*.spec.ts`: Playwright smoke suites for demo/api/embed used after promotions and embed releases; expect `SMOKE_*` and `EMBED_*` env vars.
- `dev/docker-compose.yml`: optional local stack (ClickHouse, Metabase, MSW edge proxy) for analytics validation. Bring up with `docker compose -f dev/docker-compose.yml up` when working on telemetry/observability.
- External prerequisites: Vercel CLI (`pnpm dlx vercel ...`), `jq` (used in workflows but fallback Python logic exists), Playwright system dependencies (install via `pnpm exec playwright install --with-deps` on Linux), and workspace secrets for preview smoke (`VERCEL_PROTECTION_BYPASS*`).

## Local Testing Matrix
| Target | Scope | Command | Runtime / Notes |
| --- | --- | --- | --- |
| Lint | ESLint for every package/app | `pnpm -w lint` | ~1–2 min. Requires Turbo token unless unset via `TURBO_ALLOW_MISSING_TOKEN=1`. |
| Type check & builds | Next builds, tsup bundles, tsc | `pnpm -w build` | 2–4 min cold. Produces `.next/`, `dist/`. Needed before Playwright (`pnpm test:e2e:*`). |
| Unit tests | Vitest suites across workspace | `pnpm -w test` | 1–2 min. Honors `VITEST_TEST_TYPE` if passed through `scripts/run-vitest.mjs`. |
| Bundle budgets | Stubbed size budget | `pnpm -w check:bundles` | <5 s, writes `bundle-reports/budget.json`. Replace stub when real budgets exist. |
| Accessibility budgets | Placeholder (same script) | `pnpm -w check:a11y` | Currently always passes and is ignored in CI (`|| true`). Should still run locally to mirror CI log output. |
| SBOM & provenance | Supply chain metadata | `pnpm -w security:sbom && pnpm -w security:provenance` | <5 s each, emit `.sbom/` and `provenance/` dirs that CI uploads. |
| Local E2E UI/API | Playwright against local dev servers | `pnpm test:e2e:local` | 5–7 min first run (installs browsers), ~3–4 min warm. Spawns demo/admin/API servers automatically. Artifacts: `playwright-report/`. |
| API contract (local) | Validates API contracts via Playwright/Vitest | `pnpm --filter @events-hub/api test:contract:local` | 2–3 min. Spins API server inside script; surfaces contract regressions early. |
| Telemetry-only unit run | Serial Vitest subset | `pnpm --filter @events-hub/api test -- --runInBand --type telemetry` | <1 min; ensures telemetry helpers pass when executed serially, catches timing-sensitive flakes. |
| Preview E2E | Playwright vs latest Vercel previews | `pnpm test:e2e:preview` | 4–6 min depending on latency. Requires `PREVIEW_URL` (or `PREVIEW_{DEMO,ADMIN,API}_URL`) plus optional `VERCEL_PROTECTION_BYPASS*`. |
| API contract (preview) | Contract suite targeting preview API | `pnpm --filter @events-hub/api test:contract:preview` | 1–2 min. Needs `PREVIEW_URL` + bypass headers. |
| Parity check | Compares preview vs baseline headers | `pnpm test:parity` | ~1 min. Needs `PREVIEW_URL` and optionally `PARITY_BASELINE_API_URL` (defaults to prod). |
| Smoke tests (post-promo) | Validates promoted URLs / CDN | `pnpm exec playwright test tooling/tests/smoke` | 2–3 min if envs `SMOKE_DEMO_URL`, `SMOKE_API_URL`, etc. For embed release use `tooling/tests/smoke/embed.spec.ts` with `EMBED_*` envs. |
| Embed SDK build | Build + manifest | `pnpm --filter @events-hub/embed-sdk build && pnpm publish:embed` | 1–2 min; required before CDN deployments and when testing embed locally via `pnpm dev:cdn`. |

## Gap Analysis & Best Practices
- **Accessibility and bundle checks are stubs**: both `pnpm -w check:a11y` and `check:bundles` call the same placeholder script and CI ignores `check:a11y` failures. This hides regressions; replace the stub with real axe/lighthouse runs and remove `|| true` once green.
- **SBOM/provenance are fake artifacts**: the scripts in `tooling/scripts/{sbom,provenance}.mjs` only stamp JSON snippets. Production pipelines should swap in real generators (e.g., Anchore Syft, `npm audit signatures` or SLSA provenance tooling).
- **Preview smoke only runs opt-in**: `.github/workflows/e2e.yml` executes preview tests only when the PR title/body contains `preview`. Contributors may forget, leaving Vercel-only issues undetected on most PRs. Encourage labeling or automate detection for code touching previewed apps.
- **README quickstart omits lint/check/security/e2e tasks**: new contributors may only run `pnpm -w build` and `pnpm -w test`. Add the rest (lint, `check:*`, `security:*`, `test:e2e:local`) to the contributor checklist to match CI.
- **Turbo token friction**: `scripts/turbo-run.sh` exits unless `TURBO_TOKEN` is configured. Document the `TURBO_ALLOW_MISSING_TOKEN=1` escape hatch more prominently (or set it in `.env.turbo.example`) so agents inside sandboxes can run tasks without cached builds.
- **Playwright dependencies**: local preview/e2e commands (`pnpm test:e2e:preview`, parity, smoke) do not auto-install browsers the way `scripts/run-e2e.mjs` does. Run `pnpm exec playwright install --with-deps` once on every machine to avoid missing-browser failures.
- **apps/api README drift**: the README still references `vercel dev` even though `package.json` runs `tsx watch adapters/local/server.ts`. Clarify which command is canonical for local work.

## Agent-Facing Spec

### Setup & Happy Path
1. `nvm use 18.19.0` (or install Node 18.19) and `corepack enable pnpm` so `pnpm@8.15.4` is used. (~1 min)
2. Copy `.env.turbo.example` to `.env.turbo` (or `.env.turbo.local`) and fill in `TURBO_TOKEN`/`TURBO_TEAM`. In sandboxes without credentials, export `TURBO_ALLOW_MISSING_TOKEN=1`. (<1 min)
3. `pnpm install --frozen-lockfile`. (~2–3 min cold)
4. Install Playwright browsers once: `pnpm exec playwright install --with-deps` (adds ~1–2 min, required for preview/parity/smoke suites and for `pnpm test:e2e:preview`).
5. When working on telemetry or smoke tests, ensure required services/secrets exist (e.g., `docker compose -f dev/docker-compose.yml up` for ClickHouse, populate `SMOKE_*` envs, export `VERCEL_PROTECTION_BYPASS*`).

### Mandatory checks before marking a task complete
- Always run `pnpm -w lint`, `pnpm -w build`, `pnpm -w test`, `pnpm -w check:bundles`, `pnpm -w check:a11y`, `pnpm -w security:sbom`, `pnpm -w security:provenance`. These mirror the blocking CI steps (even if `check:a11y` currently logs only).
- Run `pnpm test:e2e:local` for any change touching UI flows, routing, or API schemas referenced by the frontends. Capture the HTML report under `playwright-report/index.html` if failures occur.
- Backend/API changes require `pnpm --filter @events-hub/api test:contract:local` and the telemetry-specific run `pnpm --filter @events-hub/api test -- --runInBand --type telemetry` to match the CI e2e workflow.
- Embed SDK or CDN-facing work must rerun `pnpm --filter @events-hub/embed-sdk build`, `pnpm publish:embed`, and (optionally) `pnpm exec playwright test tooling/tests/smoke/embed.spec.ts` before requesting review.
- For features that will be validated via preview review apps (anything in `apps/demo-host`, `apps/admin`, `apps/api` touching runtime behavior), set `preview:` in the PR description and run the preview suites locally (`pnpm test:e2e:preview`, `pnpm --filter @events-hub/api test:contract:preview`, `pnpm test:parity`).

### Quick feedback loops / module-specific shortcuts
- Use `pnpm --filter <pkg> dev` for Next apps or embed SDK to get hot reload without running the whole stack.
- You can run a single Playwright project locally by first starting servers (`pnpm e2e:serve`) and then invoking `pnpm playwright test --project=demo-hosts-local --grep <tag>`.
- For Vitest, leverage `pnpm --filter <pkg> test -- --runInBand --watch` to scope to a package (the root `pnpm -w test` will still run before commit).
- API contract tests can run in isolation via `pnpm --filter @events-hub/api vitest run --config apps/api/vitest.contract.ts --reporter=dot` if you already have a running API server (set `PREVIEW_URL=http://localhost:4000`).

### Adding new tests
- **Unit tests**: place them under `apps/**/__tests__` or `packages/**/__tests__` with `.test.ts[x]` suffixes so `tooling/config/vitest.config.ts` picks them up.
- **Contract tests**: add files under `playwright/projects/api/**/*.contract.ts` and include `@preview` tags when they should run against remote deployments. Keep paths consistent so `vitest.contract.ts` includes them.
- **Playwright suites**: new UI specs belong under `playwright/projects/{demo,admin,api}`; use `@preview` for tests that should only run with preview URLs and `@parity` for parity checks. Remember to update `pnpm test:e2e:*` documentation when adding tags.
- **Smoke tests**: append to `tooling/tests/smoke` for deployment coverage (demo, API, embed). These run in the promotion/publish workflows, so keep them deterministic and driven by env vars.

### Reporting expectations
- Surface failures with the command, file path, and artifact location. Example: “`pnpm test:e2e:local` failed, see `playwright-report/index.html` and failing spec `playwright/projects/admin/onboarding.spec.ts`.”
- For contract and telemetry runs, paste the Vitest failure excerpt (stack trace + file). Highlight whether rerunning with `--runInBand` changes behavior.
- Attach SBOM/provenance blobs (`.sbom/sbom.json`, `provenance/attestation.json`) if reviewers need to inspect them; these are also what CI uploads.
- When preview tests fail due to missing URLs or protection bypass tokens, call out the missing env var so maintainers can supply it.

### Optional enhancements / reliability boosts
- Replace the bundle/accessibility stub with real bundle size analysis (e.g., `next build --analyze`) and axe or Pa11y sweeps; once solid, remove the `|| true` safety net in CI.
- Swap in real SBOM/provenance tooling (Syft, CycloneDX for pnpm, SLSA generators) so published artifacts carry meaningful metadata.
- Automate preview smoke opt-in by detecting changes under `apps/` or a repo label instead of title/body text, ensuring preview e2e suites run on every relevant PR.
- Add junit reporters (`vitest --reporter=junit`, Playwright `--reporter=junit`) so CI artifacts can be ingested by dashboards and local reruns can diff results quickly.

## Action Items (prioritized)
1. **Implement real `check:a11y` / `check:bundles` tasks** and make the CI step blocking (drop `|| true`). This closes the biggest coverage gap between local runs and production expectations.
2. **Integrate authentic SBOM/provenance tooling** in `tooling/scripts/*` and ensure the CI artifacts align with security/compliance needs.
3. **Broaden preview smoke triggers** (label-based or path-based) so `pnpm test:e2e:preview`, parity, and preview contract tests run on all PRs that touch deployable surfaces.
4. **Document & template the local happy path** in `README`/`CONTRIBUTING` so lint/check/security/e2e steps become part of the default workflow.
5. **Update `apps/api` docs and scripts** to clarify whether `tsx watch adapters/local/server.ts` or `vercel dev` is authoritative, and ensure both paths stay in sync.

## Open Questions / Assumptions
- Where should contributors source `TURBO_TOKEN`? If the token cannot be shared, should `TURBO_ALLOW_MISSING_TOKEN=1` be the documented default for forks?
- What preview baseline should parity tests use when `https://cs-eventhub-api.vercel.app` is unavailable? Define a fallback or local baseline to avoid skipped coverage.
- Do Playwright preview tests require scoped Vercel protection bypass tokens per app (`DEMO`, `ADMIN`, `API`), or is the global token sufficient? Clarify in secrets docs so agents know which env vars to request.
- Should smoke tests (`tooling/tests/smoke`) ever run automatically after merges to `main` (currently only manual promotion/release workflows trigger them)?
- Is the stubbed SBOM/provenance approach acceptable for pre-seed work, or do we need to prioritize real tooling before onboarding external contributors?
