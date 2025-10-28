import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, webcrypto as nodeWebCrypto } from 'crypto';
import { GET, revalidate, runtime } from '../app/(seo)/fragment/[tenant]/route';

const originalFetch = globalThis.fetch;

beforeAll(() => {
  if (!globalThis.crypto || !('subtle' in globalThis.crypto)) {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: nodeWebCrypto
    });
  }
});

function mockResponse(body: unknown, init?: ResponseInit) {
  return Promise.resolve(new Response(JSON.stringify(body), init));
}

describe('SEO fragment route', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE = 'https://api.events-hub.dev';
  });

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
  });

  it('exports the expected runtime configuration', () => {
    expect(runtime).toBe('edge');
    expect(typeof revalidate).toBe('number');
  });

  it('returns hashed critical CSS from the upstream API', async () => {
    const css = '.hero{color:cyan;}';
    const html = '<div>fragment</div>';
    const expectedHash = createHash('sha256').update(css).digest('hex');

    globalThis.fetch = vi.fn(() =>
      mockResponse(
        {
          html,
          css
        },
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    ) as typeof fetch;

    const response = await GET(new Request('https://demo.localhost/app/(seo)/fragment/demo'), {
      params: { tenant: 'demo' }
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ html, css, cssHash: expectedHash });
    expect(response.headers.get('x-events-hub-css-hash')).toBe(expectedHash);
    expect(response.headers.get('cache-control')).toContain('s-maxage');
  });

  it('returns an error response when the upstream request fails', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve(new Response('nope', { status: 502 }))) as typeof fetch;

    const response = await GET(new Request('https://demo.localhost/app/(seo)/fragment/demo'), {
      params: { tenant: 'demo' }
    });

    expect(response.status).toBe(502);
    const error = await response.json();
    expect(error.error).toContain('Fragment request failed');
  });
});
