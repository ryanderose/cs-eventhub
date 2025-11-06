# Blocks Workflow & Default Plan Playbook

This document complements the engineering embed guide by outlining how to reseed the default block plan, verify demo-host parity, and add new blocks safely.

## Default plan lifecycle

1. **Reseed as needed** — run `pnpm --filter @events-hub/api seed:default-plan -- --tenant demo --force` after upgrading the block roster or when QA needs a clean slate. Use `--dry-run` to confirm the action and storage mode (KV vs. in-memory) without mutating anything.
2. **Reorder via `/blocks`** — save the desired order in the admin UI. Success toasts disappear once the plan is persisted and Plausible receives `admin-default-plan` events with both `blockCount` and comma-separated `blockKeys`.
3. **Validate the API** — hit `GET /v1/plan/default` and confirm the block order plus `{ key, id, kind }` tuples match `packages/default-plan`.
4. **Verify the demo host** — refresh `localhost:3000` (or the preview host). Wait for the status banner to read `Embed ready (stored default plan).` and inspect the container attributes:
   - `data-plan-source` should be `api`.
   - `data-plan-origin` should be `stored` (seeded indicates persistence failed).
   - `data-plan-hash` and `data-plan-keys` must align with the API response.
   - The console log `[demoHost.defaultPlan]` includes the same metadata for copy/paste debugging.
5. **Automated parity** — execute `pnpm playwright test --project=demo-hosts-local --grep @default-plan` to reset/reorder via the API and ensure the host reports the new order.

## Adding or updating blocks

1. Implement the block in `packages/blocks` and land/update Ladle stories (loaded/loading/error) so UI reviewers can preview the canonical props.
2. Extend `packages/default-plan` with the new block template (UUID id, deterministic order, metadata helpers). Update the allowlist and tests in the same package.
3. Refresh API validation (`apps/api/src/http/plan-default.ts`) if the block count changes, and regenerate any fixtures in admin/API tests.
4. Update the admin `/blocks` UI as needed so summaries remain meaningful.
5. Re-run the reseed + parity checklist above before flipping any feature flags.

## Manual checklist before releases

- [ ] Seeded plan replaced with the new roster via `pnpm --filter @events-hub/api seed:default-plan -- --tenant demo --force`.
- [ ] `/blocks` shows stored status (no seeded banner) after a save.
- [ ] Demo host banner reads `Embed ready (stored default plan).`
- [ ] `data-plan-keys` matches the canonical order from the shared module.
- [ ] Playwright `@default-plan` scenario passes locally or in CI.
- [ ] Ladle stories cover every block referenced in the shared template.
