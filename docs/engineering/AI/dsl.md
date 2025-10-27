# Interpreter DSL
- Filters cover dateRange, categories, price, distance, neighborhoods, familyFriendly, accessibility, sort.
- Payload shape: `{ intent: 'search'|'qa'|'navigate'; filters; followUpOf?; text?; version: 'dsl/1' }`.
- Interpreter must return deterministic JSON honoring `ai/constraints.md`.
