# Admin App

Next.js dashboard for Events Hub administration.

## Local development

- Install dependencies from the repository root (`pnpm install`).
- Start the admin dev server with:

  ```sh
  pnpm --filter @events-hub/admin dev
  ```

- Ensure the API app is running locally so the `/blocks` route can call `GET/PUT /v1/plan/default`.

## Environment variables

`/blocks` fetches the default plan via server-side calls to the API base and client-side requests to `/api/default-plan` (proxy). Configure these vars in the admin project:

```
ADMIN_API_BASE=https://apibeta.townthink.com
ADMIN_API_BYPASS_TOKEN=<vercel bypass token>
ADMIN_API_BYPASS_SIGNATURE=<optional signature>
```

When unset, the server falls back to `http://localhost:4000` which matches the local API dev server. Optional: set `NEXT_PUBLIC_CONFIG_URL` if the dashboard should surface embed configuration links.

## Blocks management

- Visit `/blocks` to reorder the default plan for the current tenant.
- Drag-and-drop or use the inline move buttons to change block order, then click **Save** to persist.
- The page provides optimistic updates, handles 412 conflicts by refetching, and logs telemetry via `console.debug('admin-default-plan', …)`.
