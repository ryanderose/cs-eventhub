# Events Hub Embed v1.6 Gap Closure — Implementation Plan

## Overview
- Deliver the spec-complete, no-iframe embed snippet (Final Spec v1.6: docs/specs/2025-11-09-events-hub-embed-final-spec-1.6.md) by implementing the missing SDK, admin, SEO, and CI capabilities documented in research so publishers can ship a single compliant integration across 3,000+ sites.
- Focus areas: consent/partner APIs, Trusted Types, routing + lazy/legacy mount, analytics schema, admin manifest guards, SEO JSON-LD parity, performance budgets, and acceptance coverage.

## Current State (from Research)
- SDK mounts Shadow DOM, renders simplified blocks, and syncs plan state via query/hash but lacks consent API, Trusted Types, lazy mount, path routing, click interception, router ownership, partner adapters, and network resilience (`packages/embed-sdk/src/index.ts:1`).
- Router helpers support query/hash encode/decode but not path templates or mount-before behavior (`packages/router-helpers/src/index.ts:1`).
- Telemetry schema exists yet omits `routeName`/`previousUrl` invariants and consent-buffer awareness (`packages/telemetry/src/index.ts:1`).
- Admin can edit default plans but does not refuse snippet generation on manifest/SRI drift and lacks a snippet generator parity check (`apps/admin/app/blocks/BlocksClient.tsx:1`).
- Demo host + API expose Light-DOM fragments but no JSON-LD diff budget or overlay isolation tests (`apps/demo-host/app/page.tsx:1`, `apps/api/api/v1/fragment.ts:1`).
- CI enforces generic build/test/lint gates but not Phase-A/B bundle budgets or the acceptance suite enumerated in §12 (`README.md:12`).

## Desired End State
- Embed runtime satisfies every normative clause in Final Spec v1.6: consent buffering + partners, Trusted Types policy/fallbacks, routing modes (query/hash/path/none), lazy + legacy mount, click interception, router ownership, analytics schema, deprecation telemetry, `[hub-embed]` logging, overlay isolation, and network resilience.
- Admin UI refuses snippet generation when manifest/CDN drift or missing SRI occurs, emitting only crossorigin+SRI tags with accurate version metadata.
- SEO parity harness caps JSON-LD diff ≤1%, ensures stable `@id`, and enforces noindex on AI/personalized routes.
- CI enforces Phase-A bundle budgets as hard gates, tracks Phase-B targets, and adds automated + manual acceptance criteria for consent, TT, routing, lazy mount, adapters, overlay isolation, and snippet refusal.

## Non-Goals
- Changes to backend plan/AI authoring beyond what SDK/Admin require (handled in separate specs).
- Introducing iframe/AMP fallbacks or new host CMS plugins (explicitly out of scope in spec §1).
- Rearchitecting telemetry sinks or adding new data providers beyond what consent buffering/partner adapters need.

## Architecture & Approach
- Extend existing SDK modules instead of introducing a parallel runtime: consent state, Trusted Types, router, lazy mount, click interception, partner adapters, and DX logging all live under `packages/embed-sdk` for a single entry point.
- Reuse `packages/router-helpers` for path-mode encoding/decoding so API, demo host, and SDK stay deterministic. Alternative (embedding a third-party router) was rejected because it would balloon bundle size and conflict with Phase-B budgets; augmenting the shared helpers keeps parity and reuse.
- Introduce a shared network utility (timeouts, backoff, beacons) consumed by telemetry + SDK fetchers to guarantee the §9.4 behavior; avoids duplicating logic inside feature modules.
- Admin snippet validation reads `apps/cdn/public/hub-embed@*/manifest.json` and cached build metadata; rejecting mismatches in the Admin UI ensures publishers never copy stale tags. Alternative (Validating at copy time in a CLI) lacks visibility for non-CLI users.
- SEO parity harness compares JSON-LD emitted by `apps/api/api/v1/fragment.ts` and the rendered Shadow DOM in `apps/demo-host/app/page.tsx` using shared schema snapshots to keep <1% diff and guard stable IDs.

## Phases

### Phase 1 — SDK Contract & Runtime Hardening
**Goal:** Implement all embed runtime gaps so any publisher snippet satisfies §§2–11 without relying on host-side hacks.

**Changes**
- Code: `packages/embed-sdk/src/index.ts:1` — add consent singleton (`HubEmbed.consent`), bounded queueing/flush, partner adapter registry, lazy mount, legacy `data-mount-before` flow, click interception scopes, router ownership arbitration, `[hub-embed]` logger/error catalog, deprecation guard, and event schema population (`routeName`, `previousUrl`, guaranteed `embedId`).
- Code: `packages/embed-sdk/src/router.ts:1` (new) & `packages/router-helpers/src/index.ts:1` — extend encoding/decoding to support `historyMode='path'` (list/detail templates, basePath) plus helper for direct-load hydration + optional route takeover options.
- Code: `packages/embed-sdk/src/trusted-types.ts:1` (new) & `packages/security/src/index.ts:1` — register TT policy, wire sanitization, ensure safe abort UI when policy creation fails.
- Code: `packages/embed-sdk/src/network.ts:1` (new) & `packages/telemetry/src/index.ts:1` — shared fetch/backoff utilities with default 8s timeouts, sendBeacon/unload helpers, consent-aware emission gating.
- Code: `packages/embed-sdk/src/theme.ts:1` & `packages/block-runtime/src/index.tsx:1` — enforce overlay rendering inside ShadowRoot, ensure fallback styling respects CSP order (constructable → nonce → external CSS).
- Tests: `packages/embed-sdk/src/__tests__/*` — new coverage for consent queue, TT abort path, path routing, lazy mount IO gate, legacy mount insertion, partner adapters, click interception scopes, multi-embed router ownership, deprecation telemetry, and `[hub-embed]` error catalog.

