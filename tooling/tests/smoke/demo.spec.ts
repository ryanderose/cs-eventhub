import { expect, test } from '@playwright/test';

test('demo host homepage renders', async ({ page }) => {
  const url = process.env.SMOKE_DEMO_URL;
  test.skip(!url, 'SMOKE_DEMO_URL is not configured');

  const response = await page.goto(url!, { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();
});
