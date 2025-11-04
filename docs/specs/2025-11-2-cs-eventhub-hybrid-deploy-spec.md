---
title: "Hybrid Dev Servers + Preview Deployments"
date: "2025-11-02"
authors: ["ChatGPT Codex 5"]
status: "draft"
---

# Hybrid Dev Servers + Preview Deployments

**Repository:** `cs-eventhub`  
**Apps:** `apps/demo-hosts` (Next.js), `apps/admin` (Next.js), `apps/api` (Node/TS)  
**Tooling:** pnpm, Turborepo, Playwright, Vitest, MSW  

---

## Executive Summary (Findings & Recommendation)

We evaluated two approaches:

- **Pattern A — Framework‑native dev servers only**: Fast, token‑efficient, and non‑interactive for agents. Great for standard UI and API iteration. However, it lacks fidelity for runtime‑coupled surfaces (Next.js Middleware/Edge, auth/cookies on deployed domains, ISR/cache/CDN semantics).
- **Alternative Hybrid — Local TS server + Preview Deployments**: Use local for speed and escalate to a **Vercel Preview Deployment** only when parity matters (Middleware/Edge/auth/ISR/assets).

**Recommendation: adopt the hybrid.** Keep the inner loop fast using native dev servers and a local TS server; run a **small “smoke” suite** against **Preview** when changes or tests touch runtime‑coupled surfaces. This preserves developer/agent speed and gives production‑faithful verification where it counts.

---

## 1) Purpose & Scope

Enable coding agents (and humans) to run, test, and verify `cs-eventhub` apps **without interactive prompts** while guaranteeing **production‑faithful behavior** before merge. This spec standardizes the dev servers, test matrix, environment handling, and CI workflow.

**In scope:** local dev servers, Playwright E2E, API contract tests, preview smoke tests, MSW mocking, Telemetry mode, Turborepo orchestration, CI.  
**Out of scope:** full Vercel runtime emulation locally; production observability specifics (covered elsewhere).

---

## 2) Policy — Two Lanes (Local & Preview)

**Lane L (Local, default)**  
- Start apps with **framework‑native dev servers**: `next dev` for web apps, a **local TS server** (Express/Fastify/Nest/etc.) for the API.  
- Use **MSW** to mock remote dependencies so tests are deterministic and fast.  
- Run **Playwright local projects** that auto‑start dev servers via `webServer`.

**Lane P (Preview, escalate when needed)**  
Escalate to **Preview** when any feature/test is **runtime‑coupled**:
- Next.js **Middleware**/**rewrites**/**headers**
- **Edge runtime** APIs/streams
- **Auth** redirects & cookies (domain/secure/SameSite differences)
- **ISR/cache**/CDN headers & revalidate semantics
- **Static assets** paths/CDN behavior

Run a **small smoke suite** on the **Preview URL** (source of truth for Vercel behavior).

---

## 3) Architecture & Folder Layout

```
/apps
  /demo-hosts           # Next.js app (dev on 3000)
  /admin                # Next.js app (dev on 3001)
  /api                  # Node/TS service (dev on 4000)
    /adapters
      /local            # e.g., express/fastify adapter for dev/tests
      /vercel           # thin Edge/Serverless adapter for prod/preview
/packages
  /core-plan            # pure domain logic (no framework deps)
  /contracts            # zod DTOs, shared request/response types
/playwright
  /projects
    demo/               # demo-hosts tests
    admin/              # admin tests
    api/                # optional API contract tests
  /mocks                # MSW handlers
  fixtures/             # shared test helpers & data
docs/specs/sdd-hybrid-dev.md   # this document
```

**Dual Adapters**  
- **`packages/core-plan`**: Single‑source business logic (pure functions).  
- **`apps/api/adapters/local`**: Wraps core in a Node server for dev/tests.  
- **`apps/api/adapters/vercel`**: Wraps core in Edge/Serverless handlers for preview/prod.

---