**Notes**
- Ship feature flags (e.g., `__HUB_EMBED_PATH_ROUTER__`) only for development/testing; GA build should default to enabled.
- Document host rewrite requirements for `historyMode='path'` in `docs/engineering/embed-dev.md` to avoid support churn.

**Success Criteria**  
**Automated**
- [x] Build/typecheck: `pnpm -w build`
- [x] Unit tests (SDK, helpers): `pnpm -w test --filter=embed-sdk`
- [x] Lint/style: `pnpm -w lint`
- [x] Bundle budgets (Phase-A/B measurement wired but may still fail pending Phase 2 config): `pnpm -w check:bundles`
- [x] Security scans (TT policy, dependencies): `pnpm -w security:sbom`
**Manual**
- [ ] Demo host running `pnpm dev:stack` mounts snippet using query/hash/path modes and verifies lazy mount/legacy mount flows.
- [ ] Browser session with Trusted Types enforced shows safe abort when policy creation is blocked.
- [ ] Two embeds on one page navigate independently, intercepting clicks per scope with deterministic router owner.

---

### Phase 2 — Host Tooling, Admin Policy & Observability
**Goal:** Ensure upstream tooling (Admin, CDN, SEO, performance gates) prevents non-compliant snippets and enforces parity/budget requirements.

