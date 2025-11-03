import { expect, test } from '@playwright/test';

const PLAN_ENDPOINT = '/api/v1/plan/default';

function resolveUrl(base: string | undefined, path: string): string {
  const resolvedBase = base ?? 'http://localhost:4000';
  return new URL(path, resolvedBase).toString();
}

test.describe('default plan API', () => {
  test('responds with payload locally', async ({ request, baseURL }) => {
    const url = resolveUrl(baseURL, PLAN_ENDPOINT);
    const response = await request.get(url);
    expect(response.status(), `GET ${url}`).toBe(200);
    const payload = await response.json();
    expect(payload).toHaveProperty('plan');
    expect(payload).toHaveProperty('planHash');
  });

  test('responds with payload on preview @preview', async ({ request }) => {
    test.skip(!process.env.PREVIEW_URL, 'PREVIEW_URL is not configured');
    const previewBase = process.env.PREVIEW_API_URL ?? process.env.PREVIEW_URL;
    const url = resolveUrl(previewBase, PLAN_ENDPOINT);
    const response = await request.get(url);
    expect(response.status(), `GET ${url}`).toBe(200);
    const payload = await response.json();
    expect(payload).toHaveProperty('plan');
    expect(payload).toHaveProperty('planHash');
  });
});
