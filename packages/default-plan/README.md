# @events-hub/default-plan

Canonical default-plan helpers shared by the API, admin console, and demo host. The module exposes the block
roster used for the demo tenant plus utilities for rendering metadata in the admin UI and validating API payloads.

## Exports

| Export | Description |
| --- | --- |
| `DEFAULT_BLOCK_TEMPLATES` | Ordered list of the seven default block templates (key, UUID, kind, analytics label). |
| `getDefaultBlockAllowlist()` | Returns `{ key, id, kind }` tuples for API validation and seed scripts. |
| `createDefaultDemoPlan(options)` | Builds a canonical `PageDoc` with deterministic timestamps and UUID ids. Accepts overrides for tenant ID, plan hash, and metadata. |
| `relabelBlock(block)` | Resolves a human-friendly title for admin previews (prefers block data titles/headlines, then analytics labels). |
| `summarizeBlock(block)` | Generates short textual summaries per block (facet list, hero slide count, promo advertiser, etc.). |
| `DEFAULT_PLAN_TIMESTAMP` | Stable ISO timestamp used when an override is not provided. |

### `createDefaultDemoPlan` options

```ts
createDefaultDemoPlan({
  tenantId?: string;
  pageId?: string;
  title?: string;
  path?: string;
  description?: string;
  planHash?: string;
  now?: Date | string;
});
```

- `tenantId`, `pageId`, `title`, `path`, and `description` default to the demo tenant metadata.
- `planHash` defaults to `default-plan-seed` so the API can detect when the canonical seed is in use.
- `now` accepts a `Date` or ISO string; when omitted the module uses `DEFAULT_PLAN_TIMESTAMP` so hashes stay deterministic.
- The returned plan marks `meta.flags.seeded = true` so downstream clients can show “seeded/default” banners until a custom order is persisted.

## Block roster

| Order | Key | Kind | Notes |
| --- | --- | --- | --- |
| 0 | `filter-bar` | `filter-bar` | Date + category facets with reset CTA |
| 1 | `hero` | `hero-carousel` | Single hero slide with CTA |
| 2 | `rail-1` | `collection-rail` | Featured events rail |
| 3 | `map` | `map-grid` | Two sample pins with a fixed viewport |
| 4 | `promo` | `promo-slot` | Sponsored slot metadata |
| 5 | `detail` | `event-detail` | Modal detail card |
| 6 | `mini-chat` | `event-mini-chat` | Consent-required starter question |

## Development

```sh
pnpm --filter @events-hub/default-plan build
pnpm --filter @events-hub/default-plan test
```

The build emits `dist/index.{js,d.ts}` for downstream packages. Tests rely on the workspace Vitest config and
verify block ordering, UUID ids, and helper behaviour.
