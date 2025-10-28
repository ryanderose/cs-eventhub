import { expect, test } from '@playwright/test';

function normalizeBaseUrl(url: string) {
  return url.endsWith('/') ? url : `${url}/`;
}

function joinUrl(base: string, path: string) {
  const normalizedPath = path.replace(/^\/+/, '');
  return new URL(normalizedPath, normalizeBaseUrl(base)).toString();
}

test('embed bundle responds', async ({ request }) => {
  const base = process.env.EMBED_CDN_BASE_URL;
  const cdnPath = process.env.EMBED_CDN_PATH ?? '';
  const asset = process.env.EMBED_CDN_ASSET ?? 'hub-embed.umd.js';

  test.skip(!base, 'EMBED_CDN_BASE_URL is not configured');

  const url = joinUrl(base!, `${cdnPath}/${asset}`);
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('javascript');
});

test('manifest lists assets', async ({ request }) => {
  const manifestUrl = process.env.EMBED_MANIFEST_URL;

  test.skip(!manifestUrl, 'EMBED_MANIFEST_URL is not configured');

  const response = await request.get(manifestUrl!);
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();

  expect(Array.isArray(manifest.assets)).toBe(true);
  expect(manifest.assets.length).toBeGreaterThan(0);
  for (const asset of manifest.assets) {
    expect(asset).toHaveProperty('path');
    expect(asset).toHaveProperty('integrity');
  }
});
