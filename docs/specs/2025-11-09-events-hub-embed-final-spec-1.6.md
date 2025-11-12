# Events Hub — Canonical Embed Snippet & Demo Host Parity  
**Final 1.6**

**Status:** Ready for development  
**Patched Date:** 2025-11-08  
**Owners:** Platform (Embed SDK), Experience (Blocks/UI), Admin, Infra/SecOps  
**Audience:** Staff engineers, tech leads, EMs, Staff PMs

> This document finalizes the canonical, **no‑iframe** JavaScript embed for the Events Hub across 3,000+ media sites, aligned to the v1.6 product specification. It standardizes the embed snippet, SDK contract, CDN/SRI policy, Admin snippet generator, Demo Host parity, telemetry, SEO/SSR parity, and acceptance gates. It also includes hardening for MutationObserver/ResizeObserver, strict CSP‑safe theming with fallbacks, a single CustomEvent bridge, **Trusted Types**, and a **consent + partner adapter** model.

---

## Changelog (1.6 from Draft 1.5)

- **NEW §2.4 Legacy Mount Fallback:** document‑order placeholder via `data-mount-before="#scriptId"`; no `document.write`; noscript fallback.
- **SDK surface:** retained `refresh({ plan?, planShortId? })` and added clarity on URL mutation honoring `historyMode`; kept `navigate()` and `getRoute()`; extended **event schema** with `routeName` and `previousUrl`.
- **Consent & privacy (§7):** public `HubEmbed.consent` API with bounded buffering + flush; optional auto‑integration with IAB TCF v2 when detected.
- **Telemetry (§8):** partner adapter interface (`registerPartnerAdapter`) with consent awareness; multi‑instance analytics requirements tightened; one‑time `sdk.deprecation` emission during global rename alias period.
- **CSP & security (§9.3):** **Trusted Types policy** for HTML/script URLs; allow‑list markdown/HTML sanitization; font policy (no `@import`, SRI for external fonts); guidance for map/API keys.
- **Network resilience (§9.4):** default `AbortController` **8s** timeouts; non‑critical telemetry may queue via `navigator.sendBeacon`.
- **Performance budgets (§9.1):** introduce **Phase A (transition)** and **Phase B (target)** gates; CI enforces both, Phase A as hard gate during transition window.
- **Accessibility (§9.2):** overlays (menus/dialogs/tooltips) MUST render inside the active embed’s **Shadow Root**; portal‑to‑`document.body` is disallowed.
- **SEO/SSR parity (§5):** add JSON‑LD parity check (≤1% diff), stable `@id`, and **noindex** coverage for AI/personalized routes.
- **Lazy behavior (§2.1):** when `data-lazy="true"`, defer **all** network calls and block hydration until within **1.5× viewport height**; allow a sub‑1 kB **HEAD** pre‑validation request.
- **Manifest & versions (§6):** Admin MUST refuse snippet generation on missing SRI, CDN mismatch, or unknown version; all generated `<script>/<link>` tags **MUST** include `crossorigin="anonymous"`.
- **Developer Experience (§11):** standardized console prefix `[hub-embed]` and clear errors for top 5 failure modes (SRI, CSP, router, consent, plan).
- **Acceptance tests (§12):** new tests for Trusted Types, partner adapters, overlay isolation, router readiness, and Phase‑A budgets.

---

## 0) Executive summary

- **One canonical, no‑iframe JavaScript embed** renderable on heterogeneous CMS pages via Shadow DOM, with strict CSP posture (SRI + `crossorigin`) and SSR/SEO parity for non‑AI pages. Iframes remain out‑of‑scope for v1.6 (kept in mind for future).  
- **Multi‑tenant at scale:** Each media property receives a hub‑specific copy‑paste snippet from Admin with version pinning/LTS channel.  
- **Isolation & resilience:** Shadow DOM, Mutation/ResizeObservers, history isolation modes (**including optional path‑based routing**), and CSP‑safe theming fallbacks.  
- **Ops‑friendly:** Versioned CDN manifest with SRI; Admin generator emits dual‑tag (ESM + UMD), opt‑in preconnect, consent gating, and lazy mount.  
- **Telemetry & quality gates:** OpenTelemetry spans/events, strict perf budgets (with a short Phase‑A transition), WCAG 2.2 AA, Trusted Types, and a comprehensive acceptance suite.  

---

## 1) Non‑goals / assumptions

