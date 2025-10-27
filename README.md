# Events Hub Monorepo (Pre-Seed)

This repository provides the pre-seed scaffold for the Events Hub platform. It encodes mandatory constraints from the product specification v1.5, defines the monorepo layout, and ships runnable stubs for apps, packages, and tooling.

## Quickstart

```bash
pnpm install
pnpm -w build
pnpm -w test
pnpm -w dev
```

The `dev` script launches the demo host and API stub with mocked data via MSW.

## Repository Highlights

- **Turborepo + pnpm** workspace for all apps and packages.
- **Preact-based embed SDK** with Shadow DOM sandboxing.
- **React admin** and demo host applications with shared tokens and UI primitives.
- **AI interpreter and composer** contracts with deterministic plan hashing and URL persistence helpers.
- **Security, observability, and ops** docs, CSP templates, and OTEL wiring.

## Contributing

See [`docs/engineering/ARCHITECTURE.md`](docs/engineering/ARCHITECTURE.md) and [`CONTRIBUTING.md`](docs/engineering/ARCHITECTURE.md#contributing) for architectural guardrails, budgeting expectations, testing requirements, and workflow conventions.

## CI Expectations

Pull requests must pass:

- Type checks (`pnpm -w build`)
- Unit tests + story snapshots (`pnpm -w test`)
- Linting (`pnpm -w lint`)
- Accessibility checks (`pnpm -w check:a11y`)
- Bundle budgets (`pnpm -w check:bundles`)
- SBOM and provenance scripts (`pnpm -w security:sbom`, `pnpm -w security:provenance`)
- CodeQL and supply-chain scans (run via GitHub Actions)

Refer to `.github/pull_request_template.md` for the full gate checklist.
