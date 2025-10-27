# Events Hub — Product Build Specification v1.5

> Source of truth: see original product specification distributed with this repository. This file documents alignment points referenced by the pre-seed scaffold.

- Embeds use a Shadow DOM SDK without iframes and must meet bundle budgets (UMD ≤ 45 kB gzip).
- Admin and block authoring surfaces use React (Next.js for admin).
- AI workflow: Interpreter → Composer with deterministic output and plan hashing persisted in URLs.
- Diversity, accessibility, SEO, and analytics requirements are enforced across all packages and CI gates.

Future development must consult the authoritative v1.5 spec before implementing features.
