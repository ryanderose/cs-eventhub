# Contributing to Events Hub

1. Install dependencies with `pnpm install`.
2. Run `pnpm -w build` and `pnpm -w test` before submitting changes.
3. Document architecture changes with ADR updates under `docs/engineering/DECISIONS`.
4. Validate bundle budgets using `pnpm -w check:bundles` and accessibility with `pnpm -w check:a11y`.
5. Keep SDK Shadow DOM isolation, CSP, and latency budgets intact.
6. When a package imports code from another workspace package, declare the dependency in `package.json` before pushing so CI and Vite builds resolve modules correctly.

## Resolving pnpm-lock conflicts

When a branch diverges from `main`, resolve lockfile conflicts locally before pushing:

1. Pull or rebase on the latest `main` branch.
2. Run `pnpm install --lockfile-only` to regenerate `pnpm-lock.yaml` without altering `node_modules`.
3. Review the resulting diff to confirm the lockfile aligns with your related `package.json` changes.
4. Commit the updated `pnpm-lock.yaml` together with the corresponding `package.json` update so CI has both files.

> ℹ️ CI runs `pnpm install --frozen-lockfile`, which will fail if the required lockfile changes are missing from your commit.
