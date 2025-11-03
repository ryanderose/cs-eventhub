import { describe, expect, it } from 'vitest';

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:4000';

function url(path: string): string {
  return new URL(path, BASE).toString();
}

describe('plan contract', () => {
  it('returns a plan document for GET /api/v1/plan/default', async () => {
    const response = await fetch(url('/api/v1/plan/default'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('plan');
    expect(body).toHaveProperty('planHash');
    expect(body.plan).toHaveProperty('blocks');
    expect(Array.isArray(body.plan.blocks)).toBe(true);
  });

  it('rejects invalid updates for PUT /api/v1/plan/default', async () => {
    const response = await fetch(url('/api/v1/plan/default'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: { blocks: [] } })
    });
    expect(response.status).toBe(400);
  });
});