- Back‑end data model, plan authoring, and tenancy/permissions are addressed elsewhere. This document focuses on **embed strategy**.  
- AMP and an iframe fallback are **not** shipped in v1.6; a future doc may specify them.  

---

## 2) Embed snippet & behavior

### 2.1 Declarative snippet (recommended; auto‑bootstrap)

```html
<!-- Optional performance hints -->
<link rel="preconnect" href="https://cdn.your-cdn.com">
<link rel="preconnect" href="https://api.your-domain.com">

<div
  data-hub-embed
  data-embed-id="newsroom-123"             <!-- recommended stable per instance -->
  data-tenant-id="demo"                    <!-- required -->
  data-base-path="/events"                 <!-- default '/events' -->
  data-section="default"
  data-plan-short-id="Qz4p2Y..."           <!-- optional -->
  data-theme='{"--hub-color-primary":"#0a67ff"}'  <!-- optional; allow‑listed -->
  data-history-mode="query"                <!-- 'query' | 'hash' | 'none' | 'path' -->
  data-lazy="true"                         <!-- optional lazy mount -->
  data-csp-nonce="__NONCE__"               <!-- optional CSP nonce for styles -->
></div>

<!-- Progressive delivery with SRI: identical public API -->
<script type="module" crossorigin="anonymous"
        src="https://cdn.your-cdn.com/hub-embed@1.6.0/hub-embed.esm.js"
        integrity="sha384-REPLACE_FROM_MANIFEST"></script>
<script nomodule crossorigin="anonymous"
        src="https://cdn.your-cdn.com/hub-embed@1.6.0/hub-embed.umd.js"
        integrity="sha384-REPLACE_FROM_MANIFEST"></script>
```

**Behavior (normative):**
- On load, the SDK scans for `[data-hub-embed]` containers and mounts via `HubEmbed.create`.
- **Shadow DOM isolation** with idempotent mount (`data-mounted` guard) and graceful abort on unsupported environments.
- **Strict CSP theming:** tokens from `data-theme` or tenant defaults are serialized into a **constructable stylesheet** adopted by the shadow root.  
  - If constructable stylesheets are disallowed by host CSP, fall back in order to:  
    **(1)** nonced `<style nonce="...">` using `data-csp-nonce`, then  
    **(2)** external theme CSS `<link rel="stylesheet" href=".../theme@<hash>.css">` emitted by Admin, with SRI.  
  - Unknown theme tokens are rejected (fail‑closed).
- **Optional lazy mount:** if `data-lazy="true"`, **defer all network activity and block hydration** until the container is within **1.5× viewport height** (IntersectionObserver). The embed **MAY** issue one lightweight **HEAD** request (<1 kB) to pre‑validate plan availability.

### 2.2 Imperative snippet (advanced/programmatic)

```html
<div id="events-hub"></div>
<script>
  window.HubEmbed = window.HubEmbed || window.EventsHubEmbed;

  HubEmbed.create({
    el: '#events-hub',
    initialState: { page: window.__initialPage, catalog: window.__catalog },
    config: {
      basePath: '/events',
      section: 'default',
      useShadowDom: true,
      theme: window.__themeTokens,
      historyMode: 'query', // 'query' | 'hash' | 'none' | 'path'
      routes: { list: '/events', detail: '/events/event/:slug' }, // optional
      routeTakeover: 'none' // 'none' | 'container' | 'document'
    },
    onEvent: (e) => window.dispatchEvent(
      new CustomEvent('hub-embed:event', { detail: e })
    )
  });
</script>
```

### 2.3 Plan resolution (precedence; namespaced params)

1. `?hubPlan=<encodedPlan>` (URL query; replaces generic `?plan=` to avoid collisions)  
2. `?hubPlanId=<shortId>` → `GET /v1/plan/:shortId`  
3. `data-plan` (encoded)  
4. `data-plan-short-id`  
5. Default: `GET /v1/plan/default?tenantId=<data-tenant-id>`  

**Routing isolation controls:** `config.historyMode` / `data-history-mode`  
- `'query'` (default): keep `?hubPlan=` synchronized using History API.  
- `'hash'`: sync plan state to `#hubPlan=...` without touching query params.  
- `'none'`: no URL mutation (disables deep‑linking).  
- `'path'`: uses the History API to read/write path segments under `basePath`, using default or provided templates.

On hydration/streaming updates, the SDK encodes the active plan according to the selected history mode.

### 2.4 Legacy mount fallback

Some publishers inject scripts synchronously and cannot alter surrounding markup. Provide a **document‑order placeholder** mechanism:

