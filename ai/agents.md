# AI Agent Guidelines

- Prompts **must** reference [`docs/product/spec-v1.6.md`](../docs/product/spec-v1.6.md)
  for canonical contracts, latency budgets, and deliverable gates. Earlier specs are
  deprecated.
- Obey `ai/constraints.md`, attach OpenTelemetry spans to generated actions, and emit
  analytics through the telemetry client so downstream SdkEvents stay within the schema
  defined in v1.6.
- Never propose or accept stubbed hero/promo/map/chat implementations. Block outputs must
  hydrate real data sources and respect diversity, accessibility, and streaming rules.
- Keep `planHash` stability by using deterministic ordering/serialization when composing
  PageDoc payloads or encoded plans.
- When guidance conflicts, defer to the product spec → architecture doc → local package
  README hierarchy.
  
# ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .ai/PLANS.md) from design to implementation.
