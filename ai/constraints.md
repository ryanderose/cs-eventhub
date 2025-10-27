# Hard Constraints

- No iframe usage; embeds rely on Shadow DOM with constructable stylesheets.
- Composer P95 ≤ 300 ms; Chat→hero P99 ≤ 900 ms.
- Bundle budgets: SDK UMD ≤ 45 kB gzip, ESM ≤ 35 kB, block bundles ≤ 15 kB, tokens ≤ 12 kB.
- Diversity per row: ≤2 events per venue, ≤3 per day (7-day window), ≤60% category dominance unless single-category query.
- Provider adapter must include quotas (10 rps burst / 240 rpm sustained) and circuit breaker behavior.
- Strict CSP with hashed critical CSS ≤ 6 kB and one deferred stylesheet.
- Analytics events allowed: `card_impression`, `card_click`, `ticket_outbound_click`, `promo_impression`, `promo_click`, `chat_open`, `chat_submit`, `chat_latency_ms`, `ai_fallback_triggered`, plus SDK lifecycle events.
- Telemetry via OpenTelemetry spans named `sdk.*`, `provider.cityspark.*`, `composer.*`, `cache.*`, `analytics.*`.
