import { describe, expect, it, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { fetchDefaultPlan } from '../plan-client';

const originalFetch = global.fetch;

describe('plan-client server fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (global as Partial<typeof global>).fetch;
    }
  });

  it('derives the API base from the incoming admin host', async () => {
    const plan = createDefaultDemoPlan();
    const payload = {
      plan,
      planHash: plan.meta?.planHash ?? 'default-plan',
      encodedPlan: 'encoded-plan',
      updatedAt: plan.updatedAt ?? plan.meta?.generatedAt ?? '2025-02-15T00:00:00.000Z'
    };

    const mockResponse = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    (global.fetch as unknown as Mock).mockResolvedValue(mockResponse);

    const previousWindow = (global as typeof globalThis & { window?: unknown }).window;
    // Force the server execution path for the duration of this assertion.
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (global as typeof globalThis & { window?: unknown }).window;

    try {
      await fetchDefaultPlan(undefined, { serverHost: 'admin.townthink.com' });
    } finally {
      if (previousWindow !== undefined) {
        (global as typeof globalThis & { window?: unknown }).window = previousWindow;
      }
    }

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [targetUrl] = (global.fetch as unknown as Mock).mock.calls[0];
    expect(targetUrl).toBe('https://api.townthink.com/v1/plan/default?tenantId=demo');
  });
});
