# Launch API-backed Admin Default Blocks

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. Reference `ai/prompts/PLAN.md`, `docs/product/spec-v1.6.md`, `docs/engineering/ARCHITECTURE.md`, and `ai/constraints.md`. Summarize any additional docs or ADRs you rely on so the reader never has to leave this plan.

## Purpose / Big Picture

Enable the admin console to reorder the canonical default block list and have that order flow through the content API into the demo host embed so editors see the same default blocks end-to-end. Today the admin `/blocks` link 404s and the demo host hydrates from a hard-coded `samplePage`; after this work, `/blocks` must fetch and persist the shared default `PageDoc`, while the demo host loads the same API-derived plan and updates only when the plan hash changes (docs/specs/2025-10-31-admin-default-blocks-spec.md:11-55, docs/research/2025-10-31-admin-default-embed-research.md:40-57). Success means a novice can drag blocks in the admin UI, save, refresh the demo host, and observe the new order with the correct analytics spans, quotas, and hashing guarantees.

## Progress

- [x] (2025-10-31 17:20Z) Drafted this ExecPlan using the MVP spec and supporting research so implementation can start from a single source (docs/specs/2025-10-31-admin-default-blocks-spec.md:15-132, docs/research/2025-10-31-admin-default-embed-research.md:40-122).
- [x] (2025-10-31 20:07Z) Milestone 1 — Implemented `/v1/plan/default` API with pointer persistence, fallback seeding, and Vitest coverage (`apps/api/api/v1/plan/default.ts`, `apps/api/src/lib/{plan,pages-store}.ts`, `apps/api/__tests__/plan-default.test.ts`).
- [x] (2025-10-31 21:45Z) Milestone 2 — Delivered admin drag-and-drop UI with optimistic saves, conflict handling, and Vitest coverage (`apps/admin/app/blocks/page.tsx`, `apps/admin/components/default-blocks/block-list.tsx`, `apps/admin/__tests__/blocks.test.tsx`).
- [x] (2025-10-31 23:30Z) Milestone 3 — Updated demo host to fetch default plan with retries, hash-aware hydration, fallback, and tests (`apps/demo-host/app/page.tsx`, `apps/demo-host/__tests__/page.test.tsx`).
- [x] (2025-11-01 03:59Z) Milestone 4 — Update shared packages (`ai-composer`, `ai-interpreter`, `page-schema`, `blocks`, `telemetry`) plus docs, seeds, and Storybook preview.

## Surprises & Discoveries

- Network access is restricted by default, so the first `pnpm install` attempt failed with `ENOTFOUND registry.npmjs.org`; retried with escalated permissions to hydrate node_modules (command transcript captured below).
  Evidence: `pnpm install` output showing ENOTFOUND retries and successful escalated run.
- `pnpm --filter @events-hub/api test` reports “No test files found” because the package script forces `--dir .`; executed `pnpm vitest run apps/api/__tests__/plan-default.test.ts` directly to validate the new suite until the test script is updated.
  Evidence: Vitest run returning four passing tests for `apps/api/__tests__/plan-default.test.ts`.
- `pnpm -w lint` and `pnpm -w test` currently fail during Turbo startup with “Unable to set up TLS / No keychain is available”; targeted package commands are used for this milestone while we document the blocker.
  Evidence: command output from Turbo showing the TLS/keychain error.
- Re-running after `npx turbo link` still produces the same TLS/keychain failure; the workstation needs a functioning system keychain (or Turbo auth token) before we can rely on workspace-wide `lint`/`test`.
- Added the missing workspace alias to `apps/admin/tsconfig.json` so Next’s type checker can resolve `@events-hub/*` imports; validated with `pnpm --filter @events-hub/admin build`.
- Admin build surfaced another missing dependency (`@dnd-kit/utilities`); pinned it in `apps/admin/package.json` so Next production builds succeed.
- Admin tests (`pnpm --filter @events-hub/admin test`) execute all workspace suites because the shared Vitest config includes `apps/**`; run time remains acceptable but note for future scoped runs.
  Evidence: Vitest output listing additional app tests when executing the admin filter.