## 4) Environment & Ports

- **Ports**: `demo-hosts` 3000, `admin` 3001, `api` 4000.  
- **Host**: `0.0.0.0` for sandbox portability.  
- **Per‑app env files**: keep `.env.local` inside each app. Only `NEXT_PUBLIC_*` variables are exposed to the browser (Next.js behavior).  
- **Optional**: hydrate `.env.local` from Vercel with `vercel env pull` (no `vercel dev` required).

**Example:** `apps/demo-hosts/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
FEATURE_FLAG_EXAMPLE=true
```

---

## 5) Package Scripts

**`apps/demo-hosts/package.json`**
```json
{
  "name": "@events-hub/demo-hosts",
  "scripts": {
    "dev": "next dev -p ${PORT:-3000} -H 0.0.0.0",
    "build": "next build",
    "start": "next start -p ${PORT:-3000} -H 0.0.0.0",
    "test:e2e:local": "playwright test --project=demo-hosts-local",
    "test:e2e:preview": "PREVIEW_URL=$PREVIEW_URL playwright test --project=demo-hosts-preview"
  }
}
```

**`apps/admin/package.json`**
```json
{
  "name": "@events-hub/admin",
  "scripts": {
    "dev": "next dev -p ${PORT:-3001} -H 0.0.0.0",
    "build": "next build",
    "start": "next start -p ${PORT:-3001} -H 0.0.0.0",
    "test:e2e:local": "playwright test --project=admin-local",
    "test:e2e:preview": "PREVIEW_URL=$PREVIEW_URL playwright test --project=admin-preview"
  }
}
```

**`apps/api/package.json`**
```json
{
  "name": "@events-hub/api",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test:contract:local": "vitest run --config vitest.contract.ts --reporter=dot",
    "test:contract:preview": "PREVIEW_URL=$PREVIEW_URL vitest run --config vitest.contract.ts --reporter=dot"
  }
}
```

Add a **health** endpoint to simplify readiness checks:
```ts
// apps/api/src/routes/health.ts
import { Request, Response } from 'express';
export const health = (_req: Request, res: Response) => res.status(200).send('OK');
```

---

## 6) Turborepo

**`turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "envMode": "strict",
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "passThroughEnv": ["PORT", "HOST", "NEXT_PUBLIC_*", "API_URL"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

---

## 7) Playwright — Local & Preview Projects

**`playwright.config.ts`**
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'playwright',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { trace: 'on-first-retry' },

  projects: [
    // Local profile — auto-start servers
    {
      name: 'demo-hosts-local',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
      webServer: {
        command: 'pnpm --filter @events-hub/demo-hosts dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000
      }
    },
    {
      name: 'admin-local',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
      webServer: {
        command: 'pnpm --filter @events-hub/admin dev',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 120_000
      }
    },
    {
      name: 'api-local',
      webServer: {
        command: 'pnpm --filter @events-hub/api dev',
        url: 'http://localhost:4000/health',
        reuseExistingServer: true,
        timeout: 120_000
      }
    },

    // Preview profile — no local servers; target the deployed URL
    {
      name: 'demo-hosts-preview',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PREVIEW_URL
      }
    },
    {
      name: 'admin-preview',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PREVIEW_URL
      }
    }
  ]
});
```

> Implementation note: the repository keeps the canonical config at `tooling/config/playwright.config.ts`
> (re-exported via `playwright.config.ts`) so agents can inspect the exact project definitions.

**Example local E2E test**
```ts
// playwright/projects/admin/login.spec.ts
import { test, expect } from '@playwright/test';

test('Admin login validation', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('bad@example.com');
  await page.getByLabel(/password/i).fill('wrong');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();
});
```

**Optional visual regression (stable surfaces only)**
```ts
test('Dashboard baseline', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot();
});
```

- Repository paths: local smoke tests live in `playwright/projects/**` with shared handlers under `playwright/mocks/`.

---

## 8) Contract Tests (Conformance Matrix)

