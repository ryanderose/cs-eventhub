import { test, expect } from '../../fixtures/msw';
import { startMockApiServer } from '../../fixtures/mock-api';

const API_PORT = 4102;

test.describe('admin local smoke', () => {
  test('renders default plan list from mocked API', async ({ page }) => {
    const api = await startMockApiServer(API_PORT);

    try {
      await page.goto('/blocks', { waitUntil: 'networkidle' });

      await expect(page.getByText(/Top picks/i)).toBeVisible();
      await expect(page.getByRole('listitem').first()).toBeVisible();
    } finally {
      await api.close();
    }
  });
});
