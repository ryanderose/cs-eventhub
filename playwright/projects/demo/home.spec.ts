import { expect, test } from '@playwright/test';
import { setupMsw } from '../../fixtures/msw';

function resolveUrl(base: string | undefined, path: string): string {
  const resolvedBase = base ?? 'http://localhost:3000';
  return new URL(path, resolvedBase).toString();
}

test.describe('demo host (local)', () => {
  setupMsw();

  test('demo host homepage renders default plan', async ({ request, baseURL }) => {
    const url = resolveUrl(baseURL, '/');
    const response = await request.get(url, { headers: { Accept: 'text/html' } });
    expect(response.status(), `GET ${url}`).toBe(200);
    const html = await response.text();
    expect(html).toContain('Events Hub Demo Host');
  });
});

test.describe('demo host (preview)', () => {
  test('demo host smoke renders in preview @preview', async ({ request }) => {
    test.skip(!process.env.PREVIEW_URL, 'PREVIEW_URL is not configured');
    const previewBase = process.env.PREVIEW_DEMO_URL ?? process.env.PREVIEW_URL;
    const url = resolveUrl(previewBase, '/');
    const response = await request.get(url, { headers: { Accept: 'text/html' } });
    expect(response.status(), `GET ${url}`).toBe(200);
    const html = await response.text();
    expect(html).toContain('Events Hub Demo Host');
  });

  test('preview host publishes remote config + API bases @preview', async ({ page }) => {
    const previewBase = process.env.PREVIEW_DEMO_URL ?? process.env.PREVIEW_URL;
    test.skip(!previewBase, 'PREVIEW_URL or PREVIEW_DEMO_URL is required for preview host checks');

    await page.goto('/');
    const container = page.locator('[data-embed-container]');
    await expect(container).toBeVisible();

    const apiBase = await container.getAttribute('data-api-base');
    const configUrl = await container.getAttribute('data-config-url');

    expect(apiBase, 'API base should be present in preview').toBeTruthy();
    expect(apiBase?.includes('localhost'), 'Preview API base must not point to localhost').toBe(false);
    expect(apiBase?.startsWith('https://'), 'Preview API base should use https').toBe(true);

    expect(configUrl, 'Config URL should be present in preview').toBeTruthy();
    expect(configUrl?.includes('localhost'), 'Preview config URL must not point to localhost').toBe(false);
    expect(configUrl?.startsWith('https://'), 'Preview config URL should use https').toBe(true);
  });
});
