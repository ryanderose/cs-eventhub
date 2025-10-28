# Events Hub Config Service (legacy helper)

The config service mirrors the hosted configuration API used by embed tenants. Production deployments now serve these payloads from `apps/api` (see `/config/tenants/[tenant].json`), but this stub remains available for offline testing or bespoke tooling.

## Endpoints

- `GET /tenants/:tenant.json?mode=beta|prod` – returns the tenant configuration payload and an HMAC signature. Defaults to `mode=beta` when omitted.
- `GET /healthz` – simple readiness probe.

Responses are CORS-enabled and include `Timing-Allow-Origin: *` so local tooling can observe request timing.

## Running locally

```bash
pnpm install
pnpm --filter @events-hub/config-service dev
```

The server binds to `config.localhost:4001`. Add the hostname to `/etc/hosts` if necessary:

```
127.0.0.1 config.localhost
```

Environment variables are sourced from `.env.local`. See [`.env.example`](./.env.example) for the default beta and production endpoints and how to override them.
