# Plan Default Crash Remediation — Implementation Plan

## Overview
- Ensure every shared `@events-hub/*` package emits JavaScript so Vercel’s Node runtime can execute API handlers without `.ts` entrypoints.
- Align the workspace build pipeline so these packages compile before the API app and CI/preview deploys rerun with the new artifacts.

## Current State (from Research)
- Packages such as `@events-hub/page-schema` (`packages/page-schema/package.json:4-13`) expose `src/index.ts` as `main/module/exports`. The API imports these modules (`apps/api/src/http/plan-default.ts:1`), but Vercel’s serverless runtime cannot load TypeScript directly, yielding `Cannot find module '/var/task/.../src/index.ts'`.
- All shared packages follow the same stubbed pattern (no `dist/` output, `"build": "echo 'build stub'"`), so even fixing one package would fail on the next import.
- Local tooling (`tsx`, Next.js) hides the problem by transpiling on the fly; production lacks such runtime transpilation.

## Desired End State
- Each package under `packages/` compiles to CommonJS/ESM JavaScript in `dist/` with declaration files, and publishes only compiled artifacts.
- `pnpm -w build` (driven via `turbo.json`) builds libraries before applications so API deployments always bundle compiled modules.
- Preview/production deploys pass `/v1/plan/default` contract tests and expose Upstash-backed KV functionality without runtime crashes.

## Non-Goals
- Refactoring package internals or changing public APIs beyond pointing to compiled outputs.
- Replacing `@vercel/kv` with `@upstash/redis` (can be deferred).
- Altering application business logic or UI behavior outside build/publish plumbing.

## Architecture & Approach
- Introduce per-package TypeScript build configs (`tsconfig.build.json`) that output JS + `.d.ts` into `dist/`.
- Update package manifests to point `main/module/exports` at compiled files and limit published files to `dist`.
- Extend Turbo build graph so app builds depend on package builds (`"dependsOn": ["^build"]`) with `dist/**` declared as outputs, ensuring caching and ordering.
- Confirm Vercel build command runs `pnpm -w build` (or an equivalent script) so functions bundle the compiled code.
- Alternatives considered:
  - **Bundling with tsup/esbuild**: faster but adds tooling variance; TypeScript `tsc` is already available and straightforward.
  - **Relying on runtime transpilers (ts-node/tsx)**: not supported in Vercel’s production Lambda; rejected.

## Phases

### Phase 1 — Compile Shared Packages
**Goal:** Each `@events-hub/*` library produces `dist/` artifacts with JS + type definitions referenced in `package.json`.

**Changes**
- Code: `packages/*/tsconfig.build.json` — add new configs targeting `ES2019` (or repo standard), `outDir: dist`, `declaration: true`, `emitDeclarationOnly: false`.
- Code: `packages/*/package.json` — replace stubbed `"build"` scripts with `tsc -p tsconfig.build.json`; set `main`/`module`/`exports` to `./dist/index.js`, `types` to `./dist/index.d.ts`, and add `"files": ["dist"]`.
- Code: remove `node_modules` symlink assumptions (none needed once builds exist).

**Notes**
- Apply to all packages consumed by the API: `page-schema`, `router-helpers`, `ai-composer`, `ai-interpreter`, `data-providers`, `security`, `telemetry`, `block-registry`, `block-runtime`, `blocks`, `tokens`, `ui`, `embed-sdk`, etc. (audit `apps/api/package.json` and workspace usage to ensure completeness).
- Ensure tsconfig extends workspace base (e.g., `../../tsconfig.base.json`) for consistent compiler options.

**Success Criteria**  
**Automated**
- [x] Typecheck/build: `pnpm -w build` (now emits `dist/` for packages).
- [x] Unit tests: `pnpm -w test`.
- [x] Lint: `pnpm -w lint`.
**Manual**
- [x] Inspect `packages/page-schema/dist/` to confirm compiled JS + `.d.ts` exist.
- [x] Confirm `node_modules/@events-hub/page-schema/dist/index.js` resolves locally by running a simple `node -e "require('@events-hub/page-schema')"` without ts-node.