**Changes**
- Code: `apps/admin/app/snippets/SnippetGenerator.tsx:1` (new) & `apps/admin/app/api/snippet/route.ts:1` (new) — validate selected manifest version against `apps/cdn/public/hub-embed@*/manifest.json`, block generation on missing hashes/CDN mismatch, auto-apply `crossorigin="anonymous"` + integrity attributes, surface actionable error banners.
- Code: `apps/admin/lib/plan-client.ts:1` — add manifest fetch + caching, propagate refusal reasons to UI, log `[hub-embed]` warnings server-side.
- Code: `apps/cdn/public/hub-embed@latest/manifest.json:1` & build scripts — ensure manifest publishes Phase-A/B bundle sizes so Admin can display budgets next to snippet metadata.
- Code: `apps/demo-host/lib/seoParity.ts:1` (new) & `apps/api/api/v1/fragment.ts:1` — implement JSON-LD parity harness (<1% diff) with stable `@id` validation and `noindex` enforcement for AI/personalized routes; expose CLI/test entry point.
- Code/Test: `apps/demo-host/__tests__/parity.test.tsx:1` & `apps/api/__tests__/fragment-parity.test.ts:1` — assert parity harness, overlay isolation, and router readiness (#14 acceptance test).
- Config: `turbo.json:1`, `package.json:1`, `.github/workflows/*` — wire bundle-size tasks that fail on Phase-A ceilings (UMD ≤120 kB, ESM ≤95 kB, per-block ≤30 kB) and warn on Phase-B; expose script `pnpm -w budgets:embed`.

**Notes**
- Provide admin documentation snippet in `docs/product/admin-snippet.md` describing drift refusal + remediation steps.
- JSON-LD diff harness should reuse `packages/page-schema` to avoid schema drift.

**Success Criteria**  
**Automated**
- [ ] Admin lint/tests: `pnpm -w test --filter=admin`
- [ ] SEO parity tests: `pnpm -w test --filter=demo-host`
- [ ] Bundle budgets/CI: `pnpm -w budgets:embed` invoked in CI and fails on Phase-A exceedance.
- [ ] Accessibility: `pnpm -w check:a11y` (overlays inside ShadowRoot).
- [ ] Supply chain: `pnpm -w security:provenance`
**Manual**
- [ ] Attempt to generate snippet with tampered manifest; UI blocks copy with explicit drift message.
- [ ] Review JSON-LD diff report (<1% delta) for list and detail routes via demo host Inspector.
- [ ] Inspect admin-generated snippet tags to confirm `crossorigin` + SRI attributes match manifest.

---

### Phase 3 — Acceptance Suite & Rollout Readiness
**Goal:** Codify §12 acceptance tests, finalize documentation, and harden release/rollback levers.

**Changes**
- Tests: `apps/demo-host/e2e/embed.spec.ts:1` (new Playwright/VT) covering consent gating, lazy mount, path deep-link, click interception scopes, legacy mount, partner adapters, overlay isolation, Trusted Types abort, router readiness, multi-instance analytics, and deprecation telemetry.
- Tests: `apps/admin/__tests__/snippet-generator.test.tsx:1` — ensure refusal logic + crossorigin enforcement.
- Docs: `docs/engineering/embed-dev.md:1` & `docs/engineering/ARCHITECTURE.md:1` — update with new routing modes, consent API usage, TT requirements, network budget expectations, and troubleshooting guide referencing `[hub-embed]` errors.
- Release: `scripts/turbo-run.sh:1` & `.github/pull_request_template.md:1` — add steps for budgets + acceptance suite, ensuring PR authors certify manual verifications.
- Observability: `apps/api/src/lib/telemetry.ts:1` & `packages/telemetry/src/index.ts:1` — add events/logging for consent state transitions and partner adapter callbacks for monitoring.

**Notes**
- Keep acceptance suite stable by using demo fixtures hosted in repo (no live API dependency) to avoid flaky runs.
- Document rollback strategy (revoke CDN alias, disable snippet generator) in release checklist.

**Success Criteria**  
**Automated**
- [ ] Full workspace tests: `pnpm -w test`
- [ ] Playwright E2E: `pnpm -w e2e`
- [ ] Docs lint/build (if applicable): `pnpm -w build:docs` (or `pnpm -w build` if consolidated)
- [ ] Turbo pipeline with acceptance job green: `pnpm -w ci`
**Manual**
- [ ] Dry-run release: publish manifest to staging CDN, verify Admin + demo host consume new version without regressions.
- [ ] Rollback drill: switch CDN alias back to previous version and confirm embed handles Phase-A budgets + deprecation telemetry gracefully.

## Testing Strategy
- **Unit**: embed SDK (consent queue, TT policy, router, lazy/legacy mount, adapters), router helpers (path encode/decode), admin snippet validators, telemetry schema updates.
- **Integration**: demo host parity harness comparing Light-/Shadow-DOM JSON-LD, API fragment responses with CSP/noindex headers, admin snippet refusal flows, manifest ingestion.
- **E2E/Acceptance**: Playwright flows across query/hash/path routing, consent gating, partner adapters, overlay focus management, lazy mount, multi-embed analytics, Trusted Types abort, snippet generation rejection, and Phase-A budget enforcement dashboards.
- **Observability validation**: use tracing/assertions to ensure new consent + adapter telemetry hits ClickHouse/OTel spans via local exporters before shipping.

## Performance & Security
- Enforce Phase-A bundle ceilings immediately; wire Phase-B warnings and set calendar reminder to flip to hard gate after two releases.
- Trusted Types and CSP fallbacks prevent unsafe DOM injections; sanitize markdown/HTML before passing to TT policy.
- Network helper ensures AbortController (8s) + exponential backoff + sendBeacon usage; log any aborted requests with `[hub-embed]` prefix for supportability.
- Maintain privacy by ensuring consent gating prevents partner adapters/telemetry from emitting prior to grant; buffer is size-bounded and LRU-evicts.

## Migration & Rollback
- Ship consent API + routers behind versioned CDN bundles; Admin snippet generator should enforce version pinning so rollback is just re-pointing CDN alias or instructing hosts to keep previous version.
- Maintain backward-compatible alias `window.EventsHubEmbed` for two releases; sessionStorage guard ensures one-time `sdk.deprecation` event but features remain functional.
- Provide rollback playbook in `docs/ops/ROLLBACK.md` (addendum) covering manifest revert, admin snippet freeze, and telemetry suppression toggles.

## Risks & Mitigations
- **Bundle growth jeopardizes Phase-B targets** → enforce tree-shaking, reuse shared helpers, monitor budgets per PR.
- **Consent API regressions blocking analytics** → extensive unit tests + feature-flag fallback to current behavior until QA clears.
- **Path routing misconfig by hosts** → ship documentation + console diagnostics; provide readiness probe in demo host to verify rewrites.
- **Trusted Types incompatibility on legacy browsers** → detect lack of `trustedTypes` and proceed without policy as allowed; only abort when TT enforcement exists but policy creation fails.
- **SEO parity harness flakiness** → use deterministic fixture data + snapshot diffs; fail fast with actionable diff output.

## Timeline & Owners (tentative)
- Phase 1 — 2 sprints (Platform/Embed team lead)
- Phase 2 — 1 sprint overlapping (Admin + Platform shared)
- Phase 3 — 1 sprint for QA/DevEx (QA + Docs lead)

## References
- Spec: `docs/specs/2025-11-09-events-hub-embed-final-spec-1.6.md`
- Research: `docs/research/2025-11-09-events-hub-embed-research.md`
- Missing-capabilities brief: `docs/research/events-hub-missing-capabilities.md`
- Key code: `packages/embed-sdk/src/index.ts`, `packages/router-helpers/src/index.ts`, `packages/telemetry/src/index.ts`, `apps/admin/app/blocks/BlocksClient.tsx`, `apps/demo-host/app/page.tsx`, `apps/api/api/v1/fragment.ts`, `apps/cdn/public/hub-embed@latest/manifest.json`
