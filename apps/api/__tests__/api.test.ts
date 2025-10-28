import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { canonicalizePageDoc, withPlanHash } from '@events-hub/page-schema';
import { encodePlan } from '@events-hub/router-helpers';
import { persistEncodedPlan } from '../src/lib/plan';

const samplePage = withPlanHash(
  canonicalizePageDoc({
    id: 'plan',
    title: 'Plan',
    path: '/',
    tenantId: 'tenant',
    updatedAt: new Date().toISOString(),
    version: '1.5',
    blocks: [],
    meta: { cacheTags: [], flags: {}, locale: 'en-US' },
    planCursors: []
  })
);

const composeMock = vi.fn(async () => ({
  page: samplePage,
  composerVersion: 'composer/test',
  budgetMs: 100,
  fallbackTriggered: false
}));

vi.mock('@events-hub/ai-composer', () => ({
  compose: composeMock
}));

let composeHandler: (request: Request) => Promise<Response>;
let fragmentHandler: (request: Request) => Promise<Response>;
let interpretHandler: any;
let planHandler: any;
let configHandler: any;

beforeAll(async () => {
  composeHandler = (await import('../api/v1/compose')).default;
  fragmentHandler = (await import('../api/v1/fragment')).default;
  interpretHandler = (await import('../api/v1/interpret')).default;
  planHandler = (await import('../api/v1/plan/[id]')).default;
  configHandler = (await import('../api/config/tenants/[tenant]')).default;
});

beforeEach(() => {
  composeMock.mockClear();
  const cacheStore = new Map<string, Response>();
  vi.stubGlobal('caches', {
    default: {
      match: vi.fn(async (key: string) => cacheStore.get(key) ?? null),
      put: vi.fn(async (key: string, value: Response) => {
        cacheStore.set(key, value);
      })
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('edge compose', () => {
  it('returns composed payload with cache key header', async () => {
    const response = await composeHandler(
      new Request('https://example.com/v1/compose', {
        method: 'POST',
        body: JSON.stringify({ filters: {}, tenantId: 'tenant' }),
        headers: { 'content-type': 'application/json' }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-composer-cache-key')).toMatch(/compose:.+composer\/test/);
    const body = await response.json();
    expect(body).toMatchObject({ composerVersion: 'composer/test' });
    expect(body.encodedPlan).toBeDefined();
  });
});

describe('edge fragment', () => {
  it('applies CSP and cache headers', async () => {
    const response = await fragmentHandler(new Request('https://example.com/v1/fragment/demo', { method: 'GET' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(response.headers.get('cache-control')).toContain('s-maxage');
    expect(await response.text()).toContain('data-tenant="demo"');
  });
});

describe('node plan resolver', () => {
  it('returns stored plans', async () => {
    const encoded = encodePlan(samplePage);
    await persistEncodedPlan(encoded, samplePage.meta?.planHash ?? 'hash');

    const req = {
      method: 'GET',
      query: { id: samplePage.meta?.planHash },
      headers: {},
      body: undefined
    } as any;

    let status = 0;
    let jsonPayload: unknown;
    const res = {
      status(code: number) {
        status = code;
        return this;
      },
      json(payload: unknown) {
        jsonPayload = payload;
      },
      setHeader() {}
    } as any;

    await planHandler(req, res);
    expect(status).toBe(200);
    expect(jsonPayload).toHaveProperty('encoded');
  });
});

describe('node interpreter', () => {
  it('returns parsed filters', async () => {
    const req = { method: 'POST', body: { query: 'events this weekend' } } as any;
    const responsePayload: any = {};
    const res = {
      status(code: number) {
        responsePayload.status = code;
        return this;
      },
      json(payload: unknown) {
        responsePayload.body = payload;
      },
      setHeader() {}
    } as any;

    await interpretHandler(req, res);
    expect(responsePayload.status).toBe(200);
    expect(responsePayload.body).toHaveProperty('filters');
  });
});

describe('tenant config endpoint', () => {
  it('returns the demo tenant config with signature when configured', async () => {
    process.env.CONFIG_SIGNING_SECRET = 'test-secret';

    const jsonPayload: any = {};
    const res = {
      status(code: number) {
        jsonPayload.status = code;
        return this;
      },
      json(payload: unknown) {
        jsonPayload.body = payload;
      },
      setHeader() {},
      end() {}
    } as any;

    await configHandler({
      method: 'GET',
      query: { tenant: 'demo' },
      headers: {}
    } as any, res);

    expect(jsonPayload.status).toBe(200);
    expect(jsonPayload.body).toHaveProperty('config.manifestUrl');
    expect(jsonPayload.body).toHaveProperty('signature');

    delete process.env.CONFIG_SIGNING_SECRET;
  });

  it('returns 404 for unknown tenants', async () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader() {},
      end() {}
    } as any;

    await configHandler({ method: 'GET', query: { tenant: 'nope' }, headers: {} } as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Unknown tenant') }));
  });
});
