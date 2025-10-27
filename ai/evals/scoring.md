# AI Eval Scoring

- **Interpreter:** Exact intent match + required filters. Partial credit for optional filters when confidence ≥ 0.7.
- **Composer:** Hash comparison of `PageDoc` plus budget verification. Diversity violations are automatic failures.
- **Latency:** Capture `chat_latency_ms` events and ensure percentile thresholds are met in aggregate traces.