Run the same contract tests **locally** and on **Preview** to validate API behavior.

**`apps/api/vitest.contract.ts`**
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['playwright/projects/api/**/*.contract.{ts,tsx}'],
    reporters: 'default'
  }
});
```

**`playwright/projects/api/plan.contract.ts`**
```ts
import { describe, it, expect } from 'vitest';
import { request } from 'undici';

const base = process.env.PREVIEW_URL || 'http://localhost:4000';

describe('Plan contracts', () => {
  it('GET /v1/plan/default returns normalized shape', async () => {
    const res = await request(`${base}/v1/plan/default`);
    expect(res.statusCode).toBe(200);
    const body = await res.body.json();
    expect(body).toMatchObject({ id: expect.any(String), tiers: expect.any(Array) });
  });
});
```

**Commands**
```bash
pnpm --filter @events-hub/api test:contract:local
PREVIEW_URL="https://<preview-url>" pnpm --filter @events-hub/api test:contract:preview
```

---

## 9) API Mocking with MSW (recommended)

Use MSW to decouple UI tests from API availability when the real API isn’t the focus.

```
/playwright/mocks/handlers.ts   # export const handlers = [...]
/playwright/mocks/node.ts       # setupServer(...handlers)
```

**`playwright/mocks/node.ts`**
```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

Enable in a test setup file or per‑project fixture:
```ts
import { server } from '../mocks/node';
import { beforeAll, afterEach, afterAll } from '@playwright/test';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 10) Parity Canary (fast fail)

Create a tiny suite that runs **twice**—Local and Preview—and diffs the critical bits:

- Redirect chain (status + `Location`)  
- `Set-Cookie` (names/flags/domain/expires)  
- Cache headers on ISR/static routes  
- Edge streaming endpoint returns chunked content

**`playwright/fixtures/parity.ts`**
```ts
import { request as undici } from 'undici';

type Check = { path: string; pickHeaders: string[] };
export async function compareEndpoints(baseA: string, baseB: string, checks: Check[]) {
  for (const { path, pickHeaders } of checks) {
    const [a, b] = await Promise.all([undici(baseA + path), undici(baseB + path)]);
    if (a.statusCode !== b.statusCode) throw new Error(`Status mismatch for ${path}`);
    for (const h of pickHeaders) {
      const va = a.headers[h.toLowerCase()];
      const vb = b.headers[h.toLowerCase()];
      if (String(va) !== String(vb)) throw new Error(`Header mismatch ${h} for ${path}: ${va} vs ${vb}`);
    }
  }
}
```

**`playwright/projects/demo/parity.canary.spec.ts`**
```ts
import { test } from '@playwright/test';
import { compareEndpoints } from '../../fixtures/parity';

const LOCAL = 'http://localhost:3000';
const PREVIEW = process.env.PREVIEW_URL!;

test('parity canary (local vs preview)', async ({}) => {
  test.skip(!PREVIEW, 'PREVIEW_URL required');
  await compareEndpoints(LOCAL, PREVIEW, [
    { path: '/middleware-path', pickHeaders: ['location', 'set-cookie'] },
    { path: '/api/stream', pickHeaders: ['transfer-encoding'] },
    { path: '/isr-page', pickHeaders: ['cache-control'] }
  ]);
});
```

---

## 11) CI Workflow (GitHub Actions)

Install Playwright via CLI (the GH Action is archived), run local suites, and run preview smoke when escalation triggers.

**`/.github/workflows/e2e.yml` (excerpt)**
```yaml
name: e2e
on: [push, pull_request]

