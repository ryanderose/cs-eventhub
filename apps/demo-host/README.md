# Events Hub Demo Host

This package contains a Next.js App Router project used to exercise the Events Hub embed SDK in a host environment. The app renders the embed in both "linked" (bundled) and "external" (remote script) modes and exposes an ISR-enabled fragment route for SEO crawlers.

## Getting started

```bash
pnpm install
pnpm --filter @events-hub/demo-host dev
```

The development server binds to `demo.localhost` to mirror production hostnames. Update your `/etc/hosts` file if necessary:

```
127.0.0.1 demo.localhost
```

Environment variables are loaded from `.env.local`. See [`.env.example`](./.env.example) for the beta and production endpoint templates.

## Scripts

- `pnpm dev` – start `next dev --hostname demo.localhost`
- `pnpm build` – create a production build with `next build`
- `pnpm start` – run the production server with `next start`
- `pnpm lint` – run `next lint`
- `pnpm test` – execute Vitest against the Next entrypoints and ISR routes

## Testing notes

The Vitest suite mounts the App Router page and asserts that the embed attaches a Shadow DOM whether the SDK is loaded via dynamic import or an external `<script>`. It also validates the ISR fragment route to ensure the upstream CSS is hashed and exposed through both the JSON payload and the `X-Events-Hub-CSS-Hash` header.

## SEO fragment workflow

The route at `/fragment/[tenant]` proxies the Events Hub API, computes a deterministic SHA-256 hash for the returned critical CSS, and applies shared ISR cache headers. Tweak `FRAGMENT_REVALIDATE_SECONDS` and `FRAGMENT_STALE_SECONDS` in `.env.local` to adjust caching defaults.
