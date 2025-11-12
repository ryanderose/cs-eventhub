# Events Hub Embed — Missing Capabilities & Required Additions (vs. Final Spec v1.6)
**Status:** Draft for planning

**Date:** 2025-11-10

**Intended use:** This document lists **only what does not currently exist** in the Events Hub system relative to **Final Spec v1.6**. It is designed to be used **alongside** (not as an update to) the research document (what exists + file paths) and the spec (normative requirements). It gives the planning agent a checklist of missing capabilities, outlines acceptance criteria, and points to likely touchpoints in the codebase.

**Sources:** Final Spec v1.6 fileciteturn0file1 · Research: Implementation Survey fileciteturn0file0

---

## Legend
- **Status:** _Missing_ (not implemented) · _Partial/Verify_ (exists in part; needs work to meet spec)  

- **Touchpoints:** packages/apps most likely affected  

- **Acceptance (must-haves):** concrete tests or behaviors required for GA

---

## Snapshot (what’s missing at a glance)

| Area | Status | Why it matters (Spec) |

|---|---|---|

| Consent API + buffered emissions | Missing | Required public API and privacy gate (§7). fileciteturn0file1 |

| Trusted Types policy | Missing | Mandatory when TT enforced; safe abort otherwise (§9.3). fileciteturn0file1 |

| Routing “path” mode | Missing | Deep-linking and refresh without query/hash (§2, §5). fileciteturn0file1 |

| Click interception & multi‑embed router ownership | Missing | SPA-like transitions; deterministic router on multi-embed pages (§6). fileciteturn0file1 |

| Lazy mount (`data-lazy`) | Missing | Performance and network deferral (§2.1). fileciteturn0file1 |

| Legacy mount fallback (`data-mount-before`) | Missing | Synchronous injector compatibility (§2.4). fileciteturn0file1 |

| Partner adapter interface + consent awareness | Missing | Standardized partner hooks (§8.1). fileciteturn0file1 |

| Event schema (`routeName`, `previousUrl`) + consistent `embedId` | Partial/Verify | Richer analytics for routing & multi-instance (§3, §8). fileciteturn0file1 |

| Admin snippet “refuse on drift” (SRI/manifest) | Partial/Verify | Prevents bad snippets (§6). fileciteturn0file1 |

| SEO JSON‑LD parity (≤1% diff) checks | Missing | Guarantees SSR/SEO parity (§5). fileciteturn0file1 |

| Phase‑A/B perf budgets enforced in CI | Partial/Verify | Hard GA gates (§9.1). fileciteturn0file1 |

| Overlay/a11y: render inside ShadowRoot | Partial/Verify | WCAG + isolation (§9.2). fileciteturn0file1 |

| Network resilience defaults (8s timeout, backoff, sendBeacon) | Missing | Robustness & unload behavior (§9.4). fileciteturn0file1 |

| Developer experience: console prefix + top 5 errors | Partial/Verify | Operator clarity (§11). fileciteturn0file1 |

| Deprecation telemetry (`EventsHubEmbed` → `HubEmbed`) | Missing | Migration signal (§8, §13). fileciteturn0file1 |

| Acceptance tests for the above | Missing | Spec §12 coverage. fileciteturn0file1 |



> Evidence that these are not present or only partially present comes from the **Implementation Survey**; the SDK and tests enumerated there do not show these behaviors yet. fileciteturn0file0

---

## Detailed gaps and required additions

### 1) Consent API & buffered emissions — **Missing**

- **Spec requires:** Public `HubEmbed.consent` with `grant/revoke/status`, bounded queue (≤200 events or 64 KB), flush on grant, and optional IAB TCF auto-grant. fileciteturn0file1  

- **Research indicates:** Only a generic analytics emitter in SDK; no consent surface or buffering exists. fileciteturn0file0  

- **Add:** Implement `HubEmbed.consent` singleton (page-scoped) in `packages/embed-sdk`; integrate with analytics pipeline & partner adapters; ensure **no network** before consent.  

