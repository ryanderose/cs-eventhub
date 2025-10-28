# Events Hub CDN stub

This package mirrors the production CDN layout for the embed SDK. Assets are served from `public/` and deployed to Vercel.

## Development

The repository exposes two entry points for local work:

- `pnpm dev:stack` – starts the static server at `cdn.localhost:5050` by running [`scripts/serve-embed.ts`](../../scripts/serve-embed.ts).
- `pnpm --filter @events-hub/cdn dev` – uses `vercel dev` to preview the CDN headers locally.

Immutable assets are published to `public/hub-embed@<version>/` and their SRI hashes are captured under `public/manifest/` by `pnpm publish:embed`.

`vercel.json` ensures versioned paths such as `/hub-embed@1.2.3/hub-embed.umd.js` receive `Cache-Control: public,max-age=31536000,immutable` and `Timing-Allow-Origin: *` headers.
