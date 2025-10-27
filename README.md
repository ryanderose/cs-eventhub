# Events Hub Pre-Seed Monorepo

This repository is the foundation for the Events Hub v1.5 build. It codifies architecture, guardrails, and tooling so the implementation prompt can focus on features.

## Quickstart

```bash
pnpm install
pnpm -w build
pnpm -w test
pnpm -w dev
```

`pnpm -w dev` runs the API BFF with MSW fixtures and the demo host server in parallel so the embed SDK renders a sample page.

## Repository Guide

- **apps/** — Runtime applications (admin Next.js app, API BFF, demo host shell).
- **packages/** — Publishable libraries (SDK, blocks, schema, analytics, tooling).
- **docs/** — Product, engineering, security, and ops documentation.
- **ai/** — Context pack, prompts, and evals for AI-powered flows.
- **tooling/** — Shared configuration and scripts (linting, bundling, provenance, SBOM).

## Contributing

See [CONTRIBUTING.md](docs/engineering/CONTRIBUTING.md) for development workflows, coding conventions, and acceptance gates.
