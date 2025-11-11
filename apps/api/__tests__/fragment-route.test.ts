import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

describe('fragment routes', () => {
  const jsonHeaders = { accept: 'application/json' };
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  it('returns fragment payloads via REST-style tenant path', async () => {
    const response = await request(app).get('/v1/fragment/demo?view=list').set(jsonHeaders);
    expect(response.status).toBe(200);
    expect(response.headers['x-fragment-tenant']).toBe('demo');
    expect(response.body?.parity?.withinThreshold).toBe(true);
  });

  it('keeps query-style tenantId path for backwards compatibility', async () => {
    const response = await request(app).get('/v1/fragment?tenantId=demo&view=detail').set(jsonHeaders);
    expect(response.status).toBe(200);
    expect(response.body?.view).toBe('detail');
    expect(response.headers['x-fragment-tenant']).toBe('demo');
  });
});