---

### Phase 2 — Integrate with Turbo & Deployment
**Goal:** Ensure builds run in the right order locally, in CI, and during Vercel deploys so the API packages always have compiled outputs.

**Changes**
- Config: `turbo.json` — for package build tasks, set `outputs: ["dist/**"]`; ensure app build tasks declare `"dependsOn": ["^build"]`.
- Config: root scripts (`package.json`) — optionally add a `prepare` or `build` alias if Vercel expects `pnpm build`.
- Infra: Vercel project (API) — set Build Command to `pnpm install --frozen-lockfile && pnpm -w build` (or confirm existing command already triggers Turbo builds).

**Notes**
- Verify CI workflow `.github/workflows/e2e.yml` uses `pnpm -w build` before tests; adjust if necessary so new build step runs in preview smoke job.

**Success Criteria**  
**Automated**
- [x] Turbo build cache reflects new `dist/**` outputs (`pnpm -w build` twice shows cache hits).
- [ ] CI preview job passes `pnpm --filter @events-hub/api test:contract:preview`.
- [ ] Preview smoke Playwright tests pass: `pnpm test:e2e:preview` and `pnpm test:parity`.
**Manual**
- [ ] Vercel build logs show package build steps executing before API bundling.
- [ ] `/v1/plan/default` endpoint on a preview deployment returns HTTP 200 with plan payload.

---

### Phase 3 — Verification & Rollout
**Goal:** Validate the fix through redeployments and monitor for regressions.

**Changes**
- Ops: Trigger new Preview deploy; once validated, promote to Production.
- Docs: Update `docs/engineering/embed-dev.md` (or relevant runbooks) with note that packages must be built before deployment.

**Success Criteria**  
**Automated**
- [ ] Contract tests: `pnpm --filter @events-hub/api test:contract:preview`.
- [ ] Smoke tests: `pnpm test:e2e:preview`.
**Manual**
- [ ] Curl preview base (`curl -s https://cs-eventhub-<preview>.vercel.app/v1/plan/default | jq`) shows valid JSON.
- [ ] Monitor logs in Vercel for 30 minutes—no `Cannot find module ... index.ts` errors.

## Testing Strategy
- **Unit:** Existing package tests still run via `pnpm -w test`; add focused tests if any build tooling adjustments require new behaviors (e.g., verify exported helpers behave the same).
- **Integration:** `apps/api/__tests__/default-plan.test.ts` ensures default plan flows remain intact against compiled modules.
- **E2E:** Preview smoke (Playwright) plus contract tests hitting `/api/v1/plan/default`.
- **Observability:** No new metrics needed; continue to rely on existing logging in `apps/api/src/http/plan-default.ts`.

## Performance & Security
- Compiled JS avoids runtime transpilation, reducing cold-start latency.
- No new secrets introduced; compiled artifacts live within repo-controlled packages.

## Migration & Rollback
- Migration is code-only. If issues arise, revert the package manifest + tsconfig changes; however, doing so reintroduces the 500 error. Keep an earlier commit ready for fast rollback.

## Risks & Mitigations
- **Risk:** Missed package still points to `src/` causing runtime crash. → **Mitigation:** Audit dependencies via `rg "@events-hub/" -n apps/api` to ensure every imported package builds to `dist`.
- **Risk:** Longer build times. → **Mitigation:** Use Turbo caching and restrict outputs to `dist/**`.
- **Risk:** Vercel build command not updated. → **Mitigation:** Verify command post-change and document steps in project settings.

## Timeline & Owners
- Phase 1: 1 day — Platform engineer.
- Phase 2: 0.5 day — Same engineer with DevOps support for Vercel settings.
- Phase 3: 0.5 day — QA/Platform validate and promote.

## References
- Research summary (chat): Plan Default Crash notes.
- Code: `apps/api/src/http/plan-default.ts`
- Package manifests: `packages/page-schema/package.json`, `packages/router-helpers/package.json`, etc.
