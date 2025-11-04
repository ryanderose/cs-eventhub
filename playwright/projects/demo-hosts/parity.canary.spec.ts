import { test } from '@playwright/test';
import { compareEndpoints } from '../../fixtures/parity';
import { startMockApiServer } from '../../fixtures/mock-api';

const LOCAL_BASE = 'http://127.0.0.1:3000';
const API_PORT = 4101;

test('demo host parity canary @preview', async () => {
  const previewUrl = process.env.PREVIEW_URL;
  test.skip(!previewUrl, 'PREVIEW_URL is required for parity checks');

  const api = await startMockApiServer(API_PORT);

  try {
    await compareEndpoints(LOCAL_BASE, previewUrl!, [{ path: '/', pickHeaders: ['content-type'] }]);
  } finally {
    await api.close();
  }
});
