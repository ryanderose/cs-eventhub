# Runbook: Cache Poisoning Suspected

1. **Detect** — Alert triggers when fragment checksum mismatches `planHash` or sanitizer drops spike.
2. **Contain** — Invalidate affected cache keys (planHash + composerVersion) and route traffic to fresh renders.
3. **Investigate** — Review recent deployments, analyze logs for unusual inputs, and confirm sanitizer coverage.
4. **Patch** — Harden sanitization rules or provider canonicalization as needed.
5. **Postmortem** — Document root cause, update CSP templates, and enhance tests to reproduce scenario.