jobs:
  local:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: corepack enable
      - run: pnpm i --frozen-lockfile
      - run: npx playwright install --with-deps

      - run: pnpm -w turbo run build
      - run: pnpm -w playwright test --project=demo-hosts-local --project=admin-local
      - run: pnpm --filter @events-hub/api test:contract:local

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-local
          path: playwright-report

  preview-smoke:
    # replace the condition with your escalation rule (labels, paths, or PR title/body marker)
    if: contains(github.event.pull_request.title, '[preview]') || contains(github.event.pull_request.body, 'preview:')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: corepack enable && pnpm i --frozen-lockfile
      - run: npx playwright install --with-deps

      # Example: fetch Preview URL via marketplace action (or via Vercel API)
      - name: Fetch Vercel preview URL
        uses: patrickedqvist/vercel-preview-url@v1
        id: vercel
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
          teamId: ${{ secrets.VERCEL_TEAM_ID }}
          projectId: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Run preview smoke
        env:
          PREVIEW_URL: ${{ steps.vercel.outputs.preview_url }}
        run: |
          pnpm --filter @events-hub/api test:contract:preview
          pnpm playwright test --project=demo-hosts-preview --project=admin-preview

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-preview
          path: playwright-report
```

---

## 12) Telemetry & Observability

Introduce a simple switch to avoid polluting production analytics in dev/tests:

- `TELEMETRY_MODE=dev|noop|prod`  
  - `dev`: write to a dev collector or stdout  
  - `noop`: drop events but **validate** payload shape  
  - `prod`: real telemetry (never set in tests/sandboxes)

Ensure the telemetry client throws **no** on‑by‑default network errors in `dev`/`noop`.

---

## 13) Agent Runbook

1. `pnpm i`
2. Start locally:
   ```bash
   pnpm --filter @events-hub/demo-hosts dev   # http://localhost:3000
   pnpm --filter @events-hub/admin dev        # http://localhost:3001
   pnpm --filter @events-hub/api dev          # http://localhost:4000
   ```
   or `turbo run dev` to run all.
3. Local tests:
   ```bash
   pnpm playwright test --project=demo-hosts-local --project=admin-local
   pnpm --filter @events-hub/api test:contract:local
   ```
4. Preview tests (when runtime‑coupled):
   ```bash
   PREVIEW_URL="https://<your-preview>" pnpm playwright test --project=demo-hosts-preview --project=admin-preview
   PREVIEW_URL="https://<your-preview>" pnpm --filter @events-hub/api test:contract:preview
   ```
5. Inspect failures with the HTML report & trace viewer under `playwright-report/`.

---

## 14) Runtime Traps Checklist (gate in CI)

- Middleware matcher behavior (path/basePath/localization)  
- Edge runtime Web APIs vs Node APIs; package compatibility  
- Auth redirects & cookies (domain, Secure, SameSite)  
- Cache‑Control/ISR revalidate semantics & CDN headers  
- CORS (localhost vs preview domain)  
- Static asset paths (`/_next/static`, `public/`)  
- Streaming (Transfer‑Encoding/Content‑Encoding)

---

## 15) Definition of Ready (DoR)

- Acceptance criteria written as Playwright specs (local first; mark preview‑smoke if runtime‑coupled)  
- Required env vars enumerated with safe defaults in `.env.local.example`  
- Fixtures and MSW handlers defined for external calls

## 16) Definition of Done (DoD)

- Local dev servers start on fixed ports with **no interactive prompts**  
- Local E2E and contract suites pass; **Preview smoke** passes if escalation applies  
- Parity canary green (headers/cookies/redirects/streaming)  
- CI artifacts (reports, traces) uploaded

---

## 17) Appendix

### A. Minimal local API server (Express)
```ts
import express from 'express';
import { health } from './routes/health';
const app = express();
app.get('/health', health);
// ... mount your handlers/adapters
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`API on ${PORT}`));
```

### B. MSW handler sketch
```ts
import { http, HttpResponse } from 'msw';
export const handlers = [
  http.get('/v1/plan/default', () => HttpResponse.json({ id: 'default', tiers: [] }))
];
```

### C. pnpm filter examples
```bash
pnpm --filter @events-hub/admin dev
pnpm --filter "./apps/*" build
```

---

**End of spec.**
