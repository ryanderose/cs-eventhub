# ADR-0001: No Iframes
- Embeds must mount via Shadow DOM SDK, eliminating iframe sandbox.
- Consequence: blocks respect Shadow DOM limitations and CSP carries isolation duties.
