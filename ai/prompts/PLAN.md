# Events Hub Execution Plans (ExecPlans)

This document describes the requirements for an execution plan ("ExecPlan") inside the Events Hub monorepo. Treat the reader as a complete beginner to this repository: they have only the current working tree and the single ExecPlan file you provide. There is no memory of prior plans and no external context.

## How to use ExecPlans and PLANS.md

When authoring an executable specification (ExecPlan), follow PLANS.md _to the letter_. If it is not in your context, refresh your memory by reading the entire PLANS.md file. Be thorough in reading (and re-reading) source material to produce an accurate specification. When creating a spec, start from the skeleton and flesh it out as you do your research.

When implementing an executable specification (ExecPlan), do not prompt the user for "next steps"; simply proceed to the next milestone. Keep all sections up to date, add or split entries in the list at every stopping point to affirmatively state the progress made and next steps. Resolve ambiguities autonomously, and commit frequently.

When discussing an executable specification (ExecPlan), record decisions in a log in the spec for posterity; it should be unambiguously clear why any change to the specification was made. ExecPlans are living documents, and it should always be possible to restart from only the ExecPlan and no other work.

When researching a design with challenging requirements or significant unknowns, use milestones to implement proof of concepts, "toy implementations", etc., that allow validating whether the user's proposal is feasible. Read the source code of libraries by finding or acquiring them, research deeply, and include prototypes to guide a fuller implementation.

## Events Hub Context

ExecPlans in this repository must laser-focus on the Events Hub architecture. Assume the reader has never seen `apps/`, `packages/`, or `tooling/` before. Spell out where to look, which modules own the requested behavior, and how data flows between the embed SDK, the composer and interpreter services, and supporting utilities.

Cite the canonical references that govern this repo:

- `docs/product/spec-v1.6.md` for product contracts, latency budgets, analytics schema, and allowed event taxonomies.
- `docs/engineering/ARCHITECTURE.md` and relevant package READMEs for module ownership, layering, and telemetry wiring.
- `CONTRIBUTING.md` for workflow, testing, and CI or supply-chain gates.
- `ai/constraints.md` for hard constraints such as bundle budgets, diversity quotas, CSP, OpenTelemetry span naming, and allowed analytics events.
- Any applicable ADRs under `docs/` when touching areas they cover (for example caching policy, provider integration, or streaming surfaces).

Store every ExecPlan under `docs/plans/` using the `YYYY-MM-DD-kebab-case-description.md` convention. Confirm the directory exists (it is tracked in this repo) and reference the saved path in your summary.

Explain how changes affect the embed SDK (Shadow DOM requirements), admin and demo apps, analytics pipeline, and data-provider adapters when relevant. Call out quota enforcement, circuit breaker behavior, and plan hashing considerations when composing or mutating AI outputs. Identify which packages (for example `packages/embed-sdk`, `packages/ai-composer`, `packages/ai-interpreter`, `packages/data-providers`, `packages/telemetry`) must be touched and how they interoperate.

All build, lint, and test instructions must use pnpm workspace commands (`pnpm -w build`, `pnpm -w lint`, `pnpm -w test`, `pnpm dev:stack`, targeted `pnpm --filter <pkg> test`, etc.). Mention Storybook, bundle, accessibility, and security gates when the change would affect them, and describe how to exercise the relevant apps under `apps/`.

## Requirements

NON-NEGOTIABLE REQUIREMENTS:

* Every ExecPlan must be fully self-contained. Self-contained means that in its current form it contains all knowledge and instructions needed for a novice to succeed.
* Every ExecPlan is a living document. Contributors are required to revise it as progress is made, as discoveries occur, and as design decisions are finalized. Each revision must remain fully self-contained.
* Every ExecPlan must enable a complete novice to implement the feature end-to-end without prior knowledge of this repo.
* Every ExecPlan must produce a demonstrably working behavior, not merely code changes to "meet a definition".
* Every ExecPlan must define every term of art in plain language or do not use it.
* When referencing analytics, telemetry, caching, streaming, or quotas, reiterate the relevant constraints from `docs/product/spec-v1.6.md` and `ai/constraints.md`. Explicitly list expected OpenTelemetry spans, analytics event payloads, and quota thresholds that must be satisfied.

