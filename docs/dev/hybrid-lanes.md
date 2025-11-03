# Hybrid Dev Lane Runbook

The hybrid workflow provides two lanes for iterating on `cs-eventhub`. Phase 1 focuses on the **local** lane so engineers and agents can start everything without interactive prompts while matching production routing.

## Local Lane (Lane L)
- `pnpm dev:lane:local` spins up demo-host (3000), admin (3001), API (4000), the embed SDK watcher, and the CDN helper.
- Each app binds to `0.0.0.0` so sandboxes and containers can proxy traffic without port-forward prompts.
- Health check: `curl http://localhost:4000/health` responds with `OK` once the API Express adapter is ready.

### Individual Processes
- Demo Host: `PORT=3000 HOST=0.0.0.0 pnpm --filter @events-hub/demo-host dev`
- Admin: `PORT=3001 HOST=0.0.0.0 pnpm --filter @events-hub/admin dev`
- API (Express adapter): `PORT=4000 HOST=0.0.0.0 pnpm --filter @events-hub/api dev`
- Embed SDK: `pnpm --filter @events-hub/embed-sdk dev`
- CDN helper: `pnpm dev:cdn`

### Environment Defaults
- `.env.local.example` in each app documents `PORT`, `HOST`, and `NEXT_PUBLIC_API_URL`.
- `TELEMETRY_MODE` defaults to `noop` locally to prevent external writes; switch to `dev` when validating payloads manually.
- API fallbacks: if KV credentials are absent, the service seeds plans via the local seed store.

### Rollback (Emergency)
- `pnpm --filter @events-hub/api dev:vercel` restores the previous `vercel dev` workflow for parity debugging.
- Switch `pnpm dev:stack` back to the archived command if the Express adapter needs to be bypassed.
