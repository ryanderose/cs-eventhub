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

The admin client reads the default plan API base URL from `NEXT_PUBLIC_API_BASE`. When unset, it falls back to `http://localhost:3001`.

```
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

Optional: set `NEXT_PUBLIC_CONFIG_URL` if the dashboard should surface embed configuration links.

## Blocks management

- Visit `/blocks` to reorder the default plan for the current tenant.
- Drag-and-drop or use the inline move buttons to change block order, then click **Save** to persist.
- The page provides optimistic updates, handles 412 conflicts by refetching, and logs telemetry via `console.debug('admin-default-plan', …)`.
