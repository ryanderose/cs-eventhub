import { test, expect } from '@playwright/test';

test.describe('api local smoke', () => {
  test('health endpoint responds', async ({ request, baseURL }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toBe('OK');
    expect(baseURL).toBeDefined();
  });
});