- If the injector is synchronous and markup cannot be altered, the SDK **MAY** honor `data-mount-before="#scriptId"` on the global script tag; the embed mounts **immediately before** the script tag whose id matches `scriptId`.  
- `document.write` is **not** shipped; instead, render a visible `<noscript>` message for browsers with scripting disabled.

**Constraints & notes:** `scriptId` **MUST** be unique within the document; if not found, no legacy mount occurs and a console warning is emitted.

---

## 3) SDK surface (TypeScript)

```ts
export type CreateArgs = {
  el: HTMLElement | string;
  initialState: PageDoc | { page: PageDoc; catalog?: Catalog } | null;
  onEvent?: (e: SdkEvent) => void;
  config?: {
    useShadowDom?: boolean;
    theme?: Record<string, string>;
    basePath?: string;
    section?: string;
    historyMode?: 'query' | 'hash' | 'none' | 'path';
    routes?: { list: string; detail: string };
    routeTakeover?: 'none' | 'container' | 'document';
  };
};

export interface EmbedHandle {
  destroy(): void;
  /**
   * Refresh current view. When `historyMode` persists plan state,
   * this SHOULD update the URL accordingly (query/hash/path) without hard reload.
   */
  refresh(next?: Partial<{ plan: string; planShortId: string }>): Promise<void>;

  /**
   * Programmatic navigation.
   * When historyMode='path', writes to the browser URL; otherwise mutates hash/query or internal state.
   */
  navigate(to: string | { view: 'list' | 'detail'; slug?: string }, opts?: { replace?: boolean }): void;

  /** Returns current route snapshot derived from URL/state. */
  getRoute(): { view: 'list' | 'detail'; slug?: string };
}

// Event contract
export interface SdkEvent {
  type: string;
  tenantId: string;
  version: string;
  embedId?: string;
  route?: { view: 'list' | 'detail'; slug?: string }; // included on route changes
  routeName?: string;    // e.g., 'list' | 'detail' | custom route id
  previousUrl?: string;  // last known URL to preserve transition analytics
  // ...additional fields per event
}

export function create(args: CreateArgs): Promise<EmbedHandle>;
```

**Event payload requirements (normative):** every `SdkEvent` MUST include `{ tenantId, version }` and SHOULD include `embedId` when present.

---

## 4) Declarative attributes & script requirements

**Container attributes**
- `data-tenant-id` **(required)**  
- `data-embed-id` **(recommended; stable per instance for analytics)**  
- `data-base-path` (default `/events`)  
- `data-section` (theme/section variant)  
- `data-plan` (encoded)  
- `data-plan-short-id` (shortId)  
- `data-theme` (JSON; allow‑listed tokens only → shadow stylesheet)  
- `data-history-mode` (`query` | `hash` | `none` | `path`)  
- `data-route-templates` (JSON string) — optional; `{ "list": "<path>", "detail": "<path/:slug>" }`
- `data-route-takeover` — optional; `'none' | 'container' | 'document'` (default `'none'`)
- `data-router-root` — optional boolean; when multiple embeds request takeover, the instance with this attribute owns URL handling.
- `data-lazy` (`true` | `false`)  
- `data-csp-nonce` (string; enables nonced `<style>` fallback)

**Script attributes**
- `crossorigin="anonymous"` **and** `integrity="sha384‑…"` **required** (CDN hosted).
- Optional **legacy mount** hint on the script element: `data-mount-before="#scriptId"`.

---

## 5) Routing, SEO/SSR parity

- Router syncs filters and detail routes (`/events/:slug`) with URL; emits `sdk.sectionChanged` on section changes.  
- URL mutation behavior respects `historyMode`.
  - `'query'`: uses `?hubPlan=` (and other namespaced params) via History API.
  - `'hash'`: uses `#hubPlan=...`.
  - `'none'`: no URL mutation (no deep-links).
  - **`'path'`**: uses the History API to read/write path segments under `basePath`, using either default templates (`${basePath}` and `${basePath}/:slug`) or `routes.detail` when provided.

**Host refresh requirement (normative, path mode):**
Hosts MUST route all URLs that match `routes.list` and `routes.detail` to the same page shell template that contains the embed snippet (e.g., WordPress rewrite `^events(?:/.*)?$` → events page). On hard refresh of a detail URL, the embed MUST mount and render the correct detail view without a server 404.