- Package-level Vitest runs initially skipped the new suites because the shared config only targeted `__tests__` directories; broadened `tooling/config/vitest.config.ts` to include `packages/**/src/**/*.test.ts` so static plan coverage executes.
  Evidence: `pnpm vitest run packages/ai-composer/src/index.test.ts` returning two passing tests after config update.
- `tsx` CLI attempted to open a system pipe and failed under sandboxed permissions; switched the seed script to invoke `node --import tsx` which avoids the EPERM socket path and works with Node 22’s loader deprecation.
  Evidence: `pnpm --filter @events-hub/api seed:default-plan -- --tenant demo` logging the seeded plan hash.

## Decision Log

- Decision: Stand up a dedicated `/v1/plan/default` handler with tenant-aware pointers and no-TTL storage rather than overloading `/v1/compose`, matching the MVP direction and keeping default plan writes isolated from AI compose paths.  
  Rationale: Spec mandates a pointer-backed store with built-in fallback blocks while leaving `/v1/compose` untouched (docs/specs/2025-10-31-admin-default-blocks-spec.md:29-37).  
  Date/Author: 2025-10-31 / Codex GPT-5.
- Decision: Instrument new OpenTelemetry spans under the `analytics.*` namespace (`analytics.admin.default_plan.fetch|save`) and ensure the API emits `cache.pages_store.*` logs so we stay within approved prefix families (ai/constraints.md:9-10, docs/product/spec-v1.6.md:505-507).  
  Rationale: Admin default plan actions must be measurable without violating span naming rules or duplicating SDK spans.  
  Date/Author: 2025-10-31 / Codex GPT-5.
- Decision: Keep diversity and quota enforcement delegated to composer outputs, but add server-side validation that reordered plans still preserve contiguity and expose tenant context to downstream quota checks.  
  Rationale: Diversity constraints (docs/product/spec-v1.6.md:424-432, ai/constraints.md:6-7) are satisfied when block order changes do not duplicate inventory; enforcing canonical order plus plan hashing prevents bypassing composer safeguards.  
  Date/Author: 2025-10-31 / Codex GPT-5.
- Decision: Always recompute `planHash` on the server when persisting default plans, ignoring client-provided hashes to avoid stale hashes surviving reorders.  
  Rationale: `PageDocSchema` parsing retains the previous hash, so persisting without recomputation caused optimistic updates to succeed without emitting a new hash, breaking 412 safeguards.  
  Date/Author: 2025-10-31 / Codex GPT-5.
- Decision: Provide explicit “Move up/down” controls alongside drag-and-drop so keyboard users (and automated tests) can reorder blocks without pointer interactions.  
  Rationale: Ensures accessibility beyond the DnD sensor layer and makes the optimistic-save flow testable without complex pointer simulation.  
  Date/Author: 2025-10-31 / Codex GPT-5.
- Decision: Normalize fetched plans with `ensurePlanHash` and retry twice with exponential backoff before falling back to the static sample in the demo host.  
  Rationale: Guarantees consistent plan hashing for embed resets and meets the spec requirement to fail gracefully after two attempts while avoiding redundant rehydrations.  
  Date/Author: 2025-10-31 / Codex GPT-5.
- Decision: Broaden Vitest include globs to cover `packages/**/src/**/*.test.ts` so shared package suites (composer, telemetry, blocks) run under the existing CLI workflow.  
  Rationale: The prior config only matched `__tests__/` directories, causing the new static default plan tests to be skipped and masking regressions.  
  Date/Author: 2025-11-01 / Codex GPT-5.
- Decision: Execute the seed script with `node --import tsx` instead of the `tsx` binary to respect Node 22 loader deprecations and avoid creating sandbox-blocked IPC pipes.  
  Rationale: The CLI attempted to open `/var/.../tsx-*.pipe` and failed with `EPERM`; using the loader path keeps TypeScript support without additional sockets.  
  Date/Author: 2025-11-01 / Codex GPT-5.

