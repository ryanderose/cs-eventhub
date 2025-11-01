# Embed SDK development stack

This guide explains how to run the full embed stack locally and how to switch between linked bundles and the externally hosted CDN build.

## Local hostnames

`pnpm dev:stack` starts the services on these hostnames:

- **Next demo host** – `localhost:3000`
- **Vercel API emulator** – `localhost:3000` via `vercel dev`
- **Embed SDK watcher** – rebuilds `packages/embed-sdk/dist`
- **Static CDN server** – `localhost:5173` with `Cache-Control: no-store`

## Linked vs external embed modes

The demo host supports two loading modes controlled by `NEXT_PUBLIC_EMBED_MODE`:

- `linked` (default) dynamically imports `@events-hub/embed-sdk/dist/index.esm.js` from the monorepo build. Run `pnpm --filter @events-hub/embed-sdk dev` or `pnpm dev:stack` to keep the bundle updated.
- `external` loads `NEXT_PUBLIC_EMBED_SRC` in a `<script>` tag. Point this at either the development CDN (`http://localhost:5173/hub-embed.umd.js`) or a published asset from `apps/cdn`.

Toggle `NEXT_PUBLIC_EMBED_MODE` in `apps/demo-host/.env.local` to switch without restarting the server.

## Default plan hydration

The demo host now fetches the default block plan from the API when `NEXT_PUBLIC_PLAN_MODE` is set to `beta` or `prod`. On initial load it renders the embedded sample plan, then hydrates with the API response once available. The status panel in the host shows whether the current view is using the API or fallback data.

- Configure `NEXT_PUBLIC_API_BASE` so the host can call `GET /v1/plan/default`.
- Set `NEXT_PUBLIC_PLAN_MODE=beta` (default) to enable the fetch, or `NEXT_PUBLIC_PLAN_MODE=sample`/`legacy` to force the inline sample plan.
- The client retries once (250 ms backoff) before falling back to the sample plan; the status panel reflects the failure.

Seed the default plan pointer before switching to production mode:

```sh
pnpm --filter @events-hub/api seed:default-plan -- --tenant demo
```

The script writes the canonical seed plan via the pages-store helpers so the admin UI and demo host read consistent content. Pass `--tenant <id>` to target other tenants.

## Beta vs production manifests

The API now serves signed config payloads at `http://localhost:3000/config/tenants/<tenant>.json`. Each tenant exposes `manifests.beta` and `manifests.prod` along with the currently selected `embed.manifestUrl`.

- Use `mode=beta` (default) to reference the locally served manifest at `http://localhost:5173/manifest.json`.
- Use `mode=prod` to mirror the production manifest URL (override via `CONFIG_PROD_MANIFEST`).

Update `apps/api/.env.local` or the corresponding Vercel env vars to point to beta or production manifests, then restart `pnpm --filter @events-hub/api dev`.

## Publishing embeds to the CDN app

1. Ensure `packages/embed-sdk/package.json` has the desired release version.
2. Run `pnpm --filter @events-hub/embed-sdk build`.
3. Execute `pnpm publish:embed` to copy the artifacts into `apps/cdn/public/hub-embed@<version>/` and generate a `manifest.json` alongside the bundle plus a mirrored `hub-embed@latest` alias.
4. Deploy `apps/cdn` to make the assets available at `/hub-embed@<version>/…` with immutable caching headers and refresh `hub-embed@latest` for clients that track the stable channel.

Consumers can choose between linked mode (local bundle) and external mode (published CDN bundle) by updating their `.env` files accordingly.
