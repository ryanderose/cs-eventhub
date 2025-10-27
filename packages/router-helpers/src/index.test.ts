import { describe, expect, it } from 'vitest';
import { canonicalizePageDoc, withPlanHash } from '@events-hub/page-schema';
import { decodePlan, encodePlan } from './index';

describe('Plan encoding', () => {
  const plan = withPlanHash(
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

  it('round trips page docs', () => {
    const encoded = encodePlan(plan);
    const decoded = decodePlan(encoded);
    expect(decoded.meta?.planHash).toBe(plan.meta?.planHash);
  });
});