Purpose and intent come first. Begin by explaining, in a few sentences, why the work matters from a user's perspective: what someone can do after this change that they could not do before, and how to see it working. Then guide the reader through the exact steps to achieve that outcome, including what to edit, what to run, and what they should observe.

The agent executing your plan can list files, read files, search, run the project, and run tests. It does not know any prior context and cannot infer what you meant from earlier milestones. Repeat any assumption you rely on. Do not point to external blogs or docs; if knowledge is required, embed it in the plan itself in your own words. If an ExecPlan builds upon a prior ExecPlan and that file is checked in, incorporate it by reference. If it is not, you must include all relevant context from that plan.

## Formatting

Format and envelope are simple and strict. Each ExecPlan must be one single fenced code block labeled as `md` that begins and ends with triple backticks. Do not nest additional triple-backtick code fences inside; when you need to show commands, transcripts, diffs, or code, present them as indented blocks within that single fence. Use indentation for clarity rather than code fences inside an ExecPlan to avoid prematurely closing the ExecPlan's code fence. Use two newlines after every heading, use # and ## and so on, and correct syntax for ordered and unordered lists.

When writing an ExecPlan to a Markdown (.md) file where the content of the file is only the single ExecPlan, you should omit the triple backticks.

Write in plain prose. Prefer sentences over lists. Avoid checklists, tables, and long enumerations unless brevity would obscure meaning. Checklists are permitted only in the `Progress` section, where they are mandatory. Narrative sections must remain prose-first.

## Guidelines

Self-containment and plain language are paramount. If you introduce a phrase that is not ordinary English ("daemon", "middleware", "RPC gateway", "filter graph"), define it immediately and remind the reader how it manifests in this repository (for example, by naming the files or commands where it appears). Do not say "as defined previously" or "according to the architecture doc." Include the needed explanation here, even if you repeat yourself.

Avoid common failure modes. Do not rely on undefined jargon. Do not describe "the letter of a feature" so narrowly that the resulting code compiles but does not meet the product expectation, such as failing to respect diversity quotas, analytics schemas, or latency budgets. Set expectations for data fixtures (for example, provider payloads under `packages/data-providers`, analytics events processed by `packages/telemetry`) and direct the reader to reusable helpers or test utilities within the repo.

* ExecPlans are living documents. As you make key design decisions, update the plan to record both the decision and the thinking behind it. Record all decisions in the `Decision Log` section.
* ExecPlans must contain and maintain a `Progress` section, a `Surprises & Discoveries` section, a `Decision Log`, and an `Outcomes & Retrospective` section. These are not optional.
* When you discover optimizer behavior, performance tradeoffs, unexpected bugs, or inverse or unapply semantics that shaped your approach, capture those observations in the `Surprises & Discoveries` section with short evidence snippets (test output is ideal).
* If you change course mid-implementation, document why in the `Decision Log` and reflect the implications in `Progress`. Plans are guides for the next contributor as much as checklists for you.
* At completion of a major task or the full plan, write an `Outcomes & Retrospective` entry summarizing what was achieved, what remains, and lessons learned. Tie the outcome back to the product spec, budgets, and telemetry requirements.

# Prototyping milestones and parallel implementations

It is acceptable--and often encouraged--to include explicit prototyping milestones when they de-risk a larger change. Examples: adding a low-level operator to a dependency to validate feasibility, or exploring two composition orders while measuring optimizer effects. Keep prototypes additive and testable. Clearly label the scope as "prototyping"; describe how to run and observe results; and state the criteria for promoting or discarding the prototype.

Prefer additive code changes followed by subtractions that keep tests passing. Parallel implementations (for example, keeping an adapter alongside an older path during migration) are fine when they reduce risk or enable tests to continue passing during a large migration. Describe how to validate both paths and how to retire one safely with tests. When working with multiple new libraries or feature areas, consider creating spikes that evaluate the feasibility of these features independently of one another, proving that the external library performs as expected and implements the features we need in isolation.

## Skeleton of a Good ExecPlan

