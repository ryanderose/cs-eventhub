# Architecture Snapshot
- Turborepo + pnpm workspace spanning `apps/` (admin, api, demo-host) and `packages/` (schema, runtime, AI, security, telemetry, tokens, CLI).
- Embeds mount via Preact Shadow DOM SDK, blocks and admin use React.
- CitySpark provider adapter, router helpers, and telemetry enforce quotas, planHash, and observability budgets.
