---
title: "Phase 3 Acceptance Spec Survey"
date: "2025-11-11 15:09 EST"
researcher: "ChatGPT Codex 5"
question: "Document docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md and map it to existing code paths"
scope: "Phase 3 spec, manual harness routes, telemetry schema, admin snippet tooling, Playwright configs, supporting docs"
assumptions: ["Phase 3 spec is the authoritative acceptance scope", "Workspace state on feature/embed-production-ready reflects current implementation"]
repository: "/Users/ryanderose/code/cs-eventhub"
branch: "feature/embed-production-ready"
commit_sha: "d76d4c5"
status: "complete"
last_updated: "2025-11-11"
last_updated_by: "ChatGPT Codex 5"
directories_examined: ["docs/", "apps/demo-host/", "apps/admin/", "apps/api/", "packages/embed-sdk/", "packages/telemetry/", "playwright/", "scripts/"]
tags: ["research", "codebase", "embed-sdk"]
---

# Research: Phase 3 Acceptance Spec Survey

**Planning Hand-off (TL;DR)**  
- Phase 3 locks GA readiness by encoding §12 acceptance criteria into deterministic automation, enforcing bundle/acceptance attestations in PRs, adding consent/adapter telemetry, and rehearsing release + rollback levers before ship (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:21`).  
- Demo-host manual harness routes already cover lazy, legacy, routing, multi-embed, and Trusted Types flows while sharing the default-plan provider, so the acceptance suite can reuse those fixtures with minimal glue (`apps/demo-host/app/manual/page.tsx:36`, `apps/demo-host/lib/useDemoPlan.tsx:33`).  
- Consent-aware telemetry schemas plus admin manifest tooling exist today, giving concrete anchors for the spec’s instrumentation and snippet refusal requirements (`packages/telemetry/src/index.ts:24`, `apps/admin/lib/embed-manifest.ts:1`, `apps/admin/app/snippets/SnippetGenerator.tsx:46`).

## Research Question (from spec)
Explain what Phase 3 (acceptance suite + rollout readiness) demands and show where the current codebase already implements the referenced components, fixtures, telemetry, and workflows (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:41`).

## System Overview (what exists today)
The workspace follows the documented split of apps (demo-host, admin, api) and shared packages (embed-sdk, telemetry, router helpers, etc.), so test harnesses, SDK instrumentation, and rollout tooling each live in purpose-built directories that mirror the architecture snapshot (`docs/engineering/ARCHITECTURE.md:8`). Demo-host’s embed development guide explains how to run the manual harness, toggle consent, and switch between linked/external bundles—the exact surfaces Phase 3 leverages for acceptance proof (`docs/engineering/embed-dev.md:44`).

## Detailed Findings

### Docs & Decisions
- Goals center on automating every §12 scenario, enforcing acceptance + budget runs before merge, wiring telemetry for consent/partner adapters, documenting routing/TT/consent behavior, and rehearsing release & rollback (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:21`).
- Deliverable table defines a dedicated Playwright spec (`apps/demo-host/e2e/embed.spec.ts`), richer manual harness coverage, admin snippet unit tests, and shared helpers that register adapters + consent toggles (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:41`).
- Canonical checklist lists nine scenarios (consent gating, lazy, legacy, router ownership, partner adapters, TT abort, deprecation telemetry, snippet refusal, overlay isolation) that require both automation and manual doc steps (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:54`).
- Workflow updates call for an `@acceptance`-scoped CI job, `scripts/turbo-run.sh` updates, and PR template checkboxes covering budgets, acceptance suite, and MCP approval (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:64`).
- Documentation tasks span embed-dev + architecture updates, appendices for the acceptance checklist, and troubleshooting guides for consent + `[hub-embed]` logs (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:72`).
- Observability work adds consent/adapters events in telemetry plus API span attributes, and Release/rollback readiness mandates dry-run publishing, CDN alias reversions, snippet generator kill-switches, and playbook updates (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:78`).
- Testing strategy reiterates the mix of Vitest (admin + telemetry), integration harness checks, Playwright acceptance tags, observability validation via ClickHouse/OTel, and regression guardrails (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:93`).
- Dependencies cite the earlier Phase 1/2 runtime work, manual harness fixtures, consent utilities, and telemetry baseline files that Phase 3 extends (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:113`).

