# Demo Host Agent Notes

## Development

- This package runs on **Next.js App Router**.
- Use `pnpm --filter @events-hub/demo-host dev` to start the server. The dev
  script binds to `demo.localhost` and consumes `.env.local`.
- Copy `.env.example` to `.env.local` before running the app. The embed uses
  the following public variables:
  - `NEXT_PUBLIC_EMBED_MODE` — `linked` loads the local workspace SDK, while
    `external` loads the CDN bundle via `<script>`.
  - `NEXT_PUBLIC_EMBED_SRC` — required when `NEXT_PUBLIC_EMBED_MODE=external`.
  - `NEXT_PUBLIC_CONFIG_URL` — JSON endpoint returning a `PageDoc` for initial
    hydration.
  - `NEXT_PUBLIC_API_BASE` — base URL for SEO fragment fetches.
  - `NEXT_PUBLIC_PLAN_MODE` — toggles layout theming for beta/prod parity.

## Testing

- Run `pnpm --filter @events-hub/demo-host test` to execute Vitest suites.
- The `app/page.test.tsx` tests mount the real Next page, asserting that the
  embed hydrates into a Shadow DOM and that external mode injects the SDK
  script.

## SEO Fragment Route

- `app/(seo)/fragment/[tenant]/route.ts` calls the API fragment endpoint,
  returns hashed critical CSS (`sha256-*`), and is configured for Edge runtime
  with ISR defaults derived from `DEFAULT_ISR_REVALIDATE`.
