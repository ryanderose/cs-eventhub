# Events Hub API

This app exposes the API surface for Events Hub as Vercel functions. Edge
runtimes handle latency-sensitive requests while Node functions cover handlers
that depend on Node-only libraries.

## Function layout

| Route | File | Runtime | Notes |
| --- | --- | --- | --- |
| `POST /v1/compose` | `api/v1/compose.ts` | Edge | Caches responses by `planHash` and `composerVersion`. |
| `GET/PUT /v1/plan/default` | `api/v1/plan/default.ts` | Node | Serves and updates the tenant default block plan using the pages store helpers. |
| `GET /v1/fragment/:tenantId` | `api/v1/fragment.ts` | Edge | Emits CSP headers and a tenant-specific placeholder. |
| `GET /v1/plan/:id` | `api/v1/plan/[id].ts` | Node | Resolves stored plans from KV or in-memory cache. |
| `POST /v1/interpret` | `api/v1/interpret.ts` | Node | Keeps the interpreter in a Node runtime. |

Shared helpers live in `src/lib` and cover plan encoding/persistence, CSP
assembly, and telemetry span management.

## Local development

1. Install dependencies from the repository root:

   ```sh
   pnpm install
   ```

2. Authenticate Vercel once and capture the project identifiers:

   ```sh
   pnpm vercel login
   pnpm vercel link
   ```

   The CLI stores `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` locally. Export them
   or place them in a `.env.local` file when running `vercel dev`.

3. Start the API locally from the repository root:

   ```sh
   pnpm --filter @events-hub/api dev
   ```

   The command runs `vercel dev` so that Edge and Node functions execute in the
   same way they will on the platform.

4. Run the route tests with:

   ```sh
   pnpm --filter @events-hub/api test
   ```

## Seeding the default plan

Use the seed script to populate (or rewrite) the default plan pointer for a tenant before enabling the admin UI or demo host in a shared environment:

```sh
pnpm --filter @events-hub/api seed:default-plan -- --tenant demo
```

Key flags:

- `--force` — overwrite the existing pointer and delete the previous `plan:<hash>` entry (useful when upgrading from the placeholder plan).
- `--dry-run` — log the action that would be taken without mutating KV/memory storage.
- `--quiet` — suppress JSON logs (errors still bubble to stderr).

The script reports whether KV or the in-memory store handled the write so you can verify persistence before toggling `/blocks` or the demo host to production mode.

## Environment variables

The API uses both Edge and Node runtimes. Configure these variables for local
work and deployments:

- `KV_REST_API_URL` / `KV_REST_API_TOKEN`: Enable persistence in Vercel KV for
  plan payloads. When omitted the handlers fall back to an in-memory cache,
  which is suitable for tests but not for production.
- `PLAN_CACHE_TTL_SECONDS` (default `3600`): TTL applied to stored plans in both
  KV and in-memory cache.
- `PLAN_INLINE_LIMIT` (default `2000`): Maximum encoded plan length before the
  compose handler stores it and returns a `shortId`.
- `COMPOSER_VERSION`: Optional hint that can be passed in requests and used for
  observability or cache segmentation.

The Node handlers inherit standard environment variables defined by the Vercel
project. Edge handlers receive any variables marked as Edge-safe in the Vercel
Dashboard.

## KV and cache behaviour

- Compose responses are cached in the Edge runtime using cache keys that include
  both `planHash` and the composer version.
- Plans larger than `PLAN_INLINE_LIMIT` are persisted in KV (when available)
  under a `plan:<hash>` key and can be retrieved by the plan resolver.
- Fragment responses ship strong CSP headers and leverage surrogate caching
  (`s-maxage`) to keep fragments fast without leaking tenant-specific details to
  browsers.

These behaviours are encoded in `vercel.json`, which also assigns preview,
beta, and production domains to the deployment.
