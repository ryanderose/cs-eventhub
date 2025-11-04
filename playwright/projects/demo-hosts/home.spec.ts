import { test, expect } from '../../fixtures/msw';
import { startMockApiServer } from '../../fixtures/mock-api';
import { defaultPlanResponse } from '../../mocks/handlers';

const API_PORT = 4101;

test.describe('demo hosts local smoke', () => {
  test('renders embed with mocked plan', async ({ page }) => {
    const api = await startMockApiServer(API_PORT);
    await page.route('**/v1/plan/default**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(defaultPlanResponse)
      });
    });

    try {
      await page.goto('/', { waitUntil: 'networkidle' });

      await expect(page.getByRole('heading', { name: /events hub demo host/i })).toBeVisible();
      await expect(page.getByRole('status')).toContainText(/embed ready/i);
    } finally {
      await api.close();
    }
  });
});
