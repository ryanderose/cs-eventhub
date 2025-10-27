# Contributing Guide

1. **Install dependencies** using Node 20.11 and `pnpm install`.
2. **Branch naming**: `feature/<slug>` or `fix/<slug>`.
3. **Development loop**:
   - `pnpm -w dev` to run API (Fastify + MSW) and demo host simultaneously.
   - Author blocks under `packages/blocks`, exporting from `packages/block-registry`.
   - Ensure bundle budgets via `pnpm bundle-check`.
4. **Quality gates**:
   - `pnpm -w build`
   - `pnpm -w test` (vitest + storybook/ladle smoke + playwright + axe stubs)
   - `pnpm -w lint`
   - `pnpm sbom` & `pnpm provenance`
5. **Accessibility**: Validate with axe and manual keyboard testing. Map Grid parity is non-negotiable.
6. **Security**: Do not introduce inline handlers. Use sanitization utilities.
7. **PRs** must include screenshots or trace attachments where applicable and reference relevant ADRs.