### Domain & Data
- `packages/telemetry/src/index.ts` defines the `AnalyticsEnvelope` + `SdkEvent` union, currently covering hydration, promo, chat, AI fallback, and `sdk.deprecation`, giving the schema the spec wants to extend with consent/partner events (`packages/telemetry/src/index.ts:24`).
- `apps/demo-host/lib/useDemoPlan.tsx` provides a context that fetches/stores the default plan, exposes hash/source/origin metadata, and feeds it to manual harness components (`apps/demo-host/lib/useDemoPlan.tsx:33`).
- `apps/demo-host/lib/useDefaultPlan.ts` handles API vs fallback plan resolution, retries, and plan hashing, ensuring acceptance scenarios have deterministic data sources (`apps/demo-host/lib/useDefaultPlan.ts:1`).
- `apps/cdn/public/hub-embed@latest/manifest.json` shows the bundle metadata (version, cdnBasePath, integrity, budgets) the admin snippet tooling reads when enforcing snippet refusal and budget gates (`apps/cdn/public/hub-embed@latest/manifest.json:1`).

### Entry Points & Routing
- Manual harness index enumerates routing, path, lazy, legacy, TT, and multi-embed routes so QA can launch each scenario quickly (`apps/demo-host/app/manual/page.tsx:36`).
- Query + hash harness demonstrates `historyMode` behavior and links to `/events` for path routing coverage (`apps/demo-host/app/manual/routing/page.tsx:8`).
- `/events/[[...slug]]` mounts a path-based embed with list/detail routes, basePath awareness, and route takeover, matching the spec’s router ownership checks (`apps/demo-host/app/events/[[...slug]]/page.tsx:10`).
- Lazy mount, legacy mount, Trusted Types, and multi-embed pages each surface the copy, controls, and embed configs needed for acceptance validation (`apps/demo-host/app/manual/lazy/page.tsx:7`, `apps/demo-host/app/manual/legacy/page.tsx:7`, `apps/demo-host/app/manual/trusted-types/page.tsx:8`, `apps/demo-host/app/manual/multi/page.tsx:7`).
- The manual layout injects the default-plan banner plus consent controls before rendering each scenario, so instrumentation state is consistent across entry points (`apps/demo-host/app/manual/layout.tsx:1`).

### Core Logic
- Plan-aware wrappers pass the shared plan, planHash, and tenant ID into manual embed + legacy mount components, guaranteeing uniform data contexts (`apps/demo-host/app/manual/components/PlanAwareManualEmbed.tsx:10`, `apps/demo-host/app/manual/components/PlanAwareLegacyMount.tsx:10`).
- `ManualEmbed` loads the SDK (linked/external), applies trusted-types failure stubs when requested, hydrates via `handle.hydrateNext`, and reports consent-aware status strings (`apps/demo-host/app/manual/components/ManualEmbed.tsx:21`).
- `LegacyMountExample` bootstraps the SDK with `legacyMountBefore` selectors and tracks plan hash churn, enabling the legacy snippet-focused acceptance tests (`apps/demo-host/app/manual/components/LegacyMountExample.tsx:19`).
- Consent utilities wrap the SDK’s consent API to maintain host-level state, provide subscriptions, and expose hooks/controls for the harness toggles (`apps/demo-host/lib/consent.ts:48`).
- Manual harness controls flip consent grant/pending and emit status copy, directly satisfying the spec’s consent gating checklist item (`apps/demo-host/app/manual/components/ManualHarnessControls.tsx:6`).
- `PlanStatusBanner` surfaces plan source/origin/fallback details so acceptance runs can assert deterministic data state before interacting with embeds (`apps/demo-host/app/components/PlanStatusBanner.tsx:6`).
- `loadEmbedModule` handles linked vs external bundling and ensures the `window.EventsHubEmbed` global exists—core to legacy snippet and Trusted Types harnesses (`apps/demo-host/lib/embed-loader.ts:13`).
- The SDK itself installs a `HubEmbed` global exposing `create`, `consent`, and `registerPartnerAdapter`, which the harness and acceptance helpers directly exercise (`packages/embed-sdk/src/index.ts:505`).

