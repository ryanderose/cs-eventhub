import { describe, expect, it } from 'vitest';
import fragmentHandler from '../api/v1/fragment';

describe('fragment JSON-LD parity enforcement', () => {
  it('returns JSON-LD payload with parity metadata', async () => {
    const request = new Request('https://example.com/v1/fragment/demo', {
      method: 'GET',
      headers: { accept: 'application/json' }
    });
    const response = await fragmentHandler(request);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.jsonLd).toBeDefined();
    expect(payload.parity).toMatchObject({ withinThreshold: true, idsMatch: true });
  });

  it('sets noindex headers for AI routes', async () => {
    const request = new Request('https://example.com/v1/fragment/demo?view=ai', {
      method: 'GET',
      headers: { accept: 'application/json' }
    });
    const response = await fragmentHandler(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-robots-tag')).toBe('noindex');
    const payload = await response.json();
    expect(payload.noindex).toBe(true);
  });
});
