# Admin Snippet Generator

The admin application now includes an embed snippet generator at `/snippets`. This tool reads the locally published CDN manifests under `apps/cdn/public/hub-embed@*/manifest.json`, validates the bundle metadata, and emits copy/paste tags that satisfy the v1.6 spec (Shadow DOM container + dual script tags with `crossorigin="anonymous"` and SRI).

## Requirements

- Run `pnpm publish:embed` after building the SDK so `apps/cdn/public/hub-embed@<version>` and `hub-embed@latest` contain the latest bundles.
- Expose the CDN origin via `ADMIN_EMBED_CDN_ORIGIN` or `NEXT_PUBLIC_EMBED_CDN_ORIGIN` if the snippet should reference an absolute domain.
- Ensure the manifest includes the `bundleReport` block (Phase-A/B gzip sizes + limits). The publish script now writes this automatically.

## Refusal Logic

The generator refuses to copy snippets when:

1. A manifest lacks the module or nomodule entry (missing `index.esm.js` or `hub-embed.umd.js`).
2. Any asset is missing an integrity hash or the hashes are not `sha384-*`.
3. The manifest `cdnBasePath` does not match the asset path or recorded directory.
4. Phase-A bundle budgets are exceeded (UMD > 120 kB gzip, ESM > 95 kB, block chunk > 30 kB). These are hard failures.

When a manifest fails validation, the UI lists the errors and disables the copy button until the bundle is regenerated.

Warnings appear (but do not block copying) when Phase-B targets are exceeded or when optional metadata such as `generatedAt` is missing.

## Using the Generator

1. Navigate to `/snippets` in the admin UI.
2. Select the manifest alias (e.g., `hub-embed@latest`) or pinned version from the dropdown.
3. Adjust the tenant ID, embed ID, base path, history mode, and lazy mount toggle as needed. The generator updates the `<div data-hub-embed>` snippet inline.
4. Review the bundle budgets table to confirm both Phase A and Phase B statuses. Values are expressed in gzip kB relative to the spec limits.
5. Copy the snippet (container + module+nomodule script tags). The module tag references the ESM asset, while the nomodule tag references the UMD fallback.

## Troubleshooting

- **Manifest not found**: Run `pnpm publish:embed` to generate `hub-embed@<version>` directories under `apps/cdn/public`. The generator scans that directory at request time.
- **Phase-A violation**: Reduce the bundle size (tree-shake, trim dependencies) and rebuild. The UI will block copying until the gzip size is below the hard ceiling.
- **Phase-B warning**: These do not block copying yet but highlight work needed before Phase B becomes the enforcement gate.
- **Missing CDN origin**: Set `ADMIN_EMBED_CDN_ORIGIN` so script URLs resolve to the production CDN host instead of relative paths.