```md
# <Short, action-oriented description>

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

Reference `ai/prompts/PLAN.md`, `docs/product/spec-v1.6.md`, `docs/engineering/ARCHITECTURE.md`, and `ai/constraints.md`. Summarize any additional docs or ADRs you rely on so the reader never has to leave this plan.

Save this ExecPlan to `docs/plans/<date>-<slug>.md` (for example `docs/plans/2025-01-08-improve-error-handling.md`) before handing it back.

## Purpose / Big Picture

Explain in a few sentences what someone gains after this change and how they can see it working. State the user-visible behavior you will enable and how it shows up in the demo host, embed SDK, or admin app.

## Progress

Use a list with checkboxes to summarize granular steps. Every stopping point must be documented here, even if it requires splitting a partially completed task into two ("done" vs. "remaining"). This section must always reflect the actual current state of the work.

- [x] (2025-10-01 13:00Z) Reproduced the failing scenario with `pnpm -w test apps/api`.
- [ ] Capture desired telemetry span additions in `packages/telemetry`.
- [ ] Wire new provider quota checks in `packages/data-providers` (remaining: backfill fixtures).

Use timestamps to measure rates of progress.

## Surprises & Discoveries

Document unexpected behaviors, bugs, optimizations, or insights discovered during implementation. Provide concise evidence (for example, failing test output, logs from `pnpm dev:stack`, or bundle size diffs).

- Observation: ...
  Evidence: ...

## Decision Log

Record every decision made while working on the plan in the format:

- Decision: ...
  Rationale: ...
  Date/Author: ...

## Outcomes & Retrospective

Summarize outcomes, gaps, and lessons learned at major milestones or at completion. Compare the result against the original purpose, noting any remaining follow-ups or budget impacts.

## Context and Orientation

Describe the current state relevant to this task as if the reader knows nothing. Name the key files and modules by full path (for example, `packages/embed-sdk/src/index.ts`, `apps/demo-host/app/page.tsx`). Define any non-obvious term you will use. Do not refer to prior plans.

## Plan of Work

Describe, in prose, the sequence of edits and additions. For each edit, name the file and location (function, module) and what to insert or change. Keep it concrete and minimal. Mention how the change dovetails with constraints: analytics schema validation in `packages/telemetry`, quota helpers under `packages/data-providers`, Shadow DOM composition in `packages/embed-sdk`, and so on.

## Concrete Steps

State the exact commands to run and where to run them (working directory). When a command generates output, show a short expected transcript so the reader can compare. Use workspace commands such as:

    pnpm install
    pnpm -w build
    pnpm --filter packages/ai-composer test
    pnpm dev:stack

Describe any local environment variables, fixtures, or feature flags required.

## Validation and Acceptance

Describe how to start or exercise the system and what to observe. Phrase acceptance as behavior, with specific inputs and outputs. If tests are involved, say "run `pnpm -w test` and expect <N> passed; the new test `<name>` fails before the change and passes after". If validation happens in the demo host, explain which route to visit, which analytics events should fire, and how to inspect OTEL spans.

## Idempotence and Recovery

If steps can be repeated safely, say so. If a step is risky, provide a safe retry or rollback path (for example, how to revert seed data or tear down feature flags). Keep the environment clean after completion.

## Artifacts and Notes

Include the most important transcripts, diffs, or snippets as indented examples. Keep them concise and focused on what proves success (test runs, bundle reports, OTEL traces).

## Interfaces and Dependencies

Be prescriptive. Name the libraries, modules, and services to use and why. Specify the types, traits or interfaces, and function signatures that must exist at the end of the milestone. Prefer stable names and paths such as `packages/ai-composer/src/index.ts` or `apps/admin/app/page.tsx`. For example:

In `packages/ai-composer/src/index.ts`, define:

    export interface Planner {
        plan(observed: ObservedState): PlannedAction[];
    }
```

If you follow the guidance above, a single, stateless agent -- or a human novice -- can read your ExecPlan from top to bottom and produce a working, observable result. That is the bar: SELF-CONTAINED, SELF-SUFFICIENT, NOVICE-GUIDING, OUTCOME-FOCUSED.

When you revise a plan, you must ensure your changes are comprehensively reflected across all sections, including the living document sections, and you must write a note at the bottom of the plan describing the change and the reason why. ExecPlans must describe not just the what but the why for almost everything. Capture the date, author, and rationale for each revision so future contributors understand the evolution of the plan.
