# AI Filter DSL

Interpreter responses conform to the `AiQuery` schema in `docs/engineering/API/openapi.yaml`.

- **Intent** — `search`, `qa`, or `navigate`.
- **Filters** — date range presets or ISO8601 bounds, categories, price ceilings, distance, neighborhoods, family friendliness, accessibility, and sort order.
- **Versioning** — current version `dsl/1`. Future revisions must remain backward compatible and include explicit migrations.

All AI inputs must be sanitized and logged via `analytics.ai_fallback_triggered` when a policy block occurs.