**SEO/SSR parity (normative):**
- **Non‑AI pages** ship **Light‑DOM fragments** + **JSON‑LD** for SEO/ISR; embed must respect shared tokens/classnames for **visual parity** with Shadow‑DOM renders. **AI/personalized routes are `noindex`**.  
- When Light‑DOM and Shadow‑DOM co‑exist, duplicate visual nodes are `aria-hidden="true"` in the shadow tree. JSON‑LD `@id` values remain stable.
- **JSON‑LD parity acceptance:** ensure a ≤**1% diff** between JSON‑LD derived from Shadow‑DOM vs. Light‑DOM artifacts for equivalent views; enforce stable `@id` values.

---

## 6) CDN, manifest & versions

- **Layout:** `hub-embed@<version>/…`, `hub-embed@latest/…`, and `hub-embed@lts/…`.  
- **Manifest schema:**
```json
{
  "version": "1.6.0",
  "cdnBasePath": "/hub-embed@1.6.0",
  "generatedAt": "ISO",
  "assets": [
    { "path": "/hub-embed@1.6.0/hub-embed.esm.js", "integrity": "sha384-...", "entry": true },
    { "path": "/hub-embed@1.6.0/hub-embed.umd.js", "integrity": "sha384-...", "entry": false },
    { "path": "/hub-embed@1.6.0/theme@HASH.css", "integrity": "sha384-..." }
  ]
}
```
- Admin reads the manifest to populate snippet URLs and **SRI**. If the manifest is stale or mismatched, **do not** emit a snippet (show error).
- **Admin MUST refuse snippet generation** if: manifest lacks SRI hashes, CDN base path mismatches the selected version, or the selected version is unknown.
- All generated `<script>` and `<link>` tags **MUST** include `crossorigin="anonymous"`.
- When **historyMode='path'**, the router **reads/writes under `data-base-path`** using the History API.
  - Default route template if `data-route-templates` omitted:
    - list: `${basePath}`
    - detail: `${basePath}/:slug`
- **Click interception (router takeover):**
  - `data-route-takeover="container"` (default: `'none'`): intercept anchor clicks **inside the embed** whose `href` matches list/detail templates; call `navigate()`; `preventDefault()`.
  - `data-route-takeover="document"`: a capturing listener at `document` scope intercepts matching anchors **anywhere on the page**; must be opt‑in.
  - Never intercept when `target="_blank"` or `data-external` present.
  - **Multi‑embed rule:** if multiple embeds opt in, the instance with `data-router-root="true"` is authoritative; otherwise the first mounted wins.
- Provide `@latest`, **pinned**, and **`@lts`** options; encourage **pinned** or **LTS** for production.

---

## 7) Consent & privacy

**Public consent API (normative):**
```ts
HubEmbed.consent.grant(source?: 'iab' | 'host' | 'user'): void;
HubEmbed.consent.revoke(): void;
HubEmbed.consent.status(): 'granted' | 'pending';
```
- While status is **`pending`**, analytics/beacons **MUST** be queued (bounded queue, LRU) and flushed on `grant()`; queue size limit: **max(200 events, 64 KB)** per page. New events evict oldest (LRU) when full.
- If IAB TCF v2 is detected, the SDK **MAY** auto‑grant when consent signals indicate permitted purposes; otherwise remain pending until host/user grants.
- Consent state must be observable by partner adapters (see §8).

**Privacy defaults:**
- No PII is stored in telemetry payloads; IP is not retained by client code; data is sampled per embed (see §8).  
- Ads/partner pixels are disabled until consent is granted.

---

## 8) Telemetry & analytics

- **Primary hook:** `onEvent(e: SdkEvent)`; secondary zero‑config **CustomEvent**: `hub-embed:event` (`detail: SdkEvent`).  
- **OTel spans** emitted at mount, routing, filters, AI compose, and per‑block render. Demo Host logs first `sdk.blockHydrated` with plan hash for validation.  
- **Event payload (normative):** include `{ tenantId, version, embedId? }` on **every** event, `routeName`/`previousUrl` on route transitions when available.

### 8.1 Partner adapters
The SDK exposes a partner adapter interface. Adapters **MUST** respect consent buffering and **MAY** emit via the common analytics channel.
```ts
export interface PartnerAdapter {
  id: 'yext' | 'ticketsauce' | 'bandsintown' | string;
  onImpression?(ctx: { tenantId: string; embedId?: string; eventId?: string }): void;
  onClick?(ctx: { tenantId: string; embedId?: string; eventId?: string; url: string }): void;
}
export function registerPartnerAdapter(adapter: PartnerAdapter): void;
```
- Adapters run in the embed context; **no cross‑origin network calls** before consent. Errors are isolated and logged with `[hub-embed]` prefix.