### Integrations
- Partner adapters register via `packages/embed-sdk/src/partners.ts`, and events flow through `consentManager.enqueue`, ensuring buffer/flush semantics align with consent gating scenarios (`packages/embed-sdk/src/partners.ts:19`).
- `ConsentManager` tracks status, buffers payloads by byte size, and flushes once consent is granted—exactly what the spec calls for when validating buffered partner telemetry (`packages/embed-sdk/src/consent.ts:23`).
- Telemetry events are formatted via `formatTelemetryEvent` so new consent and partner event types can reuse the same envelope (`packages/telemetry/src/index.ts:40`).
- API spans start through `apps/api/src/lib/telemetry.ts`, giving a hook for the span attributes (e.g., `sdk.consent.status`) that Phase 3 wants to add (`apps/api/src/lib/telemetry.ts:1`).
- Manifest ingestion + snippet generation happens through `apps/admin/lib/embed-manifest.ts` and the snippet generator UI, which already enforce integrity, cdnBasePath drift detection, and budget reporting—the same surfaces spec §3.2 cites for snippet refusal tooling (`apps/admin/lib/embed-manifest.ts:1`, `apps/admin/app/snippets/SnippetGenerator.tsx:46`).

### Configuration & Secrets
- `apps/demo-host/lib/env.ts` derives embed mode, embed src, config URL, API base, and tenant defaults, honoring local vs remote host heuristics—a prerequisite for acceptance runs that flip between linked/external bundles (`apps/demo-host/lib/env.ts:1`).
- Manual layout wires `DemoPlanProvider` with `DEFAULT_TENANT` so every harness page shares identical plan + env context (`apps/demo-host/app/manual/layout.tsx:1`).
- Scripts such as `scripts/turbo-run.sh` enforce Turbo credentials (or allow `TURBO_ALLOW_MISSING_TOKEN=1`), matching the spec’s call to integrate acceptance/budget steps into the existing CI pipeline (`scripts/turbo-run.sh:1`).
- `.github/pull_request_template.md` already lists required gates (build, test, lint, e2e, budgets, latency, a11y, SBOM/provenance), which the spec plans to extend with acceptance + MCP checkboxes (`.github/pull_request_template.md:1`).

### Tests & Observability
- Playwright’s manual harness smoke spec already covers routing, path, lazy, legacy, TT, and multi-embed scenarios; tagging these with `@acceptance` fulfills part of the Phase 3 checklist (`playwright/projects/demo/manual-harness.spec.ts:9`).
- The default-plan spec resets and reorders the stored plan through the API, verifying that the demo host reflects admin changes and that plan hashes propagate to the DOM (`playwright/projects/demo/default-plan.spec.ts:71`).
- `playwright.config.ts` defines local + preview projects, reuse of Next.js dev servers, and trace collection rules, providing the scaffold for the new `acceptance-harness` job and MCP-aware execution described in the spec (`playwright.config.ts:39`).
- `docs/engineering/embed-dev.md` documents manual harness usage, Trusted Types console noise, consent toggles, reseeding, and bundle publishing, mirroring the knowledge-sharing deliverables in §3.4 (`docs/engineering/embed-dev.md:44`).
- Telemetry currently emits `sdk.deprecation` events, giving the baseline to extend with consent/partner events before feeding ClickHouse dashboards per §3.5 (`packages/telemetry/src/index.ts:24`).