- **Touchpoints:** `packages/embed-sdk`, `packages/telemetry`, partner adapters (new), demo-host tests.  

- **Acceptance (must-haves):** no emissions pre-consent; buffer/flush ordering; LRU eviction at limits; multi-embed consistency; IAB pathway (when present). fileciteturn0file1



### 2) Trusted Types policy — **Missing**

- **Spec requires:** `trustedTypes.createPolicy('hub-embed', …)`; use only with sanitized SDK strings; if TT enforced and policy cannot be created → **safe abort with visible error**. fileciteturn0file1  

- **Research indicates:** No TT policy is registered by the SDK. fileciteturn0file0  

- **Add:** Create policy in SDK init; route all HTML/ScriptURL through sanitizer + TT; add abort UI path.  

- **Touchpoints:** `packages/embed-sdk`, `packages/security`.  

- **Acceptance:** TT-enforced env → (a) with policy: mount succeeds; (b) without policy: safe abort, no DOM injection. fileciteturn0file1



### 3) Routing “path” mode — **Missing**

- **Spec requires:** `historyMode='path'` with `basePath` and route templates; deep-link list/detail; hard refresh must mount correct view. fileciteturn0file1  

- **Research indicates:** Query/hash persistence exists; path mode not evidenced. fileciteturn0file0  

- **Add:** Implement path parser/serializer; direct-load hydration; back/forward sync.  

- **Touchpoints:** `packages/embed-sdk` (router), `packages/router-helpers`, demo-host.  

- **Acceptance:** direct-load list/detail; copy/paste URL fidelity; back/forward; host rewrite checklist documented. fileciteturn0file1



### 4) Click interception & multi‑embed router ownership — **Missing**

- **Spec requires:** Opt-in interception scopes (`'container'|'document'`); never intercept `_blank`/`data-external`; multi-embed arbitration (`data-router-root` or first-mounted). fileciteturn0file1  

- **Research indicates:** Not present in SDK. fileciteturn0file0  

- **Add:** Interception layer with templates; ownership rules; diagnostics.  

- **Touchpoints:** `packages/embed-sdk`.  

- **Acceptance:** scope-specific interception; multi-embed deterministic owner; no false intercepts. fileciteturn0file1



### 5) Lazy mount (`data-lazy`) — **Missing**

- **Spec requires:** Defer all network and hydration until container within **1.5× viewport height**; optional sub‑1 kB **HEAD** plan pre‑validation. fileciteturn0file1  

- **Research indicates:** No lazy behavior in SDK. fileciteturn0file0  

- **Add:** IntersectionObserver gate + optional HEAD preflight; DX warnings when missing browser features.  

- **Touchpoints:** `packages/embed-sdk`; demo-host tests.  

- **Acceptance:** zero network before in-view; verifies HEAD preflight size cap. fileciteturn0file1



### 6) Legacy mount fallback (`data-mount-before`) — **Missing**

- **Spec requires:** Document-order placeholder mounting before a given script id; no `document.write`; visible `<noscript>` fallback. fileciteturn0file1  

- **Research indicates:** No fallback mechanism noted. fileciteturn0file0  

- **Add:** Script-attribute driven mount-before; error if id not found; noscript guidance.  

- **Touchpoints:** `packages/embed-sdk`, admin docs.  

- **Acceptance:** synchronous injector scenario passes with correct placement. fileciteturn0file1



### 7) Partner adapter interface + consent awareness — **Missing**

- **Spec requires:** `registerPartnerAdapter()` with consent gating; no cross-origin calls pre-consent. fileciteturn0file1  

- **Research indicates:** No adapter API exists. fileciteturn0file0  

- **Add:** Define adapter contract (`onImpression`, `onClick`); wire to consent state + analytics.  

- **Touchpoints:** `packages/embed-sdk`.  

