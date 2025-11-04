import { describe, expect, it } from 'vitest';

const BASE = process.env.PREVIEW_API_URL ?? process.env.PREVIEW_URL ?? 'http://localhost:4000';
const PREVIEW_BYPASS_HEADER = (() => {
  const headers: Record<string, string> = {};
  const token = process.env.VERCEL_PROTECTION_BYPASS_API ?? process.env.VERCEL_PROTECTION_BYPASS;
  const signature = process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE_API ?? process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE;

  if (token) {
    headers['x-vercel-protection-bypass'] = token;
  }
  if (signature) {
    headers['x-vercel-protection-bypass-signature'] = signature;
  }
  return Object.keys(headers).length ? headers : undefined;
})();

function url(path: string): string {
  return new URL(path, BASE).toString();
}

function withPreviewHeaders(headers?: Record<string, string>): HeadersInit | undefined {
  if (!PREVIEW_BYPASS_HEADER) {
    return headers;
  }
  return {
    ...PREVIEW_BYPASS_HEADER,
    ...(headers ?? {})
  };
}

async function assertStatus(response: Response, expected: number) {
  if (response.status === expected) {
    return;
  }
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '<unreadable body>';
  }
  throw new Error(`Expected status ${expected}, received ${response.status}. Body: ${body}`);
}

describe('plan contract', () => {
  it('returns a plan document for GET /api/v1/plan/default', async () => {
    const response = await fetch(url('/api/v1/plan/default'), {
      headers: withPreviewHeaders()
    });
    await assertStatus(response, 200);

    const body = await response.json();
    expect(body).toHaveProperty('plan');
    expect(body).toHaveProperty('planHash');
    expect(body.plan).toHaveProperty('blocks');
    expect(Array.isArray(body.plan.blocks)).toBe(true);
  });

  it('rejects invalid updates for PUT /api/v1/plan/default', async () => {
    const response = await fetch(url('/api/v1/plan/default'), {
      method: 'PUT',
      headers: withPreviewHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ plan: { blocks: [] } })
    });
    await assertStatus(response, 400);
  });
});
