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
});
