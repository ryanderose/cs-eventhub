# Plan URL Persistence

Plans persist in URLs via `plan` query parameters encoded as `base64url(zstd(json))`. When the payload exceeds safe URL limits, generate a `shortId` served via `/plans/:id` and expose it as `?p=`.

Helpers in `packages/router-helpers` provide `encodePlan`, `decodePlan`, and canonicalization utilities that ensure `planHash` consistency. Cache keys for fragments include both `planHash` and `composerVersion` to avoid stale renders.
