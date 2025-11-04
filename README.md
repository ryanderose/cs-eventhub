# Events Hub Monorepo (Pre-Seed)

This repository provides the pre-seed scaffold for the Events Hub platform. It encodes the mandatory constraints from the product specification v1.6, defines the monorepo layout, and ships runnable stubs for apps, packages, and tooling.

## Quickstart

```bash
pnpm install
pnpm -w build
pnpm -w test
pnpm dev:stack
```

`pnpm dev:stack` starts the demo host, Vercel API emulator (with config routes), embed watcher, and local CDN server in parallel.

### Sandboxed Playwright runs

Coding agents (Codex CLI, Claude Code, etc.) should favor the system Chrome that already exists in the sandbox to avoid macOS Crashpad prompts and huge browser downloads:

```bash
rm -rf .pw-home .pw-user .chrome-crashes
mkdir -p ".pw-home/Library/Application Support/Google/Chrome/Crashpad" .pw-user .chrome-crashes
PLAYWRIGHT_USE_SYSTEM_CHROME=1 PW_HOME="$PWD/.pw-home" \
  CFFIXED_USER_HOME="$PWD/.pw-home" pnpm playwright test --project=demo-hosts-local --project=admin-local
```

Temporary folders such as `.playwright-browsers/`, `.pw-home/`, `.pw-user/`, and `.chrome-crashes/` are ignored by Git so these runs stay clean. Use `PLAYWRIGHT_USE_SYSTEM_CHROME=1` (and optional `PW_CHROME_PATH`) in CI or sandboxes that forbid downloading Playwright’s bundled browsers.

## Repository Highlights

- **Turborepo + pnpm** workspace for all apps and packages.
- **Preact-based embed SDK** with Shadow DOM sandboxing.
- **React admin** and demo host applications with shared tokens and UI primitives.
- **AI interpreter and composer** contracts with deterministic plan hashing and URL persistence helpers.
- **Security, observability, and ops** docs, CSP templates, and OTEL wiring.

## Contributing

See [`docs/engineering/ARCHITECTURE.md`](docs/engineering/ARCHITECTURE.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md) for architectural guardrails, budgeting expectations, testing requirements, and workflow conventions.

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

## Lockfile Maintenance

When `pnpm-lock.yaml` diverges between branches, use the **Refresh pnpm lockfile** workflow in GitHub Actions to regenerate it on the affected branch. The workflow can be triggered manually via the `workflow_dispatch` entry by specifying the branch name, or automatically for a pull request by adding the `refresh-lockfile` label. The job will run `pnpm install --lockfile-only` and push the updated lockfile back to the source branch with a `chore: refresh pnpm-lock.yaml` commit.

If you prefer to resolve conflicts locally, pull or rebase against `main`, run `pnpm install --lockfile-only`, verify the resulting diff, and commit the refreshed `pnpm-lock.yaml` alongside the related `package.json`. CI runs `pnpm install --frozen-lockfile`, so the update must be part of your changeset.
