import { test } from '@playwright/test';
import { compareEndpoints } from '../../fixtures/parity';

const LOCAL_BASE = 'http://127.0.0.1:4000';

test('api parity canary @preview', async () => {
  const previewUrl = process.env.PREVIEW_URL;
  test.skip(!previewUrl, 'PREVIEW_URL is required for parity checks');

  await compareEndpoints(LOCAL_BASE, previewUrl!, [{ path: '/health', pickHeaders: ['content-type'] }]);
});