- **Acceptance:** mock adapter fires only after consent; buffered flush verified. fileciteturn0file1



### 8) Event schema enrichment + embedId propagation — **Partial/Verify**

- **Spec requires:** Include `routeName` and `previousUrl` on route transitions; propagate `embedId` for multi-instance pages. fileciteturn0file1  

- **Research indicates:** Minimal emitter exists; new fields/guarantees not shown. fileciteturn0file0  

- **Add:** Extend `SdkEvent` payloads and ensure population on navigation.  

- **Touchpoints:** `packages/telemetry`, `packages/embed-sdk`.  

- **Acceptance:** asserted fields present on route-change events; multi-embed emits unique `embedId`. fileciteturn0file1



### 9) Admin snippet “refuse on drift” — **Partial/Verify**

- **Spec requires:** Admin must **refuse to generate** snippets on manifest/SRI drift; all tags include `crossorigin="anonymous"`. fileciteturn0file1  

- **Research indicates:** Versioned manifest with SRI exists; explicit refusal behavior not demonstrated. fileciteturn0file0  

- **Add:** Hard validation + error UI; tests simulating drift.  

- **Touchpoints:** `apps/admin`, `apps/cdn`.  

- **Acceptance:** snippet blocked on drift; all emitted tags carry SRI + crossorigin. fileciteturn0file1



### 10) SEO JSON‑LD parity budget — **Missing**

- **Spec requires:** ≤**1% diff** between Shadow‑DOM derived JSON‑LD and Light‑DOM fragments; stable `@id`; non‑AI routes only. fileciteturn0file1  

- **Research indicates:** Fragment hashing and parity intent exist; explicit JSON‑LD parity tests absent. fileciteturn0file0  

- **Add:** Test harness comparing JSON‑LD artifacts; budget and stability checks.  

- **Touchpoints:** `apps/demo-host`, `apps/api` (fragment), tests.  

- **Acceptance:** parity tests pass; AI/personalized routes `noindex`. fileciteturn0file1



### 11) Performance budgets (Phase‑A/Phase‑B) — **Partial/Verify**

- **Spec requires:** Phase‑A hard gates; Phase‑B warnings → later hard gate; per-bundle size ceilings. fileciteturn0file1  

- **Research indicates:** CI gates exist, but not the Phase A/B budget enforcement as specified. fileciteturn0file0  

- **Add:** Wire size tracking and fail/warn thresholds in CI.  

- **Touchpoints:** CI config, `packages/embed-sdk`, build tooling.  

- **Acceptance:** CI fails on Phase‑A violations, warns on Phase‑B until promotion. fileciteturn0file1



### 12) Accessibility: overlay isolation in ShadowRoot — **Partial/Verify**

- **Spec requires:** All overlays render inside the active embed’s ShadowRoot; no portal-to-`document.body`. fileciteturn0file1  

- **Research indicates:** Not validated by tests. fileciteturn0file0  

- **Add:** Ensure overlay containers are within the shadow tree; add a11y tests.  

- **Touchpoints:** `packages/block-runtime`, `packages/embed-sdk`.  

- **Acceptance:** acceptance test confirms overlay DOM ancestry + keyboard/ARIA checks. fileciteturn0file1



### 13) Network resilience defaults — **Missing**

- **Spec requires:** Default **8s** `AbortController` timeouts; exponential backoff; `navigator.sendBeacon` for non‑critical telemetry + unload. fileciteturn0file1  

- **Research indicates:** Provider/API caching exists, but SDK-side defaults not shown. fileciteturn0file0  

- **Add:** Shared fetch helpers with timeouts/backoff; unload beacons.  

- **Touchpoints:** `packages/embed-sdk`, `packages/telemetry`.  

- **Acceptance:** request timeouts observed; retries with backoff; beacons used on unload. fileciteturn0file1



### 14) Developer experience polish — **Partial/Verify**

