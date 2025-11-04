import { describe, expect, it } from 'vitest';

const baseUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4000';

describe('plan contracts', () => {
  it('GET /v1/plan/default returns normalized payload', async () => {
    const response = await fetch(`${baseUrl}/v1/plan/default?tenantId=demo`, {
      headers: { Accept: 'application/json' }
    });
    expect(response.status).toBe(200);

    const payload = (await response.json()) as Record<string, unknown>;
    expect(payload).toHaveProperty('plan');
    expect(payload).toHaveProperty('planHash');
    expect(payload).toHaveProperty('updatedAt');
  });
});