## Outcomes & Retrospective

- Pending — summarize behavioral outcomes, remaining gaps, and follow-ups once milestones land.

## Context and Orientation

The repository hosts three apps (`apps/admin`, `apps/api`, `apps/demo-host`) and supporting packages. The admin landing page currently only links to `/blocks`, which 404s because the directory lacks a route (docs/research/2025-10-31-admin-default-embed-research.md:45-47). The demo host hydrates the embed with a static `samplePage`, not the API (docs/research/2025-10-31-admin-default-embed-research.md:50-53). `packages/page-schema` defines `PageDoc` and the canonicalization + hashing helpers (`canonicalizePageDoc`, `withPlanHash`) used across composer and router helpers (packages/page-schema/src/index.ts:321-368, docs/product/spec-v1.6.md:323-327). The API already persists encoded plans with TTL via `persistEncodedPlan` and resolves them for `/v1/plan/:id` (apps/api/src/lib/plan.ts, apps/api/api/v1/plan/[id].ts), but no pointer exists for a writeable default plan. Research highlights that admin and demo host must consume the same default payload, and persistence can reuse the existing plan utilities (docs/research/2025-10-31-admin-default-embed-research.md:40-58, 120-122). Constraints demand we respect Shadow DOM embeds, analytics schema, bundle budgets, diversity quotas, provider rate limits, and OTel span prefixes (ai/constraints.md:1-10, docs/product/spec-v1.6.md:424-441, 505-507). This feature must add a tenant-scoped pointer store so `/v1/plan/default` can serve and update the canonical `PageDoc`, surface it in `/blocks`, and ensure the demo host only reinitializes when the plan hash changes (docs/specs/2025-10-31-admin-default-blocks-spec.md:29-62).

## Plan of Work

- **Milestone 1 — Default plan service (apps/api)** — ✅ Completed 2025-10-31.  
  Create `apps/api/src/lib/pages-store.ts` implementing `getDefaultPageHash`, `setDefaultPageHash`, and in-memory fallback with no TTL, keyed as `pages:default:<tenantId>` (docs/specs/2025-10-31-admin-default-blocks-spec.md:32-36). Extend `apps/api/src/lib/plan.ts` with `persistDefaultPlan` and `resolveDefaultPlan` helpers that call `encodeCanonicalPlan` but skip TTL expiry, returning `{ canonical, encoded, planHash }`. Add `apps/api/api/v1/plan/default.ts` handling `GET` and `PUT`, validating payloads via `PageDocSchema`, enforcing optimistic concurrency with `If-Match`/`planHash`, and logging spans `analytics.admin.default_plan.fetch|save`. Add unit tests under `apps/api/__tests__/plan-default.test.ts` covering fallbacks, 412 conflicts, KV vs memory flows, and error handling. Update API config or routing exports if needed. Ensure responses expose `{ plan, encodedPlan, planHash, updatedAt }` with ISO strings.

- **Milestone 2 — Shared default plan builder and schema updates** — ✅ Completed 2025-11-01.  
  In `packages/ai-composer`, add `buildDefaultStaticPlan(tenantId: string)` returning the three placeholder blocks and passing through `withPlanHash`, so the API fallback stays consistent with composer metadata (docs/specs/2025-10-31-admin-default-blocks-spec.md:15-18, 31-32). Export this helper in `packages/ai-composer/src/index.ts` and create Vitest coverage verifying canonical order and hash stability. In `packages/page-schema`, add a lightweight `DefaultPlanResponse` type + guard if required, and document in comments how canonicalization reindexes orders (docs/research/2025-10-31-admin-default-embed-research.md:40-42). Ensure no schema changes violate existing plan hashing (docs/product/spec-v1.6.md:323-327). If we need stricter validation for block titles, incorporate it here. Update `packages/ai-interpreter` tests to confirm the canonical compose pipeline still honours diversity constraints when plans are reordered (docs/product/spec-v1.6.md:424-432) — for now, add a regression test asserting interpreter outputs still feed composer to produce hash-stable plans after manual reordering.

