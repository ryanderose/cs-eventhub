# Playwright harness tips

- Use `setupMsw()` from `playwright/fixtures/msw.ts` inside each `test.describe` block to keep demo-host requests deterministic. Toggle `PLAYWRIGHT_MSW=off` when you need to hit the real API.
- Manual harness specs rely on the helper utilities under `apps/demo-host/e2e/`. `gotoManualHarness`, `HubEmbedLogCollector`, and the consent fixtures wrap the shared manual routes so tests only assert behaviour. Import them via:
  ```ts
  import { gotoManualHarness, HubEmbedLogCollector } from '../../../apps/demo-host/e2e/utils';
  import { grantConsent, revokeConsent } from '../../../apps/demo-host/e2e/fixtures/consent';
  ```
- `registerPartnerEventRecorder()` installs a deterministic adapter before navigation so partner telemetry assertions can run without touching host pages.
- Use `pnpm acceptance` (shorthand for `pnpm playwright test --project=demo-hosts-local --grep @acceptance`) to run the Phase 3 acceptance matrix locally. The CI job `acceptance-harness` executes the same command and publishes `playwright-report/` artifacts.
- When Playwright requires browser access in this sandbox, enable the Playwright MCP integration so the `demo-hosts-local` project can launch Chromium. If MCP is unavailable, capture the missing coverage in your PR description.
- Do **not** run `pnpm playwright test` inside the Codex CLI sandbox—the embedded Chromium process crashes with `SIGABRT`. Instead, launch the Playwright MCP client (`npx @playwright/mcp@latest --isolated`) or use the Codex CLI `browser_*` tools to drive the manual harness remotely. Capture artifacts from `/tmp/playwright-mcp-output/<runId>/` for each scenario.
