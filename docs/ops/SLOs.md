# Service Level Objectives

- **API Availability:** 99.9% monthly with ≤ 5 min consecutive downtime.
- **Interpret Latency:** P99 ≤ 900 ms from chat submit to hero render.
- **Composer Latency:** P95 ≤ 300 ms for plan generation.
- **Fragment Freshness:** Incremental static regeneration every 15 minutes per tenant.
- **Error Budget Policy:** Consume ≤ 20% of error budget before triggering release freeze.