- **Milestone 3 — Admin `/blocks` UI** — ✅ Completed 2025-10-31.  
  Add `apps/admin/app/blocks/page.tsx` as a server component fetching `/v1/plan/default` with `cache: 'no-store'` and forwarding the plan plus `tenantId`. Introduce a client component (e.g., `apps/admin/components/default-blocks/BlockList.tsx`) using `@dnd-kit/core`/`@dnd-kit/sortable` for drag-and-drop with accessible keyboard support (docs/specs/2025-10-31-admin-default-blocks-spec.md:40-50). Maintain optimistic state, disable `Save` until order changes, surface inline success/error callouts, and handle 412 restart flows. Wire new telemetry calls via `packages/telemetry` for `analytics.admin.default_plan.save` events tied to envelope metadata. Add UI tests under `apps/admin/__tests__/blocks.test.tsx` to cover reorder, disabled save, error banner, and 412 retry. Update `apps/admin/package.json` dependencies and `.env.example` with `NEXT_PUBLIC_API_BASE`. Document required env variables directly in the plan. Add minimal styles or reuse existing tailwind tokens while respecting bundle budgets (ai/constraints.md:5).

- **Milestone 4 — Demo host embed bootstrap** — ✅ Completed 2025-10-31.  
  Refactor `apps/demo-host/app/page.tsx` to fetch `/v1/plan/default` on mount using `getApiBase()` and set local state only when `planHash` changes (docs/specs/2025-10-31-admin-default-blocks-spec.md:52-62). Provide loading and error messaging, double-retry with exponential backoff, and fallback to the inline `samplePage` only after two failures (docs/specs/2025-10-31-admin-default-blocks-spec.md:53-57). Ensure we pass both `initialPlan` and `encodedPlan` to `bootstrapEmbed`, maintaining Shadow DOM constraints (ai/constraints.md:3). Add tests under `apps/demo-host/__tests__/default-plan.test.tsx` validating loading, retry, hash guard, and fallback behaviour. Update documentation references in `docs/engineering/embed-dev.md` to explain the new fetch flow and troubleshooting steps (docs/specs/2025-10-31-admin-default-blocks-spec.md:126-129).

- **Milestone 5 — Blocks registry and Storybook preview** — ✅ Completed 2025-11-01 (bundle check awaits Turbo fix).  
  Register placeholder renderers for `block one`, `block who`, and `block three` in `packages/blocks/src/index.ts` so Storybook/Ladle previews match admin labels. Add a default-story in `packages/blocks/stories/default-plan.stories.tsx` (or Ladle equivalent) showing the three-block list. Create a root `storybook` script (`pnpm -w storybook`) pointing to `pnpm dlx ladle serve --config tooling/config/ladle.config.mjs` so contributors have a workspace command for previews. Update bundle guards if the new components add assets; ensure `pnpm -w check:bundles` remains green. Add snapshot/unit tests verifying renderer registration.

- **Milestone 6 — Telemetry & analytics wiring** — ⏳ Pending.  
  Extend `packages/telemetry` with span constants and helper methods for admin default plan events, ensuring envelopes include `planHash` and `tenantId` (docs/product/spec-v1.6.md:509-512). Implement API logging at `info`/`warn`/`error` levels per spec (docs/specs/2025-10-31-admin-default-blocks-spec.md:70-83). Ensure new spans use approved prefixes `analytics.*` or `cache.*` (ai/constraints.md:9-10). Update instrumentation docs if necessary.

- **Milestone 7 — Seeds, configuration, and QA tooling**:  
  Implement `pnpm --filter @events-hub/api seed:default-plan -- --tenant <tenantId>` to pre-populate KV pointers, per spec (docs/specs/2025-10-31-admin-default-blocks-spec.md:128-129). Update `.env.example` files in apps/admin and apps/demo-host with any new flags (e.g., `NEXT_PUBLIC_PLAN_MODE=beta`). Document feature flag handoff and how to roll out `beta` → `prod`. Ensure `docs/engineering/ARCHITECTURE.md` references the new default plan flow.

