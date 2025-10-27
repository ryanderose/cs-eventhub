# Composer Contract
- Input: Interpreter DSL + tenant context.
- Output: deterministic PageDoc with hero-first streaming, planHash, composerVersion, fallback flag.
- Emit spans `composer.plan.start/finish`; respect diversity and latency budgets.
