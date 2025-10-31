# Vercel Deployment Guide (townthink.com)

Opinionated, copy‑pasteable instructions to deploy the monorepo to Vercel. Choices baked in:

- **Config service merged into API** (`/config/tenants/[tenant].json` in `apps/api`)
- **Demo host domain** = `demo-host.townthink.com` *(apex **`townthink.com`** can be used for marketing or other purposes)*
- **Versioned CDN bundles** with stable `@latest` alias
- **Keep Vercel preview URLs**; optional vanity preview subdomains later
- **pnpm + Turborepo**, Next.js App Router

---

## 0) Repo prerequisites

- `pnpm` at workspace root (lockfile present)
- Turborepo configured to build `apps/*`
- Packages:
  - `apps/demo-host` – Next.js site (public demo)
  - `apps/admin` – Next.js admin console
  - `apps/api` – Vercel Functions / Edge routes (public API **and** Config endpoints)
  - `apps/cdn` – static CDN host for the embed SDK & manifests

---

## 1) Create Vercel projects & attach domains

Create **four** Vercel projects pointed at each root directory. Then map domains as follows:

| Project        | Root             | Domains                                                                        |
| -------------- | ---------------- | ------------------------------------------------------------------------------ |
| Demo host      | `apps/demo-host` | `demo-host.townthink.com`, **initial dev:** `cs-eventhub-demo-host.vercel.app` |
| Admin          | `apps/admin`     | `admin.townthink.com`, **initial dev:** `cs-eventhub-admin.vercel.app`         |
| API (+ Config) | `apps/api`       | `api.townthink.com`, `config.townthink.com` *(same project)*                   |
| CDN (static)   | `apps/cdn`       | `cdn.townthink.com`                                                            |

> **DNS**: Either delegate nameservers to Vercel (simplest) or add the A/ALIAS (apex) + CNAME records per Vercel’s instructions. Keep `*.vercel.app` preview hosts.

---

## 2) Project build settings

**Package manager:** `pnpm` (auto‑detected by `pnpm-lock.yaml`).

- **Demo host (Next.js)**

  - Root: `apps/demo-host`
  - Framework preset: Next.js (default build/output)

- **Admin (Next.js)**

  - Root: `apps/admin`
  - Framework preset: Next.js (default build/output)

- **API (+ Config)**

  - Root: `apps/api`
  - Framework preset: Other — Vercel automatically detects **Serverless Functions** in the `/api` directory. There is no separate "Vercel Functions/Edge" type to choose. No custom build command is required for TypeScript; Vercel transpiles it.

- **CDN (static)**

  - Root: `apps/cdn`
  - **Build Command**
    ```bash
    pnpm --filter @events-hub/embed-sdk build && pnpm publish:embed
    ```
  - **Output Directory**: `public`
  - Headers via `apps/cdn/vercel.json` (immutable for versioned assets)

---

## 3) CDN asset layout & manifest

- **Versioned bundles**: `https://cdn.townthink.com/hub-embed@<semver>/hub-embed.umd.js`
- **Stable alias**: `https://cdn.townthink.com/hub-embed@latest/hub-embed.umd.js`
- **Manifest (per version)**: `.../hub-embed@<semver>/manifest.json`
- **Stable manifest alias**: `https://cdn.townthink.com/hub-embed@latest/manifest.json`

> **Semver tags required:** Production publishes **must** use semver-style tags (`1.2.3`, `2.0.0-beta.1`, etc.) so they match the immutable caching rule and remain permanently cacheable.

`apps/cdn/vercel.json` uses Vercel's [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp) matcher (no negative lookaheads/alternation). The immutable rule matches versioned assets via `/hub-embed@:version([0-9][^/]*)/(.*)`; keep future matchers compatible with these constraints.

> Ensure `publish:embed` writes the **versioned folder** and updates **@latest** atomically.

---

## 4) Fold Config into API (routing spec)

Expose a Config endpoint inside `apps/api`:

- `GET /config/tenants/[tenant].json` → returns payload with **manifest URL** and **API base**, optionally signed.
  - Example payload:
    ```json
    {
      "tenant": "demo",
      "apiBase": "https://api.townthink.com",
      "manifestUrl": "https://cdn.townthink.com/hub-embed@latest/manifest.json",
      "embed": {
        "src": "https://cdn.townthink.com/hub-embed@latest/hub-embed.umd.js"
      }
    }
    ```

Map `` to the same **API project** in Vercel. Optionally add a rewrite for a shorter path:

- `GET https://config.townthink.com/tenants/demo.json` → rewrites to `/config/tenants/demo.json`

---

## 5) Environment variables (production) — copy/paste blocks

Update these in the Vercel dashboard for each project.

### apps/demo-host/.env.example

```env
# Public endpoints
NEXT_PUBLIC_API_BASE=https://api.townthink.com
NEXT_PUBLIC_CONFIG_URL=https://config.townthink.com/config/tenants/demo.json

# Embed delivery (production uses external CDN bundle)
NEXT_PUBLIC_EMBED_MODE=external
NEXT_PUBLIC_EMBED_SRC=https://cdn.townthink.com/hub-embed@latest/hub-embed.umd.js
NEXT_PUBLIC_EMBED_MANIFEST=https://cdn.townthink.com/hub-embed@latest/manifest.json

# App behavior
NEXT_PUBLIC_PLAN_MODE=prod
FRAGMENT_REVALIDATE_SECONDS=600
FRAGMENT_STALE_SECONDS=120

# Next.js image/domain alignment
DEMO_HOSTNAME=demo-host.townthink.com
# For initial development on Vercel:
# DEMO_HOSTNAME=cs-eventhub-demo-host.vercel.app
```

### apps/admin/.env.example

```env
# Public endpoints
NEXT_PUBLIC_API_BASE=https://api.townthink.com
NEXT_PUBLIC_CONFIG_URL=https://config.townthink.com/config/tenants/demo.json

# Optional: if the admin references the embed manifest
NEXT_PUBLIC_EMBED_MANIFEST=https://cdn.townthink.com/hub-embed@latest/manifest.json
```

### apps/api/.env.example

```env
# Persistence (recommended)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Config signing (optional)
CONFIG_SIGNING_SECRET=

# Caching / tuning (optional)
PLAN_INLINE_LIMIT=2000
PLAN_CACHE_TTL_SECONDS=3600
COMPOSER_VERSION=

# If any handlers run on Edge, keep secrets in Vercel encrypted envs
```

### apps/cdn/.env.example

```env
# No runtime variables required (static project)
```

> Keep `.env.example` files committed. Use Vercel “Production” envs for prod values and “Preview/Development” for non‑prod. Do **not** commit real secrets.

---

## 6) `vercel.json` touchpoints

\*\*API – \*\*`` (illustrative)

