# Threat Model

## Assets
- Tenant configuration and event data.
- User session details, analytics telemetry, AI plans, and embeddings.

## Adversaries
- Host page injection attempting to bypass CSP.
- Malicious providers returning unsafe HTML.
- Replay or poisoning attacks on cached plans.

## Mitigations
- Strict CSP with hashed critical CSS and SRI-enforced deferred styles.
- Sanitizer pipeline removing scripts, inline handlers, and disallowed protocols.
- Plan canonicalization with `planHash` ensures cache integrity.
- Rate limits: 10 rps burst / 240 rpm sustained per tenant with circuit breaker fallback.
