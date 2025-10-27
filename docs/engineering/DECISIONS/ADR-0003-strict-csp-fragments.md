# ADR-0003: Strict CSP for Server Fragments

- **Status:** Accepted
- **Context:** SEO parity requires server-rendered fragments that can be embedded within host documents without weakening security.
- **Decision:** All fragments are delivered with nonce-free CSPs that whitelist hashed critical CSS (≤ 6 kB) and a single deferred stylesheet via SRI. Inline scripts are prohibited.
- **Consequences:** Fragment rendering helpers compute Subresource Integrity hashes and emit CSP headers. Build tooling validates CSP manifests during CI.