## Concrete Steps

Run commands from the repository root (`/Users/ryanderose/code/cs-eventhub-worktrees/admin-mvp/openaiplan`):

- `pnpm install` — ensure new dependencies (e.g., `@dnd-kit/*`) are installed; expect Turbo to hydrate lockfile without changes.
- `pnpm -w build` — builds all packages/apps; expect Turbo summary with zero failures.
- `pnpm -w lint` — runs Next/ESLint stacks; expect “× 0 errors”.
- `pnpm -w test` — executes Vitest suites; expect new tests (admin blocks, demo host default plan, API) to pass.
- `pnpm --filter @events-hub/api test` — focused API regression.
- `pnpm --filter @events-hub/admin test` — UI tests for `/blocks`.
- `pnpm --filter @events-hub/demo-host test` — ensures embed fetch logic stays green.
- `pnpm --filter packages/ai-composer test` and `pnpm --filter packages/ai-interpreter test` — verify shared packages after changes.
- `pnpm -w storybook` — launches Ladle/Storybook using `tooling/config/ladle.config.mjs`; expect a localhost URL showing the default blocks story.
- `pnpm -w check:bundles` — validates bundle budgets after new UI/SDK code.
- `pnpm dev:stack` — optional manual QA: spins up demo host, API, embed SDK, and CDN proxy together.

Document any command failures here with remediation steps.

## Validation and Acceptance

1. **API contract**: With the dev stack running, `curl http://localhost:3001/v1/plan/default` should return `{ plan, encodedPlan, planHash, updatedAt }` where `plan.blocks` contain the three placeholders and `plan.meta.planHash === planHash`. Before saving, hitting `PUT` with the existing hash should respond 200; replaying the same hash after a re-save should produce 412 (docs/specs/2025-10-31-admin-default-blocks-spec.md:29-37).  
   - Inspect logs for `analytics.admin.default_plan.fetch/save` spans and ensure names follow approved prefixes (ai/constraints.md:9-10).
2. **Admin UI**: Navigate to `http://localhost:3000/blocks`, rearrange blocks, click `Save`, observe success toast, and confirm the order persists after reload. Verify keyboard drag instructions and focus management for accessibility (docs/specs/2025-10-31-admin-default-blocks-spec.md:40-50). Confirm telemetry emits `analytics.admin.default_plan.save` via console debug and optional telemetry sink.
3. **Demo host**: Visit `http://demo.localhost:3002` (per `pnpm dev:stack` defaults), observe loading → hydrated state using API data. After saving new order in admin, refresh the demo host; expect no flicker unless `planHash` changed (docs/specs/2025-10-31-admin-default-blocks-spec.md:57-62). Confirm fallback triggers only after two failed fetch attempts.
4. **Quotas & diversity**: Run composer and interpreter tests; ensure no quotas regress (docs/product/spec-v1.6.md:424-441, ai/constraints.md:6-7). Optionally log plan cursor metadata to verify order normalization.  
5. **Docs & seeds**: Execute `pnpm --filter @events-hub/api seed:default-plan -- --tenant demo`, then fetch the plan to confirm KV pointer writes succeed.
6. **Bundle & Storybook**: `pnpm -w check:bundles` must pass; view the Ladle story to confirm placeholder renderers exist and align with admin labels.

Acceptance criteria are met when all automated checks pass, manual QA confirms admin ⇄ API ⇄ demo host flow, and telemetry shows correctly named spans/events.

## Idempotence and Recovery

- API `PUT` operations are idempotent when the request includes the latest `planHash`; retries after 412 errors should re-fetch and reapply the new hash.  
- The pointer store keeps encoded plans without expiry, so repeated seed runs simply overwrite the pointer; document this in the seed script help text.  
- If a save introduces invalid block structures, validation stops the write and returns 400; the admin UI should keep the optimistic state but allow retry after correction.  
- Rolling back involves re-running the seed script with the canonical fallback or manually invoking `PUT` with the original payload. No database migrations are introduced, so git revert + redeploy restores previous behavior.

