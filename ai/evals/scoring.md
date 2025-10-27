# Evaluation Scoring

- Interpreter accuracy measured via exact-match on DSL JSON structure.
- Composer success requires planHash stability, diversity constraints satisfied, and latency budgets respected.
- Failures must emit `ai_fallback_triggered` telemetry for investigation.
