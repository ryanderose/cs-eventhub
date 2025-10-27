# Cache Poisoning
1. Inspect cache entries scoped by tenant + planHash/composerVersion.
2. Purge affected keys, verify sanitizer + CSP outputs.
3. Log incident and monitor for repeated anomalies.
