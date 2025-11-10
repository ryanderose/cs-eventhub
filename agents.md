# agents.md

Guidance for AI/code agents working in the Events Hub monorepo. Read this together with the authoritative product spec (`docs/product/spec-v1.6.md`) before making changes—shipping anything that contradicts that spec will be rejected.

## Instruction Precedence & Clarifications
- If you encounter contradictory or confusing directions across this file, the product spec, research notes, plans, or prompts, pause immediately and ask for clarification before you continue. Do not guess which instruction should win—the correct path must be confirmed explicitly.

## Product & Vision Highlights
- **Shadow-DOM embed, no iframes:** `packages/embed-sdk` delivers the no-iframe widget (Preact + `preact/compat`) that must mount safely on any host page. Shadow DOM is mandatory except for the Light-DOM SEO fragments spelled out in the spec.
- **AI-curated discovery:** `packages/ai-interpreter` + `packages/ai-composer` parse the DSL, stream sections (hero → rows → supporting blocks), and emit deterministic `planHash` values so URLs can persist plans via `packages/router-helpers`.
- **Real data or bust:** Stubbed hero/promo/map/chat renders are explicitly forbidden (§22 of the spec). Blocks in `packages/blocks` **must** hydrate live data via the provider layer (`packages/data-providers`) before a feature is considered GA-ready.
- **Analytics & observability:** Every hydration/visibility event must land in the `SdkEvent` schema (`packages/telemetry`). OTel spans stitch together client, API (`apps/api`), providers, and AI services to satisfy the latency/SLO budgets (composer P95 ≤ 300 ms, chat→hero P99 ≤ 900 ms).
- **Accessibility + editorial polish:** WCAG 2.2 AA is a gate, not a best-effort. Map Grid needs keyboardable parity with list views, Radix overlays go through the embed Portal, and Tailwind preflight stays off.

## Repository Layout
```
root/
├─ apps/
│  ├─ admin        # Next.js 14.2 tenant console (React)
│  ├─ demo-host    # Next.js marketing host that mounts the embed (linked/CDN modes)
│  ├─ api          # Express/Vercel BFF (config, AI compose, analytics ingest)
│  └─ cdn          # Static deployment shell for published embed bundles
├─ packages/
│  ├─ embed-sdk, block-runtime, blocks, block-registry
│  ├─ router-helpers, page-schema, default-plan
│  ├─ ai-interpreter, ai-composer
│  ├─ data-providers, telemetry, security
│  ├─ tokens, ui, cli
├─ docs/           # Product spec v1.6, engineering guides, ops & security runbooks
├─ ai/             # Prompt scaffolds, safety constraints, evals, existing agent notes
├─ tooling/        # Shared ESLint/Prettier/Vitest/Playwright configs, bundle tooling
└─ scripts/        # turbo-run wrapper, publish-embed, e2e helpers, serve-embed
```

Use `docs/engineering/ARCHITECTURE.md` for a concise system map, `docs/engineering/embed-dev.md` for Shadow-DOM development notes, and `docs/engineering/DECISIONS/ADR-*.md` for rationale (no iframes, Preact embed, strict CSP).

## Runtime Architecture (End-to-End)
1. **Host page → Embed SDK:** Host sites load the UMD/ESM bundle (published via `apps/cdn` or linked locally) and hand tenant config + initial plan to `packages/embed-sdk`. The SDK builds the Shadow Root, attaches constructable stylesheets (tokens → UI → block styles), and exposes a Portal slot for Radix overlays.
2. **Block runtime:** `packages/block-runtime` orchestrates streamed hydration. It must honor the composer’s order, guard against stub renders, and emit `SdkEvent` analytics via `packages/telemetry`.
3. **Blocks + registry:** Components in `packages/blocks` read schema metadata from `packages/block-registry`, fetch real data, and enforce diversity constraints. Promo slots, hero, map grid, chat, calendar, etc. all live here—never degrade to text placeholders.
4. **Server/API plane:** `apps/api` acts as the BFF. It fans out to CitySpark via `packages/data-providers`, runs interpreter/composer, persists plans/short IDs, and enforces routing helpers (`packages/router-helpers`). KV/backing storage seeding happens via `pnpm --filter @events-hub/api seed:default-plan`.
5. **Analytics & SLOs:** Telemetry travels through ClickHouse/Metabase (see `dev/docker-compose.yml` for local stack). Every stage decorates spans with the shared trace ID so latency bottlenecks are obvious.

## Development Workflow
- **Tooling baseline:** Node `18.19.0` (`.nvmrc`), `pnpm@8.15.4`, `turbo@1.13`. The workspace is private and uses pnpm workspaces (`pnpm-workspace.yaml`) + Turborepo (`turbo.json`).
- **Turbo credentials:** All `pnpm -w <task>` commands call `scripts/turbo-run.sh`, which requires a `TURBO_TOKEN` unless you set `TURBO_ALLOW_MISSING_TOKEN=1` (cache disabled). Copy `.env.turbo.example` → `.env.turbo` or export the token/command before running builds/tests.
- **Setup + core commands:**
  - `pnpm install` – hydrate workspace deps.
  - `pnpm -w build` – compiles every package/app (look for `dist/**`, `.next/**` outputs).
  - `pnpm -w test` – Vitest suites via the shared config (`tooling/config/vitest.config.ts`).
  - `pnpm -w lint` – ESLint root config (`tooling/config/eslint.config.mjs`) + per-app Next rules.
  - `pnpm dev:stack` – runs demo host (3000), admin (3001), API (4000), embed SDK watcher, and CDN dev server simultaneously for parity testing.
  - `pnpm --filter @events-hub/embed-sdk dev` – hot rebuild Shadow-DOM bundles.
  - `pnpm publish:embed` – copies built embed artifacts into `apps/cdn/public/hub-embed@<ver>/`.
  - `pnpm dev:cdn` or `vercel dev` inside `apps/cdn` – serve published assets locally.