### 8.2 Multi‑instance analytics
- All events **MUST** include `embedId` when multiple widgets exist on the page.  
- **Sampling MUST be per‑embed** to avoid correlated dropouts.

### 8.3 Deprecation telemetry
- During the alias period (`window.EventsHubEmbed` → `window.HubEmbed`), emit a **one‑time** `sdk.deprecation` event per session with `{ from: 'EventsHubEmbed', to: 'HubEmbed', version }` (persist guard in `sessionStorage`).

---

## 9) Performance, accessibility, CSP & network resilience

### 9.1 Budgets (GA gates)
- **Phase A (Transition, ≤ 2 releases):** UMD ≤ **120 kB** gzip, ESM ≤ **95 kB**, per‑block ≤ **30 kB**.  
- **Phase B (Target):** UMD ≤ **45 kB** gzip, ESM ≤ **35 kB**, per‑block ≤ **15 kB**.  
- CI **MUST enforce** both limits; **Phase A** is a **hard gate** during the transition window; Phase B is a warning until Phase A concludes, then becomes the hard gate.

### 9.2 Accessibility (WCAG 2.2 AA)
- All overlays (menus, dialogs, tooltips) **MUST** render within the **same Shadow Root** as the active embed instance; portal‑to‑`document.body` is disallowed.  
- Acceptance: verify overlay container is a descendant of the active embed’s shadow root; keyboard, focus‑trap/restore, ARIA labeling, and reduced‑motion still apply.

### 9.3 CSP, Trusted Types, fonts, and content sanitization
**Trusted Types (normative):**
```js
const policy = window.trustedTypes?.createPolicy?.('hub-embed', {
  createHTML: (s) => s,
  createScriptURL: (s) => s
});
```
- The policy is used **only** with SDK‑controlled strings (manifested assets, sanitized HTML). If Trusted Types are enforced and **no policy can be created**, the embed **MUST abort safely** with a visible error.
- **Markdown/HTML sanitization:** Markdown‑to‑HTML MUST be **allow‑list** based (no `<style>`, no event handlers). Sanitize **before** applying Trusted Types.
- **Font policy:** Theme CSS MUST NOT inline remote `@import` (e.g., Google Fonts). Custom fonts require **external CSS** with **SRI**.
- **Map & API keys:** Client keys SHOULD be domain‑restricted and consent‑gated; prefer server‑side injection where possible.

### 9.4 Network resilience (normative)
- All requests implement `AbortController` timeouts (**default 8s**, overridable per endpoint) and exponential backoff.  
- Non‑critical telemetry **MAY** queue via `navigator.sendBeacon` (with `fetch` fallback on unsupported browsers).  
- Unload paths use `sendBeacon` when available.

---

## 10) Browser support & i18n

- Target modern evergreen browsers; bundle minimal polyfills (`fetch`, `Promise`) if required.  
- If required features are missing, render an inline error UI and abort mount.  

**Internationalization/time zone**  
- Honor `data-locale` and `data-timezone` when provided; default to `document.documentElement.lang` and `Intl.DateTimeFormat().resolvedOptions().timeZone`.

---

## 11) Developer experience

- **Console prefix:** all console output MUST use the prefix `[hub-embed]`.
- **Clear errors for top failure modes:** Provide specific guidance strings and next steps for at least these cases:
  1. **SRI mismatch / CDN drift**
  2. **CSP violations** (constructable stylesheet blocked, missing nonce)
  3. **Router misconfiguration** (no page shell rewrites for `historyMode='path'`)
  4. **Consent pending** (explain buffering behavior and how to grant)
  5. **Plan resolution failures** (invalid/missing plan or unreachable API)

---

## 12) Acceptance tests (GA verification)

