# Runbook: CMP Outage

1. **Detect** — Monitoring detects failure to receive consent signals from OneTrust/Sourcepoint within 2 seconds.
2. **Mitigate** — Default to opt-out for tracking and pause promo impressions.
3. **Fallback** — Display banner communicating degraded consent experience; log analytics with `promo_impression` suppressed reason.
4. **Recover** — Once CMP restored, resume analytics gradually and verify consent cookies before full enablement.
