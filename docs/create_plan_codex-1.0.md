# Create Implementation Plan — ChatGPT Codex 5

Purpose: Use an approved product/engineering spec plus a completed research document to produce a clear, exhaustive, and executable implementation plan. This prompt is designed for ChatGPT Codex 5 in the Codex CLI. It assumes no sub‑agents and no background task spawning — Codex reads and synthesizes directly, then outputs a plan that engineers can implement efficiently.

## When Invoked

1) If parameters include one or more file paths (spec, research, ticket), immediately read those files completely before responding.
2) If no parameters provided, respond with:

```
I’ll create a precise implementation plan using your approved spec and completed research.

Please provide:
- The spec file path (e.g., docs/product/spec-v1.6.md)
- The research file path(s) (e.g., docs/research/2025-01-08-ci-map.md)
- Optional: ticket/problem statement file

I’ll read these fully and draft a complete, phase-based plan with measurable success criteria.
```

## Constraints (Codex‑specific)

- No sub‑agents or task spawning. Do all reading and synthesis in the main context.
- Prefer local repo context; do not fetch network resources unless explicitly requested.
- Read referenced files fully before planning. Avoid partial reads for primary inputs.
- Use repo‑native file references like `path/to/file.ext:42` (no URLs) when citing code.
- Use pnpm/turborepo commands for verification steps (see “Repo Commands”).
- If any critical requirement is unclear or missing from inputs, list “Pre‑Implementation Questions” and pause for answers. Do not finalize a plan with open questions.

## Process

1) Inputs and Validation
- Read the provided spec and research documents completely.
- Extract scope, goals, constraints, target quality gates, and acceptance criteria.
- Verify alignment between spec and research; note discrepancies to resolve.

2) Codebase Context (lightweight, no new research phase)
- Use local search (e.g., ripgrep) and file browsing to confirm the implementation surface and patterns mentioned in the research document. Do not expand scope beyond provided research unless the spec requires it.
- Capture key files, modules, and patterns with repo‑native references `apps/...:line` or `packages/...:line`.

3) Plan Structure Proposal
- Outline phases and deliverables; confirm that phasing matches repo conventions and CI gates.
- Ensure every phase has measurable automated and manual success criteria.

4) Detailed Plan Draft
- Write the plan (see Template) with file‑level changes, commands to run, and verification steps.
- Include “What We’re NOT Doing” to prevent scope creep.
- Include rollback/backout notes when changes are risky.

5) Present for Review
- Provide a concise summary and the plan path (see “Output Location”). Ask for confirmation or adjustments to scope, ordering, or success criteria.

## Output Location

- Write plans to `docs/plans/YYYY-MM-DD-SHORT-DESCRIPTION.md` (kebab‑case description). Examples:
  - `docs/plans/2025-01-08-parent-child-tracking.md`
  - `docs/plans/2025-01-08-improve-error-handling.md`

## Repo Commands (use in success criteria)

- Build: `pnpm -w build`
- Test: `pnpm -w test`
- Lint: `pnpm -w lint`
- Bundle checks: `pnpm -w check:bundles`
- Accessibility (optional if in scope): `pnpm -w check:a11y`
- SBOM/provenance (security, if in scope): `pnpm -w security:sbom` and `pnpm -w security:provenance`

## File Reference Style

- Use repo‑relative paths with optional 1‑based line numbers: `apps/api/src/lib/plan.ts:47`.
- Do not use URL links in the plan; keep references local and clickable in the workspace.

## Implementation Plan Template

````markdown
# [Feature/Task Name] Implementation Plan

## Overview
[1–2 sentences: what and why]

## Current State
- [Concise summary aligned to research]
- Key files/modules:
  - `path/to/file.ts:line` — [what it does]
  - `path/to/other.ts:line` — [what it does]

## Desired End State
- [Functional outcomes and observable behaviors]
- [How we will verify success]

## What We’re NOT Doing
- [Out‑of‑scope item 1]
- [Out‑of‑scope item 2]

## Implementation Approach
[High‑level strategy and rationale]

## Phases

### Phase 1 — [Descriptive Name]
#### Overview
[What this phase accomplishes]

#### Changes Required
- [Component/File Group]
  - File: `path/to/file.ext`
  - Changes: [summary]
  ```ts
  // Specific code snippet or stub to add/modify
  ```

#### Success Criteria
Automated:
- [ ] Build succeeds: `pnpm -w build`
- [ ] Unit tests pass: `pnpm -w test`
- [ ] Lint passes: `pnpm -w lint`
- [ ] Bundle checks pass: `pnpm -w check:bundles`

Manual:
- [ ] [Feature] verified via UI or API
- [ ] Edge cases validated [list]
- [ ] Performance/A11y acceptable (if applicable)

---

### Phase 2 — [Descriptive Name]
[Repeat structure]

---

## Testing Strategy
- Unit: [what to cover, edge cases]
- Integration/E2E: [flows to verify]
- Fixtures/Seeds: [if needed]

## Observability
- Tracing/analytics events to emit
- Log/metrics expectations

## Performance
- Budgets or targets; known hot paths

## Security & Privacy
- Data handling, CSP, sanitization, provenance/SBOM (if relevant)

## Migration & Backout
- Data or API migrations; rollback strategy

## Risks & Mitigations
- [Risk] → [Mitigation]

## References
- Spec: `docs/product/spec-vX.Y.md`
- Research: `docs/research/NAME.md`
- Related code: `path/to/file.ts:line`
````

## Quality Gates for the Plan

- Complete and actionable; no unresolved questions.
- Every phase has automated and manual criteria with concrete repo commands.
- References use local file paths with line numbers when helpful.
- Explicit out‑of‑scope list to limit creep.
- Includes rollback/migration notes where appropriate.

## Example Invocation

```
/create_plan docs/product/spec-v1.6.md docs/research/102925-local_ci_testing_research.md
```

Expected flow:
1) Codex reads both files fully.
2) Codex proposes a brief plan structure and confirms phase granularity.
3) Codex writes the full plan to `docs/plans/YYYY-MM-DD-SHORT-DESCRIPTION.md` and summarizes the location and highlights for review.

## Notes for Codex CLI Usage

- Keep interactions concise; focus on concrete outputs.
- Use local search (e.g., `rg`) to quickly locate patterns named in research.
- If you need more inputs (e.g., design choice), ask targeted, answer‑able questions and pause.
- Do not run destructive commands or change unrelated files.

