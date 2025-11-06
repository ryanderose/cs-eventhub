import { getDefaultBlockAllowlist } from '@events-hub/default-plan';
import { beforeEach, describe, expect, it } from 'vitest';
import defaultPlanHandler from '../api/v1/plan/default';
import { __resetDefaultPageStoreForTests } from '../src/lib/pages-store';

type MockResponse = {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => void;
  setHeader: (key: string, value: string) => void;
};

const BLOCK_ALLOWLIST = getDefaultBlockAllowlist();
const EXPECTED_ORDERS = BLOCK_ALLOWLIST.map((_, index) => index);

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
    },
    setHeader(key: string, value: string) {
      this.headers[key.toLowerCase()] = value;
    }
  };
}

function resetPlanMemoryCache() {
  const globalStore = globalThis as typeof globalThis & { __planCache?: Map<string, unknown> };
  if (globalStore.__planCache) {
    globalStore.__planCache.clear();
  }
}

describe('default plan API', () => {
  beforeEach(() => {
    __resetDefaultPageStoreForTests();
    resetPlanMemoryCache();
  });

  it('seeds the default plan on first fetch', async () => {
    const req = { method: 'GET', query: {} } as any;
    const res = createMockResponse();

    await defaultPlanHandler(req, res);

    expect(res.statusCode).toBe(200);
    const payload = res.body as {
      plan: { version: string; blocks: Array<{ key: string; order: number }>; meta: { planHash?: string } };
      planHash: string;
      encodedPlan: string;
    };
    expect(payload.plan.version).toBe('1.6');
    expect(payload.plan.blocks).toHaveLength(BLOCK_ALLOWLIST.length);
    expect(payload.plan.blocks.map((block) => block.order)).toEqual(EXPECTED_ORDERS);
    expect(payload.plan.meta.planHash).toBeTruthy();
    expect(payload.planHash).toBe(payload.plan.meta.planHash);
    expect(typeof payload.encodedPlan).toBe('string');
  });

  it('updates block ordering and enforces optimistic concurrency', async () => {
    const getReq = { method: 'GET', query: {} } as any;
    const getRes = createMockResponse();
    await defaultPlanHandler(getReq, getRes);
    type DefaultPlanResponse = {
      plan: { blocks: Array<{ key: string; order: number }>; meta: { planHash?: string } };
      planHash: string;
    };
    const original = getRes.body as DefaultPlanResponse;

    const reorderedBlocks = [...original.plan.blocks]
      .map((block) => ({ ...block }))
      .reverse()
      .map((block, index) => ({ ...block, order: index }));

    const putReq = {
      method: 'PUT',
      query: {},
      body: {
        plan: {
          ...original.plan,
          blocks: reorderedBlocks
        }
      }
    } as any;
    const putRes = createMockResponse();

    await defaultPlanHandler(putReq, putRes);
    expect(putRes.statusCode).toBe(200);
    const updated = putRes.body as DefaultPlanResponse;
    expect(updated.planHash).not.toBe(original.planHash);
    const sortedKeys = [...reorderedBlocks]
      .sort((a, b) => a.order - b.order)
      .map((block) => block.key);
    expect(updated.plan.blocks.map((block) => block.key)).toEqual(sortedKeys);
    expect(updated.plan.blocks.map((block) => block.order)).toEqual(EXPECTED_ORDERS);

    const staleReq = {
      method: 'PUT',
      query: {},
      body: {
        plan: {
          ...original.plan,
          blocks: reorderedBlocks
        }
      }
    } as any;
    const staleRes = createMockResponse();
    await defaultPlanHandler(staleReq, staleRes);

    expect(staleRes.statusCode).toBe(412);
    expect(staleRes.body).toMatchObject({ error: 'plan_conflict', planHash: updated.planHash });
  });

  it('rejects non-contiguous order values', async () => {
    type DefaultPlanResponse = {
      plan: { blocks: Array<{ key: string; order: number }>; meta: { planHash?: string } };
      planHash: string;
    };
    const getReq = { method: 'GET', query: {} } as any;
    const getRes = createMockResponse();
    await defaultPlanHandler(getReq, getRes);
    const original = getRes.body as DefaultPlanResponse;

    const invalidBlocks = original.plan.blocks.map((block, index) => ({
      ...block,
      order: index === 0 ? 5 : index
    }));

    const putReq = {
      method: 'PUT',
      query: {},
      body: {
        plan: {
          ...original.plan,
          blocks: invalidBlocks
        }
      }
    } as any;
    const putRes = createMockResponse();
    await defaultPlanHandler(putReq, putRes);
    expect(putRes.statusCode).toBe(400);
    expect(putRes.body).toMatchObject({ error: 'invalid_block_order' });
  });
  it('rejects block tuples that do not match the allowlist', async () => {
    type DefaultPlanResponse = {
      plan: { blocks: Array<{ key: string; order: number; id: string; kind: string }>; meta: { planHash?: string } };
      planHash: string;
    };

    const getReq = { method: 'GET', query: {} } as any;
    const getRes = createMockResponse();
    await defaultPlanHandler(getReq, getRes);
    const original = getRes.body as DefaultPlanResponse;

    const invalid = original.plan.blocks.map((block, index) =>
      index === 0 ? { ...block, id: `${block.id}-tampered` } : block
    );

    const putReq = {
      method: 'PUT',
      query: {},
      body: {
        plan: {
          ...original.plan,
          blocks: invalid
        }
      }
    } as any;
    const putRes = createMockResponse();

    await defaultPlanHandler(putReq, putRes);
    expect(putRes.statusCode).toBe(400);
    expect(putRes.body).toMatchObject({ error: 'invalid_block' });
  });
});