- **Env toggles:** `NEXT_PUBLIC_EMBED_MODE` (linked vs external), `NEXT_PUBLIC_PLAN_MODE`, `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_CONFIG_URL`. Keep beta/prod manifests in sync via `apps/api/.env.local`.

## Testing & Quality Gates
- **Unit + contracts:** Vitest + React Testing Library run via `pnpm -w test`. Coverage gates: statements ≥ 90%, functions ≥ 90%, branches ≥ 85%. Contract suites live alongside packages (see `packages/**/__tests__`).
- **Stories & a11y:** Ladle (`@ladle/react`) powers interactive stories; axe snapshots must be zero for every block state (empty/loading/populated/error). Use `pnpm --filter @events-hub/blocks ladle` when iterating.
- **Network simulation:** MSW handlers live under `dev/msw`. Use them for CitySpark throttling/latency chaos scenarios before touching real providers.
- **E2E + parity:** Playwright config lives at `playwright.config.ts`.
  - Local projects spin up demo host/admin/api with polling-friendly env vars.
  - Preview projects drive deployed URLs with Vercel protection-bypass headers.
  - Tags: `@preview` for preview-only suites, `@parity` for plan/URL persistence coverage.
  - `pnpm test:e2e:local` and `pnpm test:e2e:preview` wrap common invocations.
  - `pnpm test:parity` locks onto plan hash/order tests.
- **Playwright MCP access:** The sandbox cannot run Playwright directly. When you need Playwright coverage, request permission to enable the Playwright MCP integration and run the suites through it; otherwise document the gap.
- **Specialized checks:** `pnpm -w check:a11y`, `pnpm -w check:bundles`, `pnpm -w security:sbom`, `pnpm -w security:provenance`. CI also runs CodeQL + supply-chain scanners (`README.md` + `.github/workflows`).
- **Do not skip:** Map Grid keyboard tests, chat→hero latency assertions, plan encode/decode fuzzing, diversity property tests, and Ladle axe snapshots. They are GA gates in §17–§22.

## AI, Planning & Prompt Surfaces
- Reference `ai/constraints.md`, `ai/context/*`, and `ai/prompts` for interpreter/composer expectations. The shared `ai/agents.md` already enforces spec alignment—this root file complements it with repo-wide engineering details.
- ExecPlans (design → implementation scaffolds) are required for complex changes. Follow the guidance referenced in `ai/agents.md` (`.ai/PLANS.md` in future tooling) before coding multi-step features.
- `packages/default-plan` + `apps/api/scripts/seed-default-plan.ts` maintain baseline content for demo environments. Keep plan seeding deterministic; re-run seeds whenever block schemas change.

## Security, Compliance & Observability Guardrails
- **CSP + SRI:** Enforced through `packages/security` and ADR-0003. Never introduce inline scripts or event handlers in embeds or SEO fragments.
- **Shadow DOM isolation:** Do not disable `useShadowDom` unless explicitly working on the Light-DOM SEO path; even then, ensure hashed critical CSS stays intact.
- **Telemetry:** Always emit `SdkEvent` analytics via the telemetry helper—no ad-hoc logging. Attach `planHash`, block identifiers, and tenant context as required by the schema.
- **OTel tracing:** `apps/api` and shared packages already depend on `@opentelemetry/api`. Wrap new async hops so traces correlate across client ↔ server ↔ provider calls.
- **Data residency & SLOs:** Follow docs under `docs/ops/` + `docs/security/`. Region defaults are US, but CMP adapters (OneTrust/Sourcepoint) and GeoIP behavior must respect tenant overrides.

## Helpful References
- `docs/product/spec-v1.6.md` — Canonical product + GA contract.
- `docs/engineering/ARCHITECTURE.md` — High-level topology snapshot.
- `docs/engineering/embed-dev.md` — Detailed instructions for running the embed stack locally, plan seeding, and CDN publishing.
- `docs/ops/*` — Runbooks for outages, cache poisoning, CMP failures.
- `docs/security/*` — CSP templates, sanitization rules, provenance expectations.
- `docs/engineering/DECISIONS/*.md` — ADRs explaining cross-cutting choices.
- `ai/constraints.md` — Safety + prompt contract for interpreter/composer.
- `dev/docker-compose.yml` — ClickHouse + Metabase + MSW edge proxy for local analytics validation.

When in doubt, start with the product spec, confirm architecture docs agree, and keep tests + telemetry updated before landing a change. This repo assumes **no stub code, deterministic plans, strict analytics, and measurable performance—do not erode those defaults.**