1) **Copy/paste:** Admin‑generated snippet mounts Shadow DOM, hydrates default or URL‑provided plan, emits analytics (with `tenantId`, `version`, and `embedId` when present), and respects SRI.  
2) **Routing:** State updates the URL according to `historyMode` (`?hubPlan=`, `#hubPlan=`, `'path'`, or none). Refresh restores layout for modes that persist.  

   2a) **Path deep‑linking (historyMode='path'):**
       - Direct load `${basePath}` renders list view.
       - Direct load `${detailTemplate.replace(':slug','sample-slug')}` mounts embed and renders detail view.
       - Back/forward restores view; copying/pasting the URL preserves the route.
       - With `data-route-templates` set, the custom patterns are honored.
   2b) **Click interception:**
       - With `data-route-takeover="container"`, links inside the embed that match templates navigate without full page reload.
       - With `data-route-takeover="document"`, matching links anywhere in the document navigate without full reload.
       - With `'none'`, no interception occurs.
   2c) **Rewrite safety (path mode):**
       - Hard refresh on a detail URL returns the embed shell and re‑renders the correct route.

3) **Parity:** Demo Host uses CDN snippet (view‑source verifiable).  
4) **Analytics:** `sdk.blockHydrated` and `card_click` observed via `hub-embed:event` or `onEvent`.  
5) **A11y/Perf:** Budgets pass; WCAG checks pass (axe=0).  
6) **SEO parity:** Non‑AI pages’ Light‑DOM fragments match Shadow‑DOM visuals; JSON‑LD present.  
7) **CSP variants:** Pass under (a) strict nonce, (b) disallow inline without nonce, and (c) constructable‑blocked cases via documented fallbacks.  
8) **Multiple instances:** Two embeds on one page produce distinct analytics streams keyed by `embedId`.  
9) **Consent gating:** When enabled, no analytics/network beacons until consent is granted; verify buffer/flush behavior.  
10) **Lazy mount:** With `data-lazy="true"`, no network until within 1.5× viewport height except optional HEAD pre‑validation.

11) **Trusted Types:** Disable TT policy → expect safe abort with visible error and no DOM injection.
12) **Partner adapters:** Register mock adapter → impressions/clicks fire **only after** consent is granted; verify buffering.
13) **Overlay isolation:** Verify all overlays render inside the embed’s shadow root (no body portals).
14) **Router readiness:** No DOM paint of routed content before `router.isReady()` (or equivalent route‑resolution gate).
15) **Phase‑A budgets:** CI enforces Phase‑A size ceilings and reports Phase‑B as warnings until transition window ends.

---

## 13) Deprecations & rename plan

- Ship SDK rename to `window.HubEmbed` with `window.EventsHubEmbed` **two‑minor‑release** alias (or 6 months, whichever longer).  
- Emit one‑time `sdk.deprecation` event **once per session** with `{ from: 'EventsHubEmbed', to: 'HubEmbed', version }` when the alias path is used (guard via `sessionStorage`).  

---

## 14) Risks & mitigations

| Risk | Mitigation |
|---|---|
| Duplicate mounts on dynamic CMS pages | **MutationObserver** + `data-mounted` guard; idempotent mount logic. |
| Layout thrash in block editors | **ResizeObserver** triggers re‑layout; debounce at 100 ms. |
| SRI mismatch / CDN drift | Admin generator sources hashes from manifest; CI verifies manifest/assets consistency; Demo Host displays manifest version. |
| Long encoded plans exceed URL budget | Use `?hubPlanId=` automatically when encoded `hubPlan` > 2 KB. |
| CMS/WordPress query collisions | Namespaced params (`hubPlan`, `hubPlanId`, etc.) and optional `'hash'`/`'none'` routing modes. |
| Path refresh causes server 404 | **Normative host rewrites required** when using `'path'`; Admin generator provides CMS-specific guidance and test checklist. |
| Competing routers on host page | Takeover is **opt‑in**; default `'none'`. `data-router-root` disambiguates multi‑embed pages; do not intercept `target="_blank"` or `data-external`. |
| CSP blocking constructable styles | Fallback to nonced `<style>`; final fallback to external theme CSS with SRI. |
| Trusted Types enforcement | Register `hub-embed` TT policy; abort safely if policy cannot be created; ship sanitized, allow‑listed HTML only. |
| Partner adapter misuse | Adapters withheld from firing until consent; sandboxed by contract; error isolation with `[hub-embed]` logs. |
| Font loading regressions | Forbid `@import`; require external CSS with SRI; metrics monitored in CI. |

---

## 15) Appendix: Events & examples

**Example `SdkEvent` payload**
```json
{
  "type": "sdk.blockHydrated",
  "tenantId": "demo",
  "version": "1.6.0",
  "embedId": "newsroom-123",
  "block": "featured-rail",
  "durationMs": 47,
  "routeName": "list",
  "previousUrl": "https://host.site/events?hubPlanId=abc123"
}
```

**Admin manifest excerpt** — see §6 for full schema.
