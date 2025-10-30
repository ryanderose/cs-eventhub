# Current CI and Local Parity Map

- **title:** "Current CI and Local Parity Map"
- **date:** "2025-10-29 17:15"
- **researcher:** "ChatGPT Codex 5"
- **question:** "Map current CI checks, local scripts, monorepo structure, and how they interact; identify where CI steps live and their local equivalents."
- **scope:** "GitHub Actions workflows, root/package scripts, Turborepo pipeline, app/package entry points, dev/docker, testing/observability configs, envs"
- **assumptions:** ["Focuses on present state; no change proposals", "Treats 'Local CI twin' as a mapping lens only"]
- **repository:** "ryanderose/cs-eventhub"
- **branch:** "master"
- **commit_sha:** "aaa8441"
- **status:** "complete"
- **last_updated:** "2025-10-29"
- **last_updated_by:** "ChatGPT Codex 5"
- **directories_examined:** ["apps/", "packages/", "tooling/", ".github/workflows/", "docs/", "dev/"]
- **tags:** ["research", "codebase", "ci", "monorepo", "turborepo", "nextjs", "vercel"]

---

## Planning Hand‑off (TL;DR)

- CI runs pnpm workspace gates (lint, build, test, bundle, optional a11y) plus SBOM/provenance and Vercel PR previews (`.github/workflows/ci.yml:1–26,28–125`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/ci.yml#L1-L26](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/ci.yml#L1-L26)
    
- Local equivalents exist via root scripts and Turborepo pipeline (`pnpm -w build|test|lint`, `turbo.json`) (`package.json:6–18`, `turbo.json:4–13`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/package.json#L6-L18](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/package.json#L6-L18)
    
- Monorepo layout (apps: admin, demo-host, api, cdn; packages:*; tooling) with shared testing/config; API exposes Vercel Edge/Node routes and rewrites (`docs/engineering/ARCHITECTURE.md:8–36`; `apps/api/vercel.json:11–21`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/vercel.json#L11-L21](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/vercel.json#L11-L21)
    

## Research Question (from spec)

Document where CI steps live and what they run, how local scripts map to those checks, what the workspace structure is, and how app/API components connect and route.

## System Overview (what exists today)

- Turborepo + pnpm monorepo with apps (Next.js admin and demo-host; Vercel API; CDN stub) and multiple packages (SDK, schema, interpreter/composer, data providers, etc.) (`docs/engineering/ARCHITECTURE.md:8–31`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/docs/engineering/ARCHITECTURE.md#L8-L31](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/docs/engineering/ARCHITECTURE.md#L8-L31)
    
- CI gates across build/test/lint/bundle/a11y/security plus CodeQL; PRs also trigger Vercel preview deployments for demo-host and API (`.github/workflows/ci.yml:1–26,28–125,127–171`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/ci.yml#L1-L26](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/ci.yml#L1-L26)
    
- Local scripts call the same Turborepo tasks; shared testing configs for Vitest and Playwright (`package.json:6–18`; `tooling/config/vitest.config.ts:4–14`; `tooling/config/playwright.config.ts:3–16`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/package.json#L6-L18](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/package.json#L6-L18)
    

## Detailed Findings

### Docs & Decisions

- Root CI gates enumerated (`README.md:28–40`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/README.md#L28-L40](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/README.md#L28-L40)
    
- Architecture/topology and enforced gates (`docs/engineering/ARCHITECTURE.md:94–108`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/docs/engineering/ARCHITECTURE.md#L94-L108](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/docs/engineering/ARCHITECTURE.md#L94-L108)
    
- Local “pre‑GitHub CI testing” rationale in docs (`docs/pre_github_CI_Testing.md:1–40`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/docs/pre_github_CI_Testing.md#L1](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/docs/pre_github_CI_Testing.md#L1)
    

### Domain & Data

- PageDoc/Block schemas and plan hashing (`packages/page-schema/src/index.ts:297–309,355–366`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/page-schema/src/index.ts#L297-L309](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/page-schema/src/index.ts#L297-L309)
    
- Provider client (CitySpark) with quota, cache, breaker (`packages/data-providers/src/index.ts:87–107,140–171,196–226`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/data-providers/src/index.ts#L140-L171](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/data-providers/src/index.ts#L140-L171)
    

### Entry Points & Routing

- API rewrites and headers (`apps/api/vercel.json:11–21,23–41`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/vercel.json#L11-L21](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/vercel.json#L11-L21)
    
- API routes:
    
    - **POST** `/v1/interpret` (Node) (`apps/api/api/v1/interpret.ts:5–20`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/api/v1/interpret.ts#L5-L20](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/api/v1/interpret.ts#L5-L20)
        
    - **POST** `/v1/compose` with caching and plan inlining (`apps/api/api/v1/compose.ts:11–27,167–218`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/api/v1/compose.ts#L11-L27](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/api/v1/compose.ts#L11-L27)
        
    - **GET** `/v1/fragment` (Edge) with CSP and cache headers (`apps/api/api/v1/fragment.ts:1–9,48–59`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/api/v1/fragment.ts#L1-L9](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/api/v1/fragment.ts#L1-L9)
        
    - **GET** `/v1/plan/:id` (plan short‑id resolution) (`apps/api/api/v1/plan/[id].ts:4–27`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/api/v1/plan/%5Bid%5D.ts#L4-L27](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/api/v1/plan/%5Bid%5D.ts#L4-L27)
        
- Demo host Next route that proxies fragment and computes CSS hash (`apps/demo-host/app/(seo)/fragment/[tenant]/route.ts:29–37,55–73`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/demo-host/app/%28seo%29/fragment/%5Btenant%5D/route.ts#L29-L37](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/demo-host/app/%28seo%29/fragment/%5Btenant%5D/route.ts#L29-L37)
    

### Core Logic

- **Interpreter:** tokenize query → DSL (`packages/ai-interpreter/src/index.ts:93–118,160–170`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/ai-interpreter/src/index.ts#L160-L170](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/ai-interpreter/src/index.ts#L160-L170)
    
- **Composer:** provider fan‑out → PageDoc assembly → `planHash` (`packages/ai-composer/src/index.ts:1–22,181–203,205–218`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/ai-composer/src/index.ts#L181-L203](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/ai-composer/src/index.ts#L181-L203)
    
- **Plan encoding/decoding:** zstd/brotli/plain with base64url (`packages/router-helpers/src/index.ts:105–119,121–141`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/router-helpers/src/index.ts#L105-L119](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/router-helpers/src/index.ts#L105-L119)
    
- **API plan persistence/caching** (`apps/api/src/lib/plan.ts:33–51,61–79,87–101`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/src/lib/plan.ts#L33-L51](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/src/lib/plan.ts#L33-L51)
    
- **Embed SDK:** `create(container, tenantId, initialPlan, theme)` and hydration/events (`packages/embed-sdk/src/index.ts:1–17,105–119,195–206`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/embed-sdk/src/index.ts#L105-L119](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/packages/embed-sdk/src/index.ts#L105-L119)
    

### Integrations

- Vercel KV optional persistence (`apps/api/src/lib/plan.ts:11–21,65–79`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/src/lib/plan.ts#L11-L21](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/src/lib/plan.ts#L11-L21)
    
- Vercel preview deployments on PRs (CI workflow) (`ci.yml:28–125`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/ci.yml#L28-L125](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/ci.yml#L28-L125)
    
- CDN headers shaping for embed assets (`apps/cdn/vercel.json:5–18`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/cdn/vercel.json#L5-L18](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/cdn/vercel.json#L5-L18)
    

### Configuration & Secrets

- CI toolchain versions: Node 18.19.0, pnpm 8.15.4 (`ci.yml:15–18,12–14`); local `.nvmrc` 18.19.0 (`.nvmrc:1`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.nvmrc#L1](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.nvmrc#L1)
    
- API envs (`apps/api/.env.example:1–20,24–40`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/.env.example#L1](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/.env.example#L1)
    
- Demo/admin envs (`apps/demo-host/.env.example`, `apps/admin/.env.example`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/demo-host/.env.example#L1](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/demo-host/.env.example#L1)
    

### Tests & Observability

- Vitest config (root + app) (`tooling/config/vitest.config.ts:4–14`; `apps/demo-host/vitest.config.ts:1`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/tooling/config/vitest.config.ts#L4-L14](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/tooling/config/vitest.config.ts#L4-L14)
    
- Playwright config + smoke tests (`tooling/config/playwright.config.ts:3–16`; `tooling/tests/smoke/*.spec.ts`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/tooling/config/playwright.config.ts#L3-L16](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/tooling/config/playwright.config.ts#L3-L16)
    
- CodeQL reusable workflow (`codeql.yml:1–9`; `reusable-codeql.yml:7–16`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/codeql.yml#L1-L9](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/codeql.yml#L1-L9)
    

### API/UI Surface (as applicable)

- API endpoints: interpret, compose, fragment, plan (`apps/api/api/v1/*`) — links above
    
- Demo host page bootstraps embed (`apps/demo-host/app/page.tsx:105–115,155–168`) — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/demo-host/app/page.tsx#L105-L115](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/demo-host/app/page.tsx#L105-L115)
    

## Code References (Index)

- `.github/workflows/ci.yml:1–26` — CI gates (lint/build/test/bundle/a11y/security)
    
- `.github/workflows/ci.yml:28–125` — PR Vercel previews (demo-host, API)
    
- `package.json:6–18` — Root scripts mapping to turbo pipeline
    
- `turbo.json:4–13,19–34` — Pipeline tasks and outputs
    
- `apps/api/vercel.json:11–21` — `/v1/*` rewrites
    
- `apps/api/api/v1/compose.ts:167–218` — Compose flow and caching headers
    
- `apps/api/src/lib/plan.ts:33–51,87–101` — Plan encoding and inline/cached thresholds
    
- `packages/router-helpers/src/index.ts:105–119` — `encodePlan`
    
- `packages/page-schema/src/index.ts:355–366` — `computePlanHash` + `withPlanHash`
    
- `tooling/tests/smoke/embed.spec.ts:12–23` — CDN asset smoke test
    

## Architecture & Patterns (as implemented)

- Monorepo via Turborepo and pnpm; pipeline coordinates build/test/lint and additional checks (`turbo.json`).
    
- API uses Vercel serverless handlers with mixed Edge (fragment) and Node (interpret/compose/plan) runtimes; rewrites expose a stable public surface (`apps/api/vercel.json`).
    
- Embed SDK operates in Shadow DOM; hydration emits analytics events; plans are URL‑encoded via router-helpers.
    
- Data provider adapter simulates external provider behavior with quotas, caching, and a circuit breaker.
    

## Related Documentation

- `README.md:28–40` — CI expectations and gates
    
- `docs/engineering/ARCHITECTURE.md:94–108` — Quality gates alignment
    
- `docs/pre_github_CI_Testing.md` — Local pre‑GitHub CI testing narrative
    
- `.github/pull_request_template.md:2–11` — PR checklist mirroring gates
    

## Open Questions

- Are any git hooks (pre‑push/pre‑commit) configured externally rather than in‑repo? Evidence: only sample hooks under `.git/hooks` and doc guidance (ripgrep output), no committed hook manager found.
    
- Which environment(s) supply Vercel secrets referenced in workflows for previews/publishing? Workflows expect them in repository/org secrets (`VERCEL_*`, `*_ALIAS`).
    

## Follow‑up

- **2025‑10‑29 17:15** — Initial mapping completed; citations pinned to `aaa8441`.
    

---

### Evidence Log

- `.github/workflows/ci.yml:1–26` — core CI steps — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/ci.yml#L1-L26](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/.github/workflows/ci.yml#L1-L26)
    
- `package.json:6–18` — local scripts — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/package.json#L6-L18](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/package.json#L6-L18)
    
- `turbo.json:4–13,19–34` — pipeline — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/turbo.json#L4-L13](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/turbo.json#L4-L13)
    
- `apps/api/vercel.json:11–21` — HTTP surface — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/vercel.json#L11-L21](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/apps/api/vercel.json#L11-L21)
    
- `tooling/config/vitest.config.ts:4–14` — unit test config — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/tooling/config/vitest.config.ts#L4-L14](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/tooling/config/vitest.config.ts#L4-L14)
    
- `tooling/config/playwright.config.ts:3–16` — e2e config — [https://github.com/ryanderose/cs-eventhub/blob/aaa8441/tooling/config/playwright.config.ts#L3-L16](https://github.com/ryanderose/cs-eventhub/blob/aaa8441/tooling/config/playwright.config.ts#L3-L16)