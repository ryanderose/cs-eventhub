import { beforeEach, describe, expect, it } from 'vitest';
import handler from '../api/v1/plan/default';

type MockResponse = {
  statusCode: number;
  payload: any;
  headers: Record<string, string>;
};

function createMockResponse(): { res: any; tracker: MockResponse } {
  const tracker: MockResponse = { statusCode: 0, payload: null, headers: {} };
  const res = {
    status(code: number) {
      tracker.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      tracker.payload = payload;
      return this;
    },
    setHeader(key: string, value: string) {
      tracker.headers[key.toLowerCase()] = value;
    }
  };
  return { res, tracker };
}

function createMockRequest(method: string, options: { body?: any; headers?: Record<string, string>; query?: Record<string, unknown> } = {}) {
  const { body, headers = {}, query = {} } = options;
  return {
    method,
    body,
    headers,
    query
  };
}

beforeEach(() => {
  delete (globalThis as any).__planCache;
  delete (globalThis as any).__defaultPagePointers;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

describe('/v1/plan/default handler', () => {
  it('seeds fallback plan when no pointer exists', async () => {
    const req = createMockRequest('GET');
    const { res, tracker } = createMockResponse();

    await handler(req as any, res as any);

    expect(tracker.statusCode).toBe(200);
    expect(tracker.payload.plan.blocks).toHaveLength(3);
    expect(tracker.payload.plan.blocks[0].data.title).toBe('block one');
    expect(typeof tracker.payload.planHash).toBe('string');
    expect(tracker.headers['cache-control']).toBe('no-store');
  });

  it('persists reordered plan and returns updated hash', async () => {
    // Seed fallback
    const seedReq = createMockRequest('GET');
    const seedRes = createMockResponse();
    await handler(seedReq as any, seedRes.res as any);
    const seedPayload = seedRes.tracker.payload;

    const reversedBlocks = [...seedPayload.plan.blocks].reverse().map((block: any, index: number) => ({
      ...block,
      order: index
    }));
    const updateReq = createMockRequest('PUT', {
      headers: {
        'if-match': seedPayload.planHash,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ plan: { ...seedPayload.plan, blocks: reversedBlocks } })
    });
    const updateRes = createMockResponse();

    await handler(updateReq as any, updateRes.res as any);

    expect(updateRes.tracker.statusCode).toBe(200);
    expect(updateRes.tracker.payload.plan.blocks[0].key).toBe(seedPayload.plan.blocks[2].key);
    expect(updateRes.tracker.payload.planHash).not.toBe(seedPayload.planHash);

    const fetchReq = createMockRequest('GET');
    const fetchRes = createMockResponse();
    await handler(fetchReq as any, fetchRes.res as any);

    expect(fetchRes.tracker.payload.plan.blocks[0].key).toBe(seedPayload.plan.blocks[2].key);
    expect(fetchRes.tracker.payload.planHash).toBe(updateRes.tracker.payload.planHash);
  });

  it('returns 412 when plan hash mismatches', async () => {
    const seedReq = createMockRequest('GET');
    const seedRes = createMockResponse();
    await handler(seedReq as any, seedRes.res as any);
    const seedPayload = seedRes.tracker.payload;

    const staleReq = createMockRequest('PUT', {
      headers: {
        'if-match': 'stale-hash',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ plan: seedPayload.plan })
    });
    const staleRes = createMockResponse();
    await handler(staleReq as any, staleRes.res as any);

    expect(staleRes.tracker.statusCode).toBe(412);
    expect(staleRes.tracker.payload.planHash).toBe(seedPayload.planHash);
  });

  it('rejects tenant mismatches', async () => {
    const seedReq = createMockRequest('GET', { query: { tenantId: 'demo' } });
    const seedRes = createMockResponse();
    await handler(seedReq as any, seedRes.res as any);
    const seedPayload = seedRes.tracker.payload;

    const mismatchReq = createMockRequest('PUT', {
      headers: {
        'if-match': seedPayload.planHash,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        plan: { ...seedPayload.plan, tenantId: 'other-tenant' }
      }),
      query: { tenantId: 'demo' }
    });
    const mismatchRes = createMockResponse();

    await handler(mismatchReq as any, mismatchRes.res as any);

    expect(mismatchRes.tracker.statusCode).toBe(400);
    expect(mismatchRes.tracker.payload.error).toBe('Tenant mismatch');
  });
});
