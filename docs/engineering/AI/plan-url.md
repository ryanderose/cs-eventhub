# Plan URL Rules
- Encode plans with base64url (zstd stub) via router helpers; fallback to short ID when query strings overflow.
- Canonical URLs include planHash + composerVersion; paths lower-cased and sorted parameters.
