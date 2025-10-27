# PII Handling Policy

- Never persist raw user identifiers; hash session IDs with tenant-specific salts.
- Redact emails, phone numbers, and addresses from AI training data.
- Composer outputs must not expose user-supplied PII in rendered blocks.
- Provider responses containing PII trigger sanitizer quarantine and manual review.
