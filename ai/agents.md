# AI Agent Protocols

- **Interpreter Agent:** Converts free-form queries into the DSL documented in `docs/engineering/AI/dsl.md`.
- **Composer Agent:** Receives interpreter output and builds deterministic page plans; must stream hero before collections.
- **Code Agent:** Applies repository changes respecting pnpm/turbo workflow and bundle budgets.

All agents must respect `ai/constraints.md` and emit telemetry in accordance with `packages/telemetry` contracts.
