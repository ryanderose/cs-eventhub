# Embed SDK development stack

This guide explains how to run the full embed stack locally and how to switch between linked bundles and the externally hosted CDN build.

## Local hostnames

Add the following entries to `/etc/hosts` to mirror production-like hostnames:

```
127.0.0.1 demo.localhost
127.0.0.1 api.localhost
127.0.0.1 config.localhost
127.0.0.1 cdn.localhost
```

`pnpm dev:stack` starts the services on these hostnames:

- **Next demo host** – `demo.localhost:3000`
- **Vercel API emulator** – `api.localhost:3000` via `vercel dev` (also serves `config.localhost:3000`)
- **Embed SDK watcher** – rebuilds `packages/embed-sdk/dist`
- **Static CDN server** – `cdn.localhost:5050` with `Cache-Control: no-store`

## Linked vs external embed modes

The demo host supports two loading modes controlled by `NEXT_PUBLIC_EMBED_MODE`:

- `linked` (default) dynamically imports `@events-hub/embed-sdk/dist/index.esm.js` from the monorepo build. Run `pnpm --filter @events-hub/embed-sdk dev` or `pnpm dev:stack` to keep the bundle updated.
- `external` loads `NEXT_PUBLIC_EMBED_SRC` in a `<script>` tag. Point this at either the development CDN (`http://cdn.localhost:5050/hub-embed.umd.js`) or a published asset from `apps/cdn`.

Toggle `NEXT_PUBLIC_EMBED_MODE` in `apps/demo-host/.env.local` to switch without restarting the server.

## Beta vs production manifests

The API project now serves tenant payloads at `http://config.localhost:3000/config/tenants/<tenant>.json` (rewritten to `api.localhost`). Each response exposes the stable manifest alias and embed script source, with optional HMAC signing when `CONFIG_SIGNING_SECRET` is set.

- Use `mode=beta` (default) to reference the locally served manifest at `http://cdn.localhost:5050/hub-embed@latest/manifest.json`.
- Use `mode=prod` to mirror the production manifest URL (override via `CONFIG_PROD_MANIFEST`).

Update `.env.local` for `apps/api` to tune manifest sources, then restart `pnpm --filter @events-hub/api dev`.

## Publishing embeds to the CDN app

1. Ensure `packages/embed-sdk/package.json` has the desired release version.
2. Run `pnpm --filter @events-hub/embed-sdk build`.
3. Execute `pnpm publish:embed` to copy the artifacts into `apps/cdn/public/hub-embed@<version>/`, generate `manifest.json`, and refresh the stable alias at `apps/cdn/public/hub-embed@latest/`.
4. Deploy `apps/cdn` to make the assets available at `/hub-embed@<version>/…` with immutable caching headers and `/hub-embed@latest/…` with a short TTL for previews.

Consumers can choose between linked mode (local bundle) and external mode (published CDN bundle) by updating their `.env` files accordingly.
