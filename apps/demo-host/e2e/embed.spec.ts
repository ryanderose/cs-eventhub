import { expect, test } from '@playwright/test';
import { setupMsw } from '../../../playwright/fixtures/msw';
import {
  HubEmbedLogCollector,
  clearHubEvents,
  expectConsentStatus,
  expectEmbedStatus,
  gotoManualHarness,
  grantConsent,
  PARTNER_EVENT_STORE,
  installHubEventRecorder,
  readHubEvents,
  readPartnerEvents,
  registerPartnerEventRecorder,
  resetHarnessState
} from './utils';
import { resetMswHandlers } from './msw-server';
import tamperedManifest from '../../admin/__tests__/__fixtures__/manifest-tampered.json';
import type { SnippetListResponse } from '../../admin/lib/snippet-types';

const ADMIN_BASE_URL = process.env.ADMIN_ACCEPTANCE_BASE_URL ?? 'http://localhost:3001';
const INVALID_MANIFEST = tamperedManifest as SnippetListResponse['manifests'][number];

test.describe('Embed acceptance scenarios @acceptance', () => {
  setupMsw();

  test.beforeEach(async ({ page }) => {
    await resetHarnessState(page);
    await clearHubEvents(page);
  });

  test('consent gating buffers telemetry @acceptance', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    await installHubEventRecorder(page);
    try {
      await gotoManualHarness(page, '/manual/routing', { consent: 'pending' });
      await expectEmbedStatus(page, /Embed ready/i, 0);

      await test.step('§12.1 — pending consent buffers events', async () => {
        await expectConsentStatus(page, 'pending');
        await page.getByRole('button', { name: 'Reset filters' }).first().click();
        await page.waitForTimeout(500);
        const events = await readHubEvents(page);
        expect(events.length).toBe(0);
      });

      await test.step('§12.1 — granting consent flushes buffered telemetry', async () => {
        await grantConsent(page);
        await expectConsentStatus(page, 'granted');
        await expect
          .poll(async () => (await readHubEvents(page)).some((event) => event.type === 'filters_reset'), {
            timeout: 5000
          })
          .toBe(true);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('lazy mount defers hydration until visible @acceptance', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    await installHubEventRecorder(page);
    try {
      await gotoManualHarness(page, '/manual/lazy', { consent: 'granted' });

      await test.step('§12.5 — embed waits while off screen', async () => {
        await expect(page.getByText('Scroll down to trigger the lazy observer…')).toBeVisible();
        await expectEmbedStatus(page, /Mounting embed…/i, 0, 20_000);
        const events = await readHubEvents(page);
        expect(events.length).toBe(0);
      });

      await test.step('§12.5 — scrolling into view hydrates embed', async () => {
        await page.mouse.wheel(0, 2000);
        await expectEmbedStatus(page, /Embed ready/i, 0);
        await page.getByRole('button', { name: 'Reset filters' }).first().click();
        await expect
          .poll(async () => (await readHubEvents(page)).some((event) => event.type === 'filters_reset'), { timeout: 5000 })
          .toBe(true);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('legacy mount inserts before loader script @acceptance', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await gotoManualHarness(page, '/manual/legacy');

      await test.step('§12.6 — legacy harness renders status', async () => {
        await expect(page.getByRole('heading', { name: 'Legacy Mount (data-mount-before)' })).toBeVisible();
        await expectEmbedStatus(page, /Legacy mount complete/i, 0);
      });

      await test.step('§12.6 — embed precedes loader script', async () => {
        const insertedBeforeScript = await page.locator('script[data-manual-legacy-script]').evaluate((script) => {
          return Boolean(script.previousElementSibling && script.previousElementSibling.hasAttribute('data-embed-container'));
        });
        expect(insertedBeforeScript).toBe(true);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('path routing + router ownership arbitration @acceptance', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await test.step('§12.4 — path routing rewrites URLs', async () => {
        await gotoManualHarness(page, '/events');
        await expect(page.getByText(/Current detail slug:\s+list view/i)).toBeVisible();
        await gotoManualHarness(page, '/events/sample-slug');
        await expect(page.getByText(/Current detail slug:\s+sample-slug/i)).toBeVisible();
      });

      await test.step('§12.8 — router owner banner visible', async () => {
        await gotoManualHarness(page, '/manual/multi');
        await expect(page.getByRole('heading', { name: 'Embed A — router owner' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Embed B — scoped clicks' })).toBeVisible();
        await expect(page.getByText(/Active router owner/i)).toContainText('manual-multi-a');
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('partner adapters buffer until consent granted @acceptance', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    await registerPartnerEventRecorder(page);
    try {
      await gotoManualHarness(page, '/manual/routing', { consent: 'pending' });
      await expectEmbedStatus(page, /Embed ready/i, 0);

      await test.step('§12.3 — pending consent yields no partner events', async () => {
        await expectConsentStatus(page, 'pending');
        await page.waitForTimeout(500);
        expect(await readPartnerEvents(page)).toHaveLength(0);
      });

      await test.step('§12.3 — granting consent flushes partner buffer', async () => {
        await grantConsent(page);
        await expect
          .poll(async () => (await readPartnerEvents(page)).length, { timeout: 5000 })
          .toBeGreaterThan(0);
        const events = await readPartnerEvents(page);
        expect(events.some((event) => event.type === 'impression')).toBe(true);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('overlay isolation keeps renders inside ShadowRoot @acceptance', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await page.goto('/');
      await expect(page.locator('[data-embed-container]')).toBeVisible();
      await expectEmbedStatus(page, /Embed ready/i, 0, 20_000);

      await test.step('§12.9 — shadow root owns rendered blocks', async () => {
        const result = await page.evaluate(() => {
          const container = document.querySelector('[data-embed-container]');
          const shadowBlocks = container?.shadowRoot?.querySelectorAll('section[data-block]')?.length ?? 0;
          const hostBlocks = container?.querySelectorAll('section[data-block]')?.length ?? 0;
          const bodyBlocks = document.body.querySelectorAll('section[data-block]').length;
          return { shadowBlocks, hostBlocks, bodyBlocks };
        });
        expect(result.shadowBlocks).toBeGreaterThan(0);
        expect(result.hostBlocks).toBe(0);
        expect(result.bodyBlocks).toBe(0);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('Trusted Types harness aborts safely @acceptance', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await gotoManualHarness(page, '/manual/trusted-types');

      await test.step('§12.7 — fallback UI rendered', async () => {
        const alert = page.getByRole('alert').filter({ hasText: /Trusted Types enforcement prevented the embed from running/i });
        await expect(alert).toContainText(/Trusted Types enforcement prevented the embed from running/i);
        await expectEmbedStatus(page, /Trusted Types policy creation failed/i, 0);
      });

      await test.step('§12.7 — capture fallback screenshot', async () => {
        const screenshot = await page.screenshot({ fullPage: true });
        await testInfo.attach('trusted-types-fallback', { body: screenshot, contentType: 'image/png' });
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('snippet generator refuses tampered manifests @acceptance', async ({ page }) => {
    await page.route('**/api/snippet', async (route) => {
      const payload: SnippetListResponse = {
        manifests: [INVALID_MANIFEST],
        defaults: {
          tenantId: 'demo',
          basePath: '/events',
          cdnOrigin: 'http://localhost:5173'
        }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload)
      });
    });

    await test.step('§12.10 — admin UI blocks tampered manifests', async () => {
      await page.goto(new URL('/snippets', ADMIN_BASE_URL).toString());
      const alert = page.getByRole('alert').filter({ hasText: /Manifest cdnBasePath.*does not match directory/i });
      await expect(alert).toContainText(/Manifest cdnBasePath.*does not match directory/i);
      await expect(page.getByRole('button', { name: 'Copy snippet' })).toBeDisabled();
    });

    await page.unroute('**/api/snippet');
  });

  test('deprecated alias emits telemetry once per session @acceptance', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    await installHubEventRecorder(page);
    try {
      await gotoManualHarness(page, '/manual/routing', { query: { alias: 'legacy' } });

      await test.step('§12.11 — accessing EventsHubEmbed emits sdk.deprecation', async () => {
        await expect
          .poll(async () => (await readHubEvents(page)).some((event) => event.type === 'sdk.deprecation'), { timeout: 5000 })
          .toBe(true);
      });
    } finally {
      await logs.attach(testInfo);
      resetMswHandlers();
    }
  });
});
