# Events Hub — Pre-Seed Build Spec (Concise)

This starter repo encodes the minimum layout, guardrails, and contracts required by Events Hub v1.5. All future prompts must keep these constraints intact.

## Non-Negotiable Highlights
- Shadow-DOM embed SDK (no iframes) with Preact + `preact/compat`.
- React-based admin + blocks, deterministic AI flow (Interpreter → Composer) with `planHash`.
- Strict CSP for fragments, hashed critical CSS ≤6 kB, single deferred stylesheet.
- Diversity guardrails (≤2 events/venue, ≤3/day, ≤60% category share) and latency budgets (chat→hero P99 ≤900 ms, composer P95 ≤300 ms).
- Analytics taxonomy: SDK lifecycle + `card_*`, `promo_*`, `ticket_outbound_click`, `chat_*`, `chat_latency_ms`, `ai_fallback_triggered`.
- CitySpark adapter with quotas (10 rps burst / 240 rpm sustained) and circuit breaker; cache keys include `planHash` + `composerVersion`.
- Bundle budgets: SDK UMD 45 kB gzip, ESM 35 kB, block 15 kB, tokens 12 kB.

## Repository Layout
- `apps/` → `admin` (Next.js stub), `api` (Fastify BFF), `demo-host` (Vite host mounting SDK).
- `packages/` → registry/runtime/blocks/schema/router/AI/data-provider/telemetry/tokens/security/cli.
- `ai/` → prompts, constraints, snippets, eval placeholders.
- `docs/` → architecture overview, ADRs (no iframe, Preact embed, strict CSP), AI contracts, ops runbooks, security notes.
- `tooling/` → shared configs (eslint, prettier, tsconfig, vitest, playwright, axe, ladle, codeql) and scripts (bundle budget, sbom, provenance, bootstrap).

## Acceptance Checklist
- `pnpm -w build` + `pnpm -w test` succeed.
- Demo host renders PageDoc through SDK Shadow DOM.
- API returns interpreter/composer stubs and fragment HTML with CSP.
- Bundle check, accessibility check, SBOM, and provenance scripts wired in CI.

Responders must print the repo map, every file with full contents, then a post-create checklist of local commands.
