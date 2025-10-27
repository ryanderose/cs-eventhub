# Contributing to Events Hub

1. Install dependencies with `pnpm install`.
2. Run `pnpm -w build` and `pnpm -w test` before submitting changes.
3. Document architecture changes with ADR updates under `docs/engineering/DECISIONS`.
4. Validate bundle budgets using `pnpm -w check:bundles` and accessibility with `pnpm -w check:a11y`.
5. Keep SDK Shadow DOM isolation, CSP, and latency budgets intact.
