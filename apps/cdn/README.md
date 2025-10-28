# Events Hub CDN stub

This package mirrors the production CDN layout for the embed SDK. Assets are served from `public/` and deployed to Vercel.

## Development

The repository exposes two entry points for local work:

- `pnpm dev:stack` – starts the static server at `cdn.localhost:5050` by running [`scripts/serve-embed.ts`](../../scripts/serve-embed.ts).
- `pnpm --filter @events-hub/cdn dev` – uses `vercel dev` to preview the CDN headers locally.

Immutable assets are published to `public/hub-embed@<version>/` and the command refreshes the stable alias at `public/hub-embed@latest/`. Each directory contains the bundle, source maps, and a generated `manifest.json` with SHA-384 integrity metadata.

`vercel.json` applies immutable caching to semver-tagged paths such as `/hub-embed@1.2.3/hub-embed.umd.js` and uses a short TTL for `/hub-embed@latest/*` to keep previews responsive.
