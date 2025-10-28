import { expect, test } from '@playwright/test';

function normalizeBaseUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

test('fragment endpoint responds', async ({ request }) => {
  const base = process.env.SMOKE_API_URL;
  const tenant = process.env.SMOKE_TENANT ?? 'demo';
  test.skip(!base, 'SMOKE_API_URL is not configured');

  const url = `${normalizeBaseUrl(base!)}/v1/fragment/${tenant}`;
  const response = await request.get(url, {
    headers: { Accept: 'text/html' }
  });

  expect(response.status(), `GET ${url}`).toBe(200);
  expect(response.headers()['cache-control']).toBeTruthy();
});
