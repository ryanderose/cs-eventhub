# Context Facts

- Events Hub embeds must operate without iframes and rely on Shadow DOM.
- CitySpark is the primary data provider; quotas are 10 rps burst / 240 rpm sustained per tenant.
- Plans persist in URLs with base64url(zstd) encoding; fallback short IDs are supported.
- Analytics taxonomy is fixed (see `ai/context/snippets/sdk-events.ts`).
- Accessibility parity between list and map is mandatory.
