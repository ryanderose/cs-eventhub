# Hard Constraints

- No iframes; embeds run in Shadow DOM with constructable stylesheets.
- Embed SDK budgets: UMD ≤ 45 kB gzip, ESM ≤ 35 kB, per-block ≤ 15 kB, tokens ≤ 12 kB.
- Composer P95 ≤ 300 ms; chat hero P99 ≤ 900 ms.
- Plans must set `planHash` and support URL persistence via `encodePlan`/`decodePlan` helpers.
- Diversity per row: ≤2 events per venue, ≤3 events per day (7-day window), ≤60% category dominance unless single-category query.
- Analytics taxonomy fixed: `card_impression`, `card_click`, `ticket_outbound_click`, `promo_impression`, `promo_click`, `chat_open`, `chat_submit`, `chat_latency_ms`, `ai_fallback_triggered`.
- Provider layer implements CitySpark adapter with quotas, retries + jitter, and circuit breaker. Cache keys include `planHash` + `composerVersion`.
- WCAG 2.2 AA compliance required. Reduced motion honored. Overlays mount to SDK portal.
- Strict CSP: hashed critical CSS (≤ 6 kB), single deferred stylesheet with SRI, no `unsafe-inline`.
- Observability: OpenTelemetry spans for sdk, composer, provider, cache, analytics. SBOM + CodeQL gating.
