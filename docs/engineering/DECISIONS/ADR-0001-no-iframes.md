# ADR-0001: No Iframe Embeds

- **Status:** Accepted
- **Context:** Events Hub embeds must integrate with host pages while respecting CSP and performance budgets.
- **Decision:** The SDK will not use iframes. Instead, it mounts into a host-provided container, instantiates a Shadow DOM root, and applies constructable stylesheets for isolation.
- **Consequences:** Blocks and SDK code must be Shadow DOM aware. Accessibility overlays mount to a dedicated portal element. Bundle budgets ensure the UMD payload stays under 45 kB gzip.
