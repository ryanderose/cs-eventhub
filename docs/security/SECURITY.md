# Security Policy

- Report vulnerabilities to security@eventshub.example with encrypted details.
- Critical fixes are triaged within 24 hours; non-critical within 3 business days.
- Dependencies are scanned via CodeQL and SBOM generation during CI.
- Sanitization helpers in `packages/security` must wrap all rich text rendering; inline event handlers are prohibited.
