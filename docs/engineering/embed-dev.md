# Embed SDK development stack

This guide explains how to run the full embed stack locally and how to switch between linked bundles and the externally hosted CDN build.

## Local hostnames

`pnpm dev:stack` starts the services on these hostnames:

- **Demo host** – `localhost:3000`
- **Admin console** – `localhost:3001`
- **API (Express BFF)** – `localhost:4000`
- **Embed SDK watcher** – rebuilds `packages/embed-sdk/dist`
- **Static CDN server** – `localhost:5173` with `Cache-Control: no-store`

## Linked vs external embed modes

The demo host supports two loading modes controlled by `NEXT_PUBLIC_EMBED_MODE`:

- `linked` (default) dynamically imports `@events-hub/embed-sdk/dist/index.esm.js` from the monorepo build. Run `pnpm --filter @events-hub/embed-sdk dev` or `pnpm dev:stack` to keep the bundle updated.
- `external` loads `NEXT_PUBLIC_EMBED_SRC` in a `<script>` tag. Point this at either the development CDN (`http://localhost:5173/hub-embed.umd.js`) or a published asset from `apps/cdn`.

Toggle `NEXT_PUBLIC_EMBED_MODE` in `apps/demo-host/.env.local` to switch without restarting the server.

## Shared package builds

Every shared `@events-hub/*` package must emit JavaScript before the API (or any Vercel build) is deployed. Run `pnpm -w build` so Turbo builds library `dist/` folders before each app. Re-running the command is cheap because the pipeline caches each `dist/**` output.

- When iterating on a single package, `pnpm --filter <package> build` regenerates its `dist/` output without touching the rest of the workspace.
- Vercel projects should use `pnpm install --frozen-lockfile && pnpm -w build` as the Build Command so compiled artifacts exist before bundling serverless functions.
- If a deploy logs `Cannot find module ".../src/index.ts"`, rebuild locally, commit the refreshed `dist/` artifacts if they are tracked, and redeploy so the runtime reads `dist/index.js`.

## Default plan hydration

The demo host fetches the canonical default plan from the API whenever `NEXT_PUBLIC_PLAN_MODE` equals `beta` (default) or `prod`. The component renders the shared fallback from `@events-hub/default-plan`, then hydrates with the API response once it arrives. The status banner and container `data-*` attributes now make it obvious whether the embed is rendering the seeded blocks, a stored plan, or fallback data.

- Configure `NEXT_PUBLIC_API_BASE` so the host can call `GET /v1/plan/default`. Preview/production deployments now fall back to the current hostname (replace `demo-host*` with `api*`) when this variable is unset or still points at `localhost`, but explicit envs keep intent clear.
- `NEXT_PUBLIC_PLAN_MODE=beta` (default) enables the fetch; `sample`/`legacy` force the fallback for smoke testing. `NEXT_PUBLIC_CONFIG_URL` follows the same hostname derivation if it is left blank or references `localhost`.
- The client retries once (250 ms backoff) before falling back; failures mention "fallback data" and surface the error message when available.
- Inspect `[demoHost.defaultPlan]` console logs or the container attributes for parity debugging:
  - `data-plan-source`: `api` vs. `fallback`.
  - `data-plan-origin`: `seeded`, `stored`, or `fallback`.
  - `data-plan-hash` / `data-plan-keys`: persisted hash plus the ordered block keys currently rendered.

## Manual verification harness

Phase 1 introduced a set of dedicated demo-host routes so we can exercise every manual checklist item (routing, lazy/legacy mount, Trusted Types abort, multi-embed ownership) without maintaining scratch HTML. Start `pnpm dev:stack` and visit:

- `/manual` — index of every harness.  
- `/manual/routing` — query/hash persistence.  
- `/events` (and `/events/:slug`) — path routing + hard refresh checks.  
- `/manual/lazy` — IntersectionObserver lazy mount.  
- `/manual/legacy` — `data-mount-before` placeholder path.  
- `/manual/trusted-types` — forces Trusted Types policy failure to verify the abort UI.  
- `/manual/multi` — two embeds on one page with router ownership diagnostics.

The Playwright spec at `playwright/projects/demo/manual-harness.spec.ts` automates smoke coverage of these routes so later phases can lean on the same harness. **Important:** Playwright cannot run directly in this CLI sandbox; before invoking `pnpm test:e2e:local` (or any Playwright command) you must enable the Playwright MCP integration when prompted. If MCP access is unavailable, document the gap instead of attempting to run the suite.

### Reseeding and parity checks

1. Seed (or rewrite) the default plan pointer before switching to production mode:

   ```sh
   pnpm --filter @events-hub/api seed:default-plan -- --tenant demo [--force]
   ```

   `--force` clears the prior `plan:<hash>` entry; `--dry-run` reports the action without mutating KV/memory storage.

2. Reorder via `/blocks`, save, and confirm the seeded banner disappears. Admin analytics events now include `blockKeys` so Plausible dashboards show exactly which blocks were affected.
3. Refresh the demo host (localhost:3000) and wait for the banner to read `Embed ready (stored default plan).` Verify that the plan hash and `data-plan-keys` align with the API response.
4. For automated coverage run `pnpm playwright test --project=demo-hosts-local --grep @default-plan` (see `playwright/projects/demo/default-plan.spec.ts`). The spec resets the plan via the API, applies a reorder, and asserts that the host reports the updated block order.

## Beta vs production manifests

The API now serves signed config payloads at `http://localhost:4000/config/tenants/<tenant>.json`. Each tenant exposes `manifests.beta` and `manifests.prod` along with the currently selected `embed.manifestUrl`.

- Use `mode=beta` (default) to reference the locally served manifest at `http://localhost:5173/manifest.json`.
- Use `mode=prod` to mirror the production manifest URL (override via `CONFIG_PROD_MANIFEST`).

Update `apps/api/.env.local` or the corresponding Vercel env vars to point to beta or production manifests, then restart `pnpm --filter @events-hub/api dev`.

## Publishing embeds to the CDN app

1. Ensure `packages/embed-sdk/package.json` has the desired release version.
2. Run `pnpm --filter @events-hub/embed-sdk build`.
3. Execute `pnpm publish:embed` to copy the artifacts into `apps/cdn/public/hub-embed@<version>/` and generate a `manifest.json` alongside the bundle plus a mirrored `hub-embed@latest` alias.
4. Deploy `apps/cdn` to make the assets available at `/hub-embed@<version>/…` with immutable caching headers and refresh `hub-embed@latest` for clients that track the stable channel.

Consumers can choose between linked mode (local bundle) and external mode (published CDN bundle) by updating their `.env` files accordingly.
