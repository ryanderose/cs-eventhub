# AI Agent Guidelines

- Interpreter and composer prompts must reference `docs/product/spec-v1.5.md` for canonical rules.
- Always respect `ai/constraints.md` and attach telemetry spans to generated actions.
- Prefer deterministic formatting to keep `planHash` stable across runs.