## Artifacts and Notes

- `pnpm install` (initial failure without network, succeeded after escalated retry):
  ```
  $ pnpm install
  …
  ENOTFOUND registry.npmjs.org
  ```
  ```
  $ pnpm install  # with escalated permissions
  …
  Progress: resolved 1132, reused 1130, downloaded 0, added 1132, done
  ```
- `pnpm --filter @events-hub/api test` (current script emits “No test files found” because of `--dir .`):
  ```
  > @events-hub/api@0.0.0 test … vitest run --config ../../vitest.config.ts --dir . --passWithNoTests
  No test files found, exiting with code 0
  ```
- Direct Vitest invocation validating the new suite:
  ```
  $ pnpm vitest run apps/api/__tests__/plan-default.test.ts
   ✓ apps/api/__tests__/plan-default.test.ts  (4 tests)
  ```
- `pnpm --filter @events-hub/admin test` (runs shared suites via workspace config):
  ```
  > @events-hub/admin@0.0.0 test … vitest run
   ✓ apps/admin/__tests__/blocks.test.tsx  (3 tests)
   ✓ apps/api/__tests__/plan-default.test.ts  …
  ```
- `pnpm --filter @events-hub/demo-host test`:
  ```
  > @events-hub/demo-host@0.0.0 test … vitest run
   ✓ apps/demo-host/__tests__/page.test.tsx  (3 tests)
   ✓ apps/api/__tests__/plan-default.test.ts …
  ```
- `pnpm --filter @events-hub/admin build`:
  ```
  > @events-hub/admin@0.0.0 build … next build
  ✓ Compiled successfully … /blocks 17.7 kB
  ```
- `pnpm -w lint` / `pnpm -w test` (blocked by Turbo keychain/TLS error):
  ```
  $ pnpm -w lint
  turbo run lint
  x Failed to create APIClient: Unable to set up TLS. … No keychain is available.
  ```
  ```
  $ pnpm -w test
  turbo run test
  x Failed to create APIClient: Unable to set up TLS. … No keychain is available.
  ```
- Targeted Vitest passes after widening the include glob:
  ```
  $ pnpm vitest run packages/ai-composer/src/index.test.ts
   ✓ packages/ai-composer/src/index.test.ts  (2 tests)
  ```
  ```
  $ pnpm vitest run packages/page-schema/src/index.test.ts
   ✓ packages/page-schema/src/index.test.ts  (2 tests)
  ```
  ```
  $ pnpm vitest run packages/ai-interpreter/src/index.test.ts
   ✓ packages/ai-interpreter/src/index.test.ts  (3 tests)
  ```
  ```
  $ pnpm vitest run packages/blocks/src/index.test.ts
   ✓ packages/blocks/src/index.test.ts  (1 test)
  ```
  ```
  $ pnpm vitest run packages/telemetry/src/index.test.ts
   ✓ packages/telemetry/src/index.test.ts  (2 tests)
  ```
- Re-ran the API suite to confirm fallback wiring after switching to the shared builder:
  ```
  $ pnpm vitest run apps/api/__tests__/plan-default.test.ts
   ✓ apps/api/__tests__/plan-default.test.ts  (4 tests)
  ```
- Seed script validation using the new loader path:
  ```
  $ pnpm --filter @events-hub/api seed:default-plan -- --tenant demo
  Seeded default plan pointer { tenantId: 'demo', planHash: 'ae4ty53IjteDSPk8Ebq0LtGsiQj2AjijXBKPXBhmzmU', updatedAt: '2025-11-01T03:59:01.422Z' }
  ```
- Capture sample API responses and telemetry logs in this section as implementation progresses, e.g.:
  ```
  > curl -s http://localhost:3001/v1/plan/default | jq '.plan.blocks[].key'
  "block one"
  "block who"
  "block three"
  ```
