import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../app/api/snippet/route';

describe('snippet API route', () => {
  it('returns manifest metadata', async () => {
    const request = new NextRequest('http://localhost/api/snippet');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { manifests: unknown[] };
    expect(Array.isArray(payload.manifests)).toBe(true);
    expect(payload.manifests.length).toBeGreaterThan(0);
  });
});
