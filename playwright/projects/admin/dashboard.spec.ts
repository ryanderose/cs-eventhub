import { expect, test } from '@playwright/test';
import { setupMsw } from '../../fixtures/msw';

function resolveUrl(base: string | undefined, path: string): string {
  const resolvedBase = base ?? 'http://localhost:3001';
  return new URL(path, resolvedBase).toString();
}

test.describe('admin app (local)', () => {
  setupMsw();

  test('admin dashboard renders', async ({ request, baseURL }) => {
    const url = resolveUrl(baseURL, '/');
    const response = await request.get(url, { headers: { Accept: 'text/html' } });
    expect(response.status(), `GET ${url}`).toBe(200);
    const html = await response.text();
    expect(html).toContain('Events Hub Admin');
  });
});

test.describe('admin app (preview)', () => {
  test('admin dashboard renders on preview @preview', async ({ request }) => {
    test.skip(!process.env.PREVIEW_URL, 'PREVIEW_URL is not configured');
    const previewBase = process.env.PREVIEW_ADMIN_URL ?? process.env.PREVIEW_URL;
    const url = resolveUrl(previewBase, '/');
    const response = await request.get(url, { headers: { Accept: 'text/html' } });
    expect(response.status(), `GET ${url}`).toBe(200);
    const html = await response.text();
    expect(html).toContain('Events Hub Admin');
  });
});