- **Spec requires:** `[hub-embed]` console prefix and clear guidance for top 5 failure modes (SRI, CSP, router, consent, plan). fileciteturn0file1  

- **Research indicates:** Not standardized in SDK output. fileciteturn0file0  

- **Add:** Centralized logger and error catalog; actionable remediation messages.  

- **Touchpoints:** `packages/embed-sdk`, docs.  

- **Acceptance:** console messages detected in e2e for simulated failures. fileciteturn0file1



### 15) Deprecation telemetry (global rename) — **Missing**

- **Spec requires:** One-time `sdk.deprecation` event when alias `window.EventsHubEmbed` is used; session-scoped guard. fileciteturn0file1  

- **Research indicates:** Not present. fileciteturn0file0  

- **Add:** Alias + sessionStorage guard + event emission.  

- **Touchpoints:** `packages/embed-sdk`, `packages/telemetry`.  

- **Acceptance:** Single emission per session validated. fileciteturn0file1



### 16) Acceptance tests for GA — **Missing**

- **Spec requires:** Coverage for TT, adapters, overlay isolation, router readiness, lazy mount, consent gating, path mode deep-links, admin snippet refusal, parity budget, and Phase‑A budgets. fileciteturn0file1  

- **Research indicates:** Many unit/integration tests exist, but the above acceptance scenarios are not present. fileciteturn0file0  

- **Add:** Expand test suite with scenarios enumerated in §12 of the spec.  

- **Touchpoints:** test harness across `apps/demo-host`, `apps/api`, `packages/embed-sdk`.  

- **Acceptance:** green suite with explicit assertions per scenario. fileciteturn0file1



---

## Cross‑cutting notes for the planning agent

- Treat **SDK changes** (consent, TT, router, lazy/legacy mount, adapters, DX, telemetry schema, network helpers) as a **single track** to minimize churn.  

- Run a **CI track** in parallel for Phase‑A budgets and acceptance tests so quality gates come online before code freezes.  

- Keep **Admin + CDN** work scoped to manifest/SRI validation and snippet refusal logic.  

- Add a **SEO parity** harness early to avoid surprises near GA.



---

## Appendix: Quick checklists (copy into tracker)

- [ ] Consent API implemented; buffered queue + flush; IAB auto-grant (optional). fileciteturn0file1  

- [ ] Trusted Types policy registered; safe abort path; sanitizer wired. fileciteturn0file1  

- [ ] historyMode='path' end-to-end, including direct-load + rewrites doc. fileciteturn0file1  

- [ ] Click interception (container/document) + multi-embed router ownership. fileciteturn0file1  

- [ ] Lazy mount with IO gate and optional HEAD preflight. fileciteturn0file1  

- [ ] Legacy mount fallback (`data-mount-before`) implemented. fileciteturn0file1  

- [ ] Partner adapter interface + consent gating. fileciteturn0file1  

- [ ] Event schema includes `routeName`/`previousUrl`; embedId propagated. fileciteturn0file1  

- [ ] Admin snippet refusal on manifest/SRI drift; tags with `crossorigin`. fileciteturn0file1  

- [ ] JSON‑LD parity harness (≤1% diff) + stable `@id`. fileciteturn0file1  

- [ ] Phase‑A budgets enforced; Phase‑B warnings wired. fileciteturn0file1  

- [ ] Overlay isolation within ShadowRoot validated. fileciteturn0file1  

- [ ] Network resilience defaults (8s timeout, backoff, sendBeacon). fileciteturn0file1  

- [ ] DX: `[hub-embed]` prefix + top 5 error messages. fileciteturn0file1  

- [ ] Deprecation event emitted once per session. fileciteturn0file1  

- [ ] Acceptance suite expanded per §12 scenarios. fileciteturn0file1



---

**Provenance:** Gaps were derived by comparing Final Spec v1.6 with the codepaths and tests documented in the Implementation Survey. See those documents for normative language and current file locations. fileciteturn0file1 fileciteturn0file0

