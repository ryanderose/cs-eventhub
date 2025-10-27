# Observability Playbook

- **Tracing:** Use OpenTelemetry. Span naming prefixes:
  - `sdk.*` for client-side renders.
  - `provider.cityspark.*` for upstream calls including retries and circuit breaker state.
  - `composer.*` for deterministic plan generation.
  - `cache.*` for edge cache operations including planHash keys.
  - `analytics.*` for event ingestion and export.
- **Metrics:** Capture latency histograms, retry counts, and fallback triggers. Diversity constraints must emit counters when adjustments occur.
- **Logging:** Structured JSON logs with tenantId, planHash, sessionId, and correlation IDs.
- **Alerting:** Pager on SLO breaches, fallback spikes, or repeated sanitizer drops.
