# Architecture Overview

Events Hub is a Turborepo monorepo. Applications and packages share configuration under `tooling/` and compose via pnpm workspaces.

## Apps

- **Admin (Next.js)** — React-based authoring surface consuming shared UI and blocks.
- **API BFF (Fastify)** — Terminates API requests, orchestrates provider access, AI flows, and fragment rendering.
- **Demo Host (Node runtime)** — Serves an HTML shell to exercise the embed SDK with MSW-backed data.

## Packages

- **Embed SDK (Preact + Shadow DOM)** renders page documents while emitting analytics spans.
- **Blocks** provide reusable layout primitives (hero, collections, map grid, promo slot, etc.).
- **Page Schema** defines the canonical Zod contracts for block instances and page documents.
- **AI Interpreter/Composer** encapsulate planning flows and adhere to latency budgets.
- **Router Helpers** handle plan encoding, canonicalization, and base paths.
- **Telemetry** centralizes analytics and OpenTelemetry spans.
- **Tokens/UI** share design primitives without enabling Tailwind preflight.
- **Security** exposes sanitization and CSP helpers.
- **CLI** bundles quality gates (bundle budgets, SBOM generation, provenance).

## Cross-cutting Concerns

- **Observability:** OpenTelemetry spans for SDK (`sdk.*`), provider (`provider.cityspark.*`), composer (`composer.*`), caching, and analytics.
- **Security:** Strict CSP, sanitizer enforcement, privacy guardrails, and CodeQL + SBOM gating in CI.
- **AI:** URL-persisted plans via base64url(zstd(JSON)) or short IDs, hashed as `planHash`.
- **Performance Budgets:** Bundles respect gzip ceilings; network timeouts and retries codified in providers.

All implementation must maintain WCAG 2.2 AA accessibility, parity between map and list views, and the analytics taxonomy defined in `ai/context/snippets/sdk-events.ts`.
