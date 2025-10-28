import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import handler from '../api/config/tenants/[tenant]';

function createMockResponse() {
  const headers = new Map<string, string>();
  return {
    statusCode: 200,
    body: undefined as unknown,
    ended: false,
    headers,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(key: string, value: string) {
      headers.set(key.toLowerCase(), value);
    },
    end() {
      this.ended = true;
    }
  };
}

describe('config tenant handler', () => {
  beforeEach(() => {
    process.env.CONFIG_SIGNING_SECRET = 'test-secret';
    process.env.CONFIG_API_BASE = 'https://api.townthink.com';
    process.env.CONFIG_CDN_ORIGIN = 'https://cdn.townthink.com';
    process.env.CONFIG_BETA_MANIFEST = 'https://cdn.townthink.com/hub-embed@latest/manifest.json';
    process.env.CONFIG_BETA_EMBED_SRC = 'https://cdn.townthink.com/hub-embed@latest/hub-embed.umd.js';
  });

  afterEach(() => {
    delete process.env.CONFIG_SIGNING_SECRET;
    delete process.env.CONFIG_API_BASE;
    delete process.env.CONFIG_CDN_ORIGIN;
    delete process.env.CONFIG_BETA_MANIFEST;
    delete process.env.CONFIG_BETA_EMBED_SRC;
  });

  it('responds with tenant configuration and signature', () => {
    const req = { method: 'GET', query: { tenant: 'demo' } } as any;
    const res = createMockResponse();

    handler(req, res);

    expect(res.statusCode).toBe(200);
    const payload = res.body as { config: any; signature: string | null };
    expect(payload.config).toMatchObject({
      tenant: 'demo',
      apiBase: 'https://api.townthink.com',
      manifestUrl: 'https://cdn.townthink.com/hub-embed@latest/manifest.json'
    });
    expect(payload.signature).toBeTruthy();
    expect(res.headers.get('cache-control')).toContain('s-maxage');
  });

  it('returns 404 for unknown tenants', () => {
    const req = { method: 'GET', query: { tenant: 'unknown' } } as any;
    const res = createMockResponse();

    handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Unknown tenant: unknown' });
  });

  it('handles CORS preflight requests', () => {
    const req = { method: 'OPTIONS', query: { tenant: 'demo' } } as any;
    const res = createMockResponse();

    handler(req, res);

    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
  });
});
