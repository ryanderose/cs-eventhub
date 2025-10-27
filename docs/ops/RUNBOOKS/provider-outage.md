# Runbook: Provider Outage (CitySpark)

1. **Detect** — Alert from `provider.cityspark.*` span errors or sustained retries.
2. **Mitigate** — Engage circuit breaker to short-circuit failing calls and serve cached plans.
3. **Fallback** — Trigger keyword fallback in composer and log `ai_fallback_triggered` with reason `policy`.
4. **Communicate** — Notify tenants via status page with ETA and impacted regions.
5. **Recover** — Re-enable provider gradually, monitoring latency and error rates.
