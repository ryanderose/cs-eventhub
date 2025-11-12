import { expect, test } from '@playwright/test';
import { setupMsw } from '../../fixtures/msw';
import {
  HubEmbedLogCollector,
  expectConsentStatus,
  expectEmbedStatus,
  getEmbedStatusText,
  gotoManualHarness,
  grantConsent,
  resetHarnessState,
  revokeConsent
} from '../../../apps/demo-host/e2e/utils';

const STATUS_TIMEOUT = 20_000;

test.describe('Manual harness scenarios', () => {
  setupMsw();

  test.beforeEach(async ({ page }) => {
    await resetHarnessState(page);
  });

  test('manual index lists harness routes (spec §12 preflight)', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await test.step('§12.0 — open manual index', async () => {
        await gotoManualHarness(page, '/manual');
        await expect(page.getByRole('heading', { name: 'Manual Embed Harness' })).toBeVisible();
      });

      await test.step('§12.0 — verify harness cards present', async () => {
        await expect(page.getByRole('link', { name: /Open Query & Hash Routing/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Open Legacy Mount/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Open Trusted Types Enforcement/i })).toBeVisible();
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('consent controls toggle buffer state (spec §12.1)', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await gotoManualHarness(page, '/manual');

      await test.step('§12.1 — pending consent buffers analytics', async () => {
        await revokeConsent(page);
        await expectConsentStatus(page, 'pending');
        await expect(page.locator('section.manual-harness-controls [data-consent-status]')).toContainText(/buffer/i);
      });

      await test.step('§12.1 — granting consent flushes buffer', async () => {
        await grantConsent(page);
        await expectConsentStatus(page, 'granted');
        await expect(page.locator('section.manual-harness-controls [data-consent-status]')).toContainText(/flush/i);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('historyMode query & hash embeds hydrate (spec §12.2)', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await gotoManualHarness(page, '/manual/routing');

      await test.step('§12.2 — query router hydrated', async () => {
        await expect(page.getByRole('heading', { name: 'historyMode="query"' })).toBeVisible();
        await expectEmbedStatus(page, /Embed ready/i, 0);
      });

      await test.step('§12.2 — hash router hydrated', async () => {
        await expect(page.getByRole('heading', { name: 'historyMode="hash"' })).toBeVisible();
        await expectEmbedStatus(page, /Embed ready/i, 1);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('path routing harness rewrites URLs (spec §12.4)', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await test.step('§12.4 — list view renders at /events', async () => {
        await gotoManualHarness(page, '/events');
        await expect(page.getByText(/Current detail slug:\s+list view/i)).toBeVisible();
        await expectEmbedStatus(page, /Embed ready/i, 0);
      });

      await test.step('§12.4 — detail view rewrites slug', async () => {
        await gotoManualHarness(page, '/events/sample-slug');
        await expect(page.getByText(/Current detail slug:\s+sample-slug/i)).toBeVisible();
        await expectEmbedStatus(page, /Embed ready/i, 0);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('lazy mount defers hydration (spec §12.5)', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await gotoManualHarness(page, '/manual/lazy', { consent: 'granted' });

      await test.step('§12.5 — embed waits for scroll', async () => {
        await expect(page.getByText('Scroll down to trigger the lazy observer…')).toBeVisible();
        const statusBeforeScroll = await getEmbedStatusText(page, 0);
        expect(statusBeforeScroll).toMatch(/Mounting embed…/i);
      });

      await test.step('§12.5 — scrolling hydrates embed', async () => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expectEmbedStatus(page, /Embed ready/i, 0);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('legacy mount inserts before script (spec §12.6)', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await gotoManualHarness(page, '/manual/legacy');

      await test.step('§12.6 — selector placeholder found', async () => {
        await expect(page.getByRole('heading', { name: 'Legacy Mount (data-mount-before)' })).toBeVisible();
        await expectEmbedStatus(page, /Legacy mount complete/i, 0);
      });

      await test.step('§12.6 — embed inserted before loader script', async () => {
        const script = await page.locator('script[data-manual-legacy-script]').elementHandle();
        const previousSibling = await script?.evaluate((node) => node.previousElementSibling?.hasAttribute('data-embed-container'));
        expect(previousSibling).toBe(true);
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('Trusted Types harness aborts safely (spec §12.7)', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await gotoManualHarness(page, '/manual/trusted-types');

      await test.step('§12.7 — fallback UI rendered', async () => {
        await expect(page.getByRole('heading', { name: 'Trusted Types Enforcement' })).toBeVisible();
        await expect(page.getByText(/Trusted Types enforcement prevented the embed from running/i)).toBeVisible();
        await expectEmbedStatus(page, /Trusted Types policy creation failed/i, 0);
      });

      await test.step('§12.7 — capture fallback screenshot', async () => {
        const screenshot = await page.screenshot({ fullPage: true });
        await testInfo.attach('trusted-types-abort', { body: screenshot, contentType: 'image/png' });
      });
    } finally {
      await logs.attach(testInfo);
    }
  });

  test('multi-embed harness preserves router ownership (spec §12.8)', async ({ page }, testInfo) => {
    const logs = new HubEmbedLogCollector(page);
    try {
      await gotoManualHarness(page, '/manual/multi');

      await test.step('§12.8 — both embeds hydrate', async () => {
        await expect(page.getByRole('heading', { name: 'Embed A — router owner' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Embed B — scoped clicks' })).toBeVisible();
        await expectEmbedStatus(page, /Embed ready/i, 0);
        await expectEmbedStatus(page, /Embed ready/i, 1);
      });

      await test.step('§12.8 — router owner banner present', async () => {
        await expect(page.getByText(/Active router owner/i)).toBeVisible();
      });
    } finally {
      await logs.attach(testInfo);
    }
  });
});
