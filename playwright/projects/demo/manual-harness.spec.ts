import { expect, test } from '@playwright/test';

const STATUS_TIMEOUT = 20_000;

async function expectStatus(page, index: number, matcher: RegExp | string) {
  await expect(page.getByRole('status').nth(index)).toHaveText(matcher, { timeout: STATUS_TIMEOUT });
}

test.describe('Manual harness smoke', () => {
  test('manual index lists every harness card', async ({ page }) => {
    await page.goto('/manual');
    await expect(page.getByRole('heading', { name: 'Manual Embed Harness' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Query & Hash Routing →' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Legacy Mount →' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Trusted Types Enforcement →' })).toBeVisible();
  });

  test('historyMode query/hash harness hydrates both embeds', async ({ page }) => {
    await page.goto('/manual/routing');
    await expect(page.getByRole('heading', { name: 'historyMode="query"' })).toBeVisible();
    await expectStatus(page, 0, /Embed ready/i);
    await expect(page.getByRole('heading', { name: 'historyMode="hash"' })).toBeVisible();
    await expectStatus(page, 1, /Embed ready/i);
  });

  test('path routing harness supports list and detail routes', async ({ page }) => {
    await page.goto('/events');
    await expect(page.getByText(/Current detail slug:\s+list view/i)).toBeVisible();
    await expectStatus(page, 0, /Embed ready/i);

    await page.goto('/events/sample-slug');
    await expect(page.getByText(/Current detail slug:\s+sample-slug/i)).toBeVisible();
    await expectStatus(page, 0, /Embed ready/i);
  });

  test('lazy mount harness defers hydration until scrolled', async ({ page }) => {
    await page.goto('/manual/lazy');
    await expect(page.getByText('Scroll down to trigger the lazy observer…')).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(/Mounting embed…/i);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expectStatus(page, 0, /Embed ready/i);
  });

  test('legacy mount harness inserts before loader script', async ({ page }) => {
    await page.goto('/manual/legacy');
    await expect(page.getByRole('heading', { name: 'Legacy Mount (data-mount-before)' })).toBeVisible();
    await expectStatus(page, 0, /Legacy mount complete/i);
  });

  test('Trusted Types harness aborts safely', async ({ page }) => {
    await page.goto('/manual/trusted-types');
    await expect(page.getByRole('heading', { name: 'Trusted Types Enforcement' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText(/Trusted Types enforcement prevented the embed from running/i);
    await expectStatus(page, 0, /Trusted Types policy creation failed/i);
  });

  test('multi-embed harness initializes both instances', async ({ page }) => {
    await page.goto('/manual/multi');
    await expect(page.getByRole('heading', { name: 'Embed A — router owner' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Embed B — scoped clicks' })).toBeVisible();
    await expectStatus(page, 0, /Embed ready/i);
    await expectStatus(page, 1, /Embed ready/i);
  });
});
