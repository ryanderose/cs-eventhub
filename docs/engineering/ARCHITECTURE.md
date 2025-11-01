# Architecture Snapshot (Spec v1.6 Alignment)

Events Hub ships as a pnpm + Turborepo workspace that mirrors the product guardrails in
[`docs/product/spec-v1.6.md`](../product/spec-v1.6.md). The repo is intentionally
structured so every surfaced artifact (SDK bundle, API response, admin route) can be
traced back to deterministic build inputs, analytics events, and observability budgets.

## Monorepo Topology

```
root/
├─ apps/
│  ├─ admin/      # Next.js 15 tenant console (React)
│  ├─ demo-host/  # Next.js 15 marketing host that mounts the embed
│  └─ api/        # Node/Vercel BFF for config, composer, analytics, provider fan-out
├─ packages/
│  ├─ embed-sdk/      # Shadow-DOM runtime (Preact + compat)
│  ├─ block-runtime/  # Block hydration orchestrator + streaming cursors
│  ├─ blocks/         # First-party hero/promo/map/chat/etc. blocks (no stub renders)
│  ├─ block-registry/ # Metadata + schema registration for block discovery
│  ├─ page-schema/    # Zod contracts for PageDoc, BlockInstance, plan hashing helpers
│  ├─ router-helpers/ # URL plan encode/decode, basePath + filter persistence
│  ├─ ai-interpreter/ # DSL router + safety scaffolding
│  ├─ ai-composer/    # DSL → PageDoc compiler with deterministic ordering
│  ├─ data-providers/ # CitySpark adapter, quota enforcement, caching, canonical IDs
│  ├─ telemetry/      # OpenTelemetry wiring + analytics client that emits SdkEvents
│  ├─ security/       # DOM sanitizers, signatures, CSP helpers
│  ├─ ui/ + tokens/   # Shared design system (Radix + shadcn) and CSS variables
│  └─ cli/            # Scaffolding, schema validation, bundle reporting utilities
├─ tooling/config/    # eslint, tsconfig, vitest, playwright, ladle, axe, provenance
└─ docs/              # Product, engineering, ops, and security specifications
```

The workspace is "apps produce experiences, packages provide reusable building blocks".
Each Next.js app commits its own `.eslintrc` that extends `next/core-web-vitals` so lint
runs non-interactively in CI.

## Runtime Architecture

### Embed Path (Host Page → Visitor)

1. **Host integration** loads the no-iframe Embed SDK (UMD or ESM) and provides the
   tenant config payload. Shadow DOM is mandatory by default; only allow-listed CSS
   variables are honored.
2. **Embed SDK (`packages/embed-sdk`)** spins up the Shadow Root, attaches constructable
   stylesheets (tokens → utilities → block styles), and exposes the Portal container for
   Radix overlays. It routes URL changes through router helpers and emits `SdkEvent`
   analytics when hydration/visibility occurs.
3. **Block Runtime (`packages/block-runtime`)** hydrates streamed blocks in the order the
   composer delivers them (hero → rows → supporting blocks). Stubbed placeholder renders
   are explicitly disallowed per the GA gate in the v1.6 spec.
4. **Blocks (`packages/blocks`)** render hero/promo/map/chat/etc. experiences. They must
   satisfy WCAG 2.2 AA, honor `prefers-reduced-motion`, and emit analytics via the
   telemetry client. Map Grid exposes a list-view parity for accessibility.

### Server & Data Plane

- **API app (`apps/api`)** acts as the BFF. It handles config delivery, AI interpreter and
  composer requests, plan short-ID resolution, analytics intake, and provider fan-out. It
  is designed for Vercel Edge/Node runtimes and adds tracing metadata for every call.
- **CitySpark provider adapter (`packages/data-providers`)** enforces quotas, normalizes
  timestamps (UTC + IANA tz), computes `canonicalId`, and yields facet counts used by the
  filter bar and diversity logic.
- **AI interpreter/composer (`packages/ai-*`)** accept the DSL defined in the spec.
  Interpreter routes to the pinned large language models, while the composer deterministically
  generates PageDoc payloads, streaming cursors, and plan hashes. Latency budgets (P95 ≤
  300 ms for composer, P99 chat→hero ≤ 900 ms) are codified in `docs/product/spec-v1.6.md`.
- **Router helpers (`packages/router-helpers`)** provide `encodePlan`/`decodePlan` used by
  the embed and server endpoints to persist AI plans in URLs without breaking the 2 kB
  limit. Plans exceeding the budget fall back to short IDs resolved through the API.

### Admin & Authoring

The **admin app** provides tenant configuration, theme management, and page publishing.
It produces signed JSON payloads consumed by the embed. Admin remains a React app so the
editorial tooling can rely on Next.js server components and React ecosystem libraries
without the Shadow DOM constraints.

## Observability, Security, and Compliance

- **Analytics:** All hydration/visibility events flow through the telemetry package and
  must conform to the expanded `SdkEvent` schema. Fake timers or stub dispatchers are not
  accepted for GA readiness. Admin default plan APIs and UI emit
  `analytics.admin.default_plan.fetch|save` events and cache instrumentation under the
  `cache.pages_store.*` family so observability spans cover reorder flows end-to-end.
- **Tracing:** OpenTelemetry spans wrap API calls, provider requests, interpreter/composer
  invocations, and client SDK hydration phases. Shared trace IDs allow CI and Metabase to
  correlate perceived latency with infrastructure metrics.
- **Security:** CSP templates forbid inline scripts; embed bundles ship with SRI hashes.
  DOM sanitization guards rich text surfaces, and AI features respect safety constraints
  defined in `ai/constraints.md`.
- **Compliance & Provenance:** SBOM generation, CodeQL scans, and SLSA ≥ Level 2 provenance
  are part of the default CI workflow. Region affinity and CMP adapters follow the
  defaults outlined in the product spec.

## Testing & Quality Gates

CI enforces the following gates before merge:

- `pnpm -w build` – type checks and bundle builds across apps and packages.
- `pnpm -w test` – Vitest unit suites, schema contract tests, AI golden fixtures.
- `pnpm -w lint` – ESLint (including Next.js core-web-vitals extensions).
- `pnpm -w check:a11y` and `pnpm -w check:e2e` – Playwright + axe tests validate
  accessibility, overlay portals, and map-grid parity.
- `pnpm -w check:bundles`, `pnpm -w security:sbom`, `pnpm -w security:provenance` – bundle
  budgets, SBOM, and provenance verification.

These checks align with §18 and §22 of the v1.6 product spec. Pull requests that introduce
stubbed hero/promo/map/chat experiences, regress analytics emission, or disable Shadow DOM
must be rejected.

## Operational Considerations

Runbooks in `docs/ops/` cover provider outages, cache poisoning, and CMP failures. The API
exposes health and readiness probes for Kubernetes/Vercel monitors, and tenant-facing SLO
dashboards are powered by ClickHouse + Metabase with 13‑month retention. Configuration,
plan persistence, and analytics pipelines all share the `planHash` value to correlate user
sessions with cached responses and observability metrics.