- Record Vitest output (tests added in apps/api, apps/admin, apps/demo-host, packages/ai-composer, packages/ai-interpreter, packages/telemetry) once they exist.
- Include bundle report snippets if `pnpm -w check:bundles` adjusts budgets due to new client code.

## Interfaces and Dependencies

- `apps/api/src/lib/pages-store.ts` (new):  
  ```ts
  export type DefaultPagePointer = { planHash: string; updatedAt: string };
  export async function getDefaultPagePointer(tenantId: string): Promise<DefaultPagePointer | null>;
  export async function setDefaultPageHash(tenantId: string, planHash: string, updatedAt?: string): Promise<DefaultPagePointer>;
  ```  
  Must prefer KV when available and fall back to process memory without TTL.
- `apps/api/src/lib/plan.ts`:  
  ```ts
  export async function persistDefaultPlan(plan: PageDoc, tenantId: string): Promise<{ canonical: PageDoc; encoded: string; planHash: string; updatedAt: string }>;
  export async function resolveDefaultPlan(tenantId: string): Promise<{ plan: PageDoc; encodedPlan: string; planHash: string; updatedAt: string; pointer: DefaultPagePointer } | null>;
  ```  
  Always recompute `planHash` via `computePlanHash` to avoid stale metadata (docs/product/spec-v1.6.md:323-327).
- `apps/admin/tsconfig.json`: ensure `compilerOptions.paths` maps `@events-hub/*` to `../../packages/*/src` so Next type checks resolve workspace packages.
- `apps/admin/app/blocks/page.tsx`: Next.js server component fetching the latest plan with `cache: 'no-store'`, passing `apiBase`, `tenantId`, and the hydrated plan into the client component.
- `apps/admin/components/default-blocks/block-list.tsx`: Client component wrapping `@dnd-kit` sortable context, exposing both drag-and-drop and explicit “Move up/down” buttons, optimistic save flow, conflict refetch, and inline status messaging.
- `apps/demo-host/app/page.tsx`: Fetches `GET /v1/plan/default?tenantId=demo` with two-attempt exponential backoff, falls back to the local sample after failures, and only rehydrates the embed when `planHash` changes.
- `packages/ai-composer`:  
  ```ts
  export function buildDefaultStaticPlan(tenantId: string, locale?: string): PageDoc;
  ```  
  Should reuse block metadata consistent with composer’s GA block set (packages/ai-composer/src/index.ts:141-430) while keeping placeholders simple.
- `packages/ai-interpreter`: Add regression tests ensuring manual plan ordering does not conflict with interpreted filters; expose any helper APIs required for analytics correlation.
- `packages/blocks/src/index.ts`: Register placeholder renderers and export them for admin/demo host previews. Ensure they do not violate bundle budgets (ai/constraints.md:5).
- `packages/telemetry/src/index.ts`:  
  ```ts
  export type AdminDefaultPlanEvent = { type: 'analytics.admin.default_plan.save' | 'analytics.admin.default_plan.fetch'; status: 'success' | 'error'; planHash: string };
  export function recordAdminDefaultPlan(event: AdminDefaultPlanEvent): void;
  ```  
  Align with allowed analytics schema (docs/product/spec-v1.6.md:509-512, ai/constraints.md:9-10).
- Admin client code should call the API using `NEXT_PUBLIC_API_BASE`, handling fetch retries and instrumentation. Shadow DOM requirements remain unchanged (ai/constraints.md:1).

## Revision History

- 2025-10-31 — Initial ExecPlan authored by Codex GPT-5 based on MVP spec and research handoff.
- 2025-10-31 — Completed Milestone 1: default plan API, persistence helpers, fallback seeding, and Vitest coverage recorded by Codex GPT-5.
- 2025-10-31 — Completed Milestone 2: admin `/blocks` flow with drag-and-drop UI, optimistic saves, and Vitest coverage by Codex GPT-5.
- 2025-10-31 — Completed Milestone 3: demo host fetching default plan with retries, fallback, and updated Vitest coverage by Codex GPT-5.
