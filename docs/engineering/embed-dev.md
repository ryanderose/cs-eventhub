# Embed SDK development stack

This guide explains how to run the full embed stack locally and how to switch between linked bundles and the externally hosted CDN build.

## Local hostnames

`pnpm dev:stack` starts the services on these hostnames:

- **Next demo host** – `localhost:3000`
- **Local API adapter** – `localhost:4000` via `pnpm --filter @events-hub/api dev`
- **Embed SDK watcher** – rebuilds `packages/embed-sdk/dist`
- **Static CDN server** – `localhost:5173` with `Cache-Control: no-store`

The API adapter reuses the Vercel handlers through `apps/api/adapters/local`, exposes
`/health` for readiness probes, and defaults to `TELEMETRY_MODE=dev` so local requests log
to the console without hitting production sinks.

## Linked vs external embed modes

The demo host supports two loading modes controlled by `NEXT_PUBLIC_EMBED_MODE`:

- `linked` (default) dynamically imports `@events-hub/embed-sdk/dist/index.esm.js` from the monorepo build. Run `pnpm --filter @events-hub/embed-sdk dev` or `pnpm dev:stack` to keep the bundle updated.
- `external` loads `NEXT_PUBLIC_EMBED_SRC` in a `<script>` tag. Point this at either the development CDN (`http://localhost:5173/hub-embed.umd.js`) or a published asset from `apps/cdn`.

Toggle `NEXT_PUBLIC_EMBED_MODE` in `apps/demo-host/.env.local` to switch without restarting the server.

## Beta vs production manifests

The API now serves signed config payloads at `http://localhost:3000/config/tenants/<tenant>.json`. Each tenant exposes `manifests.beta` and `manifests.prod` along with the currently selected `embed.manifestUrl`.

- Use `mode=beta` (default) to reference the locally served manifest at `http://localhost:5173/manifest.json`.
- Use `mode=prod` to mirror the production manifest URL (override via `CONFIG_PROD_MANIFEST`).

Update `apps/api/.env.local` or the corresponding Vercel env vars to point to beta or production manifests, then restart `pnpm --filter @events-hub/api dev`.

## Default plan API

The admin `/blocks` route and demo host now hydrate from the default plan API. To seed the fallback plan locally:

- Run `pnpm --filter @events-hub/api seed:default-plan -- --tenant demo` to persist the static three-block plan and pointer. When KV credentials are not configured the seed falls back to in-memory storage.
- Fetch `curl http://localhost:4000/v1/plan/default?tenantId=demo | jq '.plan.blocks[].key'` to confirm the API returns `block-one`, `block-who`, and `block-three` with the persisted `planHash`.
- Saving new block order in the admin UI updates the pointer; the demo host only re-renders when the returned `planHash` changes, avoiding flicker between saves.

## Telemetry modes

Set `TELEMETRY_MODE=dev|noop|prod` in each app’s `.env.local` file. Use `dev` for local
logs, `noop` when you want completely silent runs (tests, CI dry-runs), and reserve `prod`
for deployed environments that forward analytics downstream.

## Publishing embeds to the CDN app

1. Ensure `packages/embed-sdk/package.json` has the desired release version.
2. Run `pnpm --filter @events-hub/embed-sdk build`.
3. Execute `pnpm publish:embed` to copy the artifacts into `apps/cdn/public/hub-embed@<version>/` and generate a `manifest.json` alongside the bundle plus a mirrored `hub-embed@latest` alias.
4. Deploy `apps/cdn` to make the assets available at `/hub-embed@<version>/…` with immutable caching headers and refresh `hub-embed@latest` for clients that track the stable channel.

Consumers can choose between linked mode (local bundle) and external mode (published CDN bundle) by updating their `.env` files accordingly.
