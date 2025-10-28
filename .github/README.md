# GitHub automation guide

This directory contains reusable CI/CD workflows for the Event Hub monorepo. The
following secrets and variables must be configured at the repository (or
organization) level so deployments succeed:

| Secret | Description | Used by |
| --- | --- | --- |
| `VERCEL_TOKEN` | Vercel API token with access to the Event Hub team. | All deploy workflows |
| `VERCEL_ORG_ID` | Vercel team/org ID (starts with `team_`). | All deploy workflows |
| `VERCEL_PROJECT_ID_DEMO_HOST` | Vercel project ID for `apps/demo-host`. | CI preview, promotion |
| `VERCEL_PROJECT_ID_API` | Vercel project ID for `apps/api`. | CI preview, promotion |
| `VERCEL_PROJECT_ID_CDN` | Vercel project ID for `apps/cdn`. | Canary & release publishing |
| `DEMO_BETA_ALIAS` | Domain alias (without protocol) for the demo beta environment. | Promotion |
| `DEMO_PROD_ALIAS` | Domain alias for the production demo host. | Promotion |
| `API_BETA_ALIAS` | Domain alias for the beta API environment. | Promotion |
| `API_PROD_ALIAS` | Domain alias for the production API. | Promotion |
| `CDN_PROD_BASE_URL` | Fully-qualified origin for the CDN (e.g. `https://cdn.events-hub.dev`). | Release publishing |
| `SMOKE_TENANT` | Optional tenant slug for API smoke tests (defaults to `demo`). | Promotion |
| `CLICKHOUSE_URL` | ClickHouse HTTPS endpoint used by API smoke tests. | Promotion |
| `CLICKHOUSE_USER` | ClickHouse username for analytics checks. | Promotion |
| `CLICKHOUSE_PASSWORD` | ClickHouse password/token. | Promotion |

Additional provider credentials (Vercel KV, Config service, etc.) should be added
as-needed when the corresponding workflows start consuming them. Keep aliases
synchronized with `vercel.json` in each app so promotions retarget the expected
hostnames.

### Workflow overview

- **`ci.yml`** – Runs unit/lint/test suites and, on pull requests, spins up Vercel
  previews for the demo host and API, commenting with the resulting URLs.
- **`publish-canary.yml`** – Builds the embed SDK on every `main` push, publishes
  the assets to `/hub-embed@canary/<commit>` in the CDN project, updates the
  canary manifest, and uploads SBOM/provenance artifacts.
- **`publish-embed.yml`** – Triggers on `embed-sdk@x.y.z` tags. Publishes immutable
  assets, deploys the CDN project, runs Playwright smoke tests, then updates the
  minor `latest.json` alias once the checks succeed.
- **`deploy-demo-and-api.yml`** – Manually promoted workflow that retargets the
  configured Vercel aliases (beta or production) to a chosen preview deployment
  and executes the Playwright smoke suites against the promoted URLs.

Refer to `tooling/tests/smoke/*.spec.ts` for the smoke expectations and update
them alongside any future changes to the public endpoints.
