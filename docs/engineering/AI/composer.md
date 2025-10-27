# Composer Contract

The composer receives an `AiQuery` and emits a deterministic `PageDoc`.

- **Pipeline:** Interpreter → Composer. Composer streams sections (hero then rows) while tracking budget usage. If latency or token budgets are at risk, trigger keyword fallback and record `ai_fallback_triggered` analytics.
- **Performance:** P95 latency ≤ 300 ms. `chat_latency_ms` events capture p50/p95 metrics per request.
- **Plan Hash:** Composer assigns `planHash` and persists it in `PageDoc.meta.planHash`. Edge caches include `planHash` + `composerVersion` in keys.
- **Diversity Rules:** Each row enforces venue/day/category limits over a 7-day window.
- **Observability:** Emit OpenTelemetry spans under `composer.*` with attributes for tenant, query intent, and fallback state.