```json
{
  "rewrites": [
    { "source": "/v1/(.*)", "destination": "/api/v1/$1" },
    { "source": "/fragment/(.*)", "destination": "/api/fragment/$1" },
    { "source": "/config/tenants/(.*)\.json", "destination": "/api/config/tenants/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

You may also add **per‑host** headers (CSP, `x-environment`) by duplicating header blocks keyed to specific hosts if desired.

\*\*CDN – \*\*`` (illustrative)

```json
{
  "headers": [
    {
      "source": "/hub-embed@*/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/hub-embed@latest/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=300" }
      ]
    }
  ]
}
```

---

## 6.1) Troubleshooting (routes vs rewrites)

If you see this error:

> **"If **``**, **``**, **``**, **``** or **``** are used, then **``** cannot be present."**

**Cause:** Vercel requires you to use **either** the legacy `routes` array **or** the modern `rewrites`/`redirects`/`headers` keys — not both. The example above uses ``\*\* + \*\*\*\*`headers`\*\*. Make sure your `apps/api/vercel.json` does **not** include a `routes` key.

**Fix options:**

- **Recommended:** Keep `rewrites` + `headers` (as shown) and remove any `routes` key.
- **Legacy style:** If you prefer `routes`, then remove `rewrites`/`redirects`/`headers` and inline headers per route (not recommended going forward).

**Project type:** Choose **Framework preset: Other**. There is no separate "Vercel Functions/Edge" preset. Functions are auto-detected from the `/api` directory in `apps/api`.

**Minimal function example (Node runtime):**

```ts
// apps/api/api/ping.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).send('ok');
}
```

**Edge runtime example:**

```ts
// apps/api/api/edge-hello.ts
export const config = { runtime: 'edge' };
export default async function handler(request: Request) {
  return new Response('hello from edge');
}
```

---

## 7) Deployment order

1. **CDN** → build SDK + `publish:embed` to produce `@<semver>` and update `@latest`
2. **API (+ Config)** → ensure `KV_*` and `CONFIG_SIGNING_SECRET` (if used) are set; domains live
3. **Demo host** – visit `https://demo-host.townthink.com` *(or for initial development: **`https://cs-eventhub-demo-host.vercel.app`**)* and confirm the Network tab loads `hub-embed.umd.js` from CDN.
4. **Admin** – visit `https://admin.townthink.com` *(or for initial development: **`https://cs-eventhub-admin.vercel.app`**)* and confirm it talks to the API (no CORS/CSP errors).

---

## 9) Preview & release hygiene

- Keep default `*.vercel.app` preview URLs
- Add branch protections and **require Vercel preview checks** before merge
- Local CI: `pnpm ci` (build, typecheck, lint, tests) before pushing
- Optional: vanity preview subdomains (e.g., `beta.townthink.com`, `beta-api.townthink.com`) by extending project aliases

---

## 10) Security & performance notes

- Store all secrets (KV tokens, `CONFIG_SIGNING_SECRET`) in Vercel **encrypted envs**
- Consider `NODE_OPTIONS=--max_old_space_size=4096` if builds run hot in CI
- Lock Next.js image domains via `next.config.*` using `DEMO_HOSTNAME`
- Align CSP/CORS on API routes; prefer allowlists instead of `*`

---

## 11) Optional developer envs (local)

### apps/demo-host/.env.local

```env
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_CONFIG_URL=http://localhost:3000/config/tenants/demo.json
NEXT_PUBLIC_EMBED_MODE=linked
NEXT_PUBLIC_EMBED_SRC=http://localhost:5173/hub-embed.umd.js
NEXT_PUBLIC_EMBED_MANIFEST=http://localhost:5173/manifest.json
DEMO_HOSTNAME=localhost
FRAGMENT_REVALIDATE_SECONDS=5
FRAGMENT_STALE_SECONDS=1
```

### apps/admin/.env.local

```env
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_CONFIG_URL=http://localhost:3000/config/tenants/demo.json
NEXT_PUBLIC_EMBED_MANIFEST=http://localhost:5173/manifest.json
```

### apps/api/.env.local

```env
# For local-only dev; production uses Vercel KV
KV_REST_API_URL=
KV_REST_API_TOKEN=
CONFIG_SIGNING_SECRET=dev-secret
PLAN_INLINE_LIMIT=2000
PLAN_CACHE_TTL_SECONDS=60
```

---

## 12) One‑pager checklist (TL;DR)

1. Create 4 Vercel projects (`apps/demo-host`, `apps/admin`, `apps/api`, `apps/cdn`)
2. Map domains: `demo-host.townthink.com`, `admin.townthink.com`, `api.townthink.com`, `config.townthink.com`, `cdn.townthink.com`
3. Set envs from the `.env.example` blocks above
4. CDN: run `pnpm --filter @events-hub/embed-sdk build && pnpm publish:embed` → deploy
5. API (+ Config): deploy, verify `/config/tenants/demo.json`
6. Demo host + Admin: deploy, verify via Network/console
7. Add branch protections + Vercel preview checks
8. Smoke test with the curl commands

---

**Done.** Copy these blocks into the repo as `vercel_deployment.md`, and commit the four `.env.example` files in their respective app folders.

