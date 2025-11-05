import { test } from '@playwright/test';
import { compareEndpoints, ParityBaselineUnavailableError } from '../../fixtures/parity';

function resolvePreviewApiBase(url: string): string {
  if (process.env.PREVIEW_API_URL) {
    return process.env.PREVIEW_API_URL;
  }
  if (url.includes('localhost:3000')) {
    // Placeholder: when running parity locally against the Next dev host we fall back to the local API.
    return 'http://localhost:4000';
  }
  return url;
}

test('default plan parity headers @preview @parity', async () => {
  test.skip(!process.env.PREVIEW_URL, 'PREVIEW_URL is required for parity checks');
  const previewHost = process.env.PREVIEW_URL!;
  const previewBase = resolvePreviewApiBase(previewHost);
  const localBaseline = process.env.LOCAL_API_URL ?? process.env.PARITY_BASELINE_API_URL ?? 'https://cs-eventhub-api.vercel.app';

  try {
    await compareEndpoints(localBaseline, previewBase, [
      {
        path: '/api/v1/plan/default',
        pickHeaders: ['content-type', 'cache-control']
      },
      {
        path: '/api/v1/fragment?tenant=demo',
        pickHeaders: ['cache-control']
      }
    ]);
  } catch (error) {
    if (error instanceof ParityBaselineUnavailableError) {
      test.skip(error.message);
      return;
    }
    throw error;
  }
});
