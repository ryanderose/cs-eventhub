# ADR-0002: Preact Embed Runtime

- **Status:** Accepted
- **Context:** The embed runtime must be lightweight and compatible with React authored blocks.
- **Decision:** The SDK is authored in Preact with `preact/compat` so React-authored blocks can render within the Shadow DOM without shipping the full React runtime twice.
- **Consequences:** Shared packages expose JSX via `"jsxImportSource": "preact"` for embed-facing code. Admin React components import via `preact/compat` when shared.
