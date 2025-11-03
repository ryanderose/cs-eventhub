import { test } from '@playwright/test';
import { compareEndpoints } from '../../fixtures/parity';

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
  const localApiBase = process.env.LOCAL_API_URL ?? 'http://localhost:4000';

  await compareEndpoints(localApiBase, previewBase, [
    {
      path: '/api/v1/plan/default',
      pickHeaders: ['content-type', 'cache-control']
    },
    {
      path: '/api/v1/fragment?tenant=demo',
      pickHeaders: ['cache-control']
    }
  ]);
});