### API/UI Surface (as applicable)
- Manual harness UI exposes card links, descriptive copy, and consent controls so QA/support can reason about acceptance failures without touching code (`apps/demo-host/app/manual/page.tsx:36`, `apps/demo-host/app/manual/components/ManualHarnessControls.tsx:6`).
- Admin’s snippet generator UI reads manifest lists, surfaces bundle budgets/warnings, and controls tenant/base-path/embed settings, directly supporting the snippet refusal checklist item (`apps/admin/app/snippets/SnippetGenerator.tsx:46`).

## Code References (Index)
- `docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:21` — Phase 3 goals/deliverables.
- `apps/demo-host/app/manual/page.tsx:36` — Manual harness index page.
- `apps/demo-host/lib/useDemoPlan.tsx:33` — Default plan provider for harness routes.
- `apps/demo-host/app/manual/components/ManualEmbed.tsx:21` — Client-side embed mount logic used by harness scenarios.
- `apps/demo-host/app/manual/components/LegacyMountExample.tsx:19` — Legacy mount simulation with `legacyMountBefore`.
- `apps/demo-host/lib/consent.ts:48` — Consent toggles and grant/revoke utilities.
- `packages/embed-sdk/src/index.ts:505` — Installed `HubEmbed` global exposing `create`, consent, and adapter APIs.
- `packages/telemetry/src/index.ts:24` — `SdkEvent` schema + telemetry envelope.
- `apps/admin/lib/embed-manifest.ts:1` — Manifest ingestion plus snippet validation logic.
- `playwright/projects/demo/manual-harness.spec.ts:9` — Existing Playwright coverage for manual harness routes.

## Architecture & Patterns (as implemented)
Apps consume shared packages per the documented topology: demo-host mounts embeds via `loadEmbedModule`, uses `DemoPlanProvider` + `useDefaultPlan` for deterministic PageDocs, and wires consent toggles before rendering harness content (`docs/engineering/ARCHITECTURE.md:8`, `apps/demo-host/lib/useDemoPlan.tsx:33`, `apps/demo-host/lib/embed-loader.ts:13`). The SDK exports a single `HubEmbed` global (with consent + adapter APIs) so host pages and harness helpers share the same surface area, aligning with the no-iframe Shadow DOM runtime described in the architecture doc (`packages/embed-sdk/src/index.ts:505`).

## Related Documentation
- `docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:41` — Acceptance automation + workflow requirements.
- `docs/engineering/embed-dev.md:44` — Manual harness usage, consent toggles, Trusted Types tips, and reseeding guides referenced by Phase 3.
- `docs/engineering/ARCHITECTURE.md:8` — System topology ensuring apps/packages separation for SDK, telemetry, and admin tooling.

## Open Questions
- The spec mandates a new `apps/demo-host/e2e/embed.spec.ts` with `@acceptance` tags, but that path does not exist yet—confirm where the acceptance suite will live and how it integrates with existing Playwright projects (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:45`).
- Admin unit tests for snippet drift (`apps/admin/__tests__/snippet-generator.test.tsx`) are required, yet there is no such test file today—clarify whether tests will co-locate with the SnippetGenerator component or elsewhere (`docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:47`).

## Follow-up (append only, as needed)
- [2025-11-11 15:09] Initial research snapshot created.

## Evidence Log
- `docs/specs/2025-11-10-events-hub-embed-phase3-acceptance-spec.md:41` — Acceptance automation table + checklist references.  
- `docs/engineering/embed-dev.md:44` — Manual harness instructions and consent toggle description.  
- `apps/demo-host/app/manual/page.tsx:36` — Route index for manual harness coverage.  
- `apps/demo-host/app/manual/components/ManualEmbed.tsx:21` — Embed mount implementation with Trusted Types stubs.  
- `apps/demo-host/lib/consent.ts:48` — Consent grant/revoke helpers powering harness toggles.  
- `packages/telemetry/src/index.ts:24` — Current telemetry schema (`SdkEvent` union).  
- `apps/admin/lib/embed-manifest.ts:1` — Manifest ingestion + bundle budget evaluation logic.  
- `playwright/projects/demo/manual-harness.spec.ts:9` — Existing Playwright smoke coverage for manual harness routes.
