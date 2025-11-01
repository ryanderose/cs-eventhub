import { describe, expect, it } from 'vitest';
import { canonicalizePageDoc, computePlanHash, DefaultPlanResponseSchema, isDefaultPlanResponse, PageDocSchema } from './index';

describe('Page schema', () => {
  it('canonicalizes block order before hashing', () => {
    const doc = PageDocSchema.parse({
      id: 'test',
      title: 'Test',
      path: '/test',
      tenantId: 'tenant',
      updatedAt: new Date().toISOString(),
      version: '1.5',
      blocks: [
        {
          id: 'b',
          key: 'b',
          kind: 'promo-slot',
          version: '1.5',
          order: 5,
          data: {
            slotId: 'slot-1',
            disclosure: 'Sponsored',
            measurement: {},
            safety: { blockedCategories: [], brandSuitability: 'moderate' }
          }
        },
        {
          id: 'a',
          key: 'a',
          kind: 'filter-bar',
          version: '1.5',
          order: 1,
          data: {
            facets: [],
            active: {},
            sortOptions: [],
            flags: { showReset: true, floating: false }
          }
        }
      ],
      meta: { cacheTags: [], flags: {}, locale: 'en-US' },
      planCursors: []
    });

    const canonical = canonicalizePageDoc(doc);
    expect(canonical.blocks[0].key).toBe('a');
    expect(canonical.blocks[1].key).toBe('b');

    const hashA = computePlanHash(doc);
    const hashB = computePlanHash({ ...doc, blocks: [...doc.blocks].reverse() });
    expect(hashA).toBe(hashB);
  });

  it('validates default plan responses', () => {
    const plan = PageDocSchema.parse({
      id: 'default-plan-demo',
      title: 'Default',
      path: '/',
      tenantId: 'demo',
      updatedAt: new Date().toISOString(),
      version: '1.5',
      blocks: [
        {
          id: 'block',
          key: 'block',
          kind: 'promo-slot',
          version: '1.5',
          order: 0,
          data: {
            slotId: 'slot-1',
            disclosure: 'Sponsored',
            measurement: {},
            safety: { blockedCategories: [], brandSuitability: 'moderate' }
          }
        }
      ],
      meta: { cacheTags: ['demo'], flags: {}, locale: 'en-US' },
      planCursors: []
    });

    const response = {
      plan,
      encodedPlan: 'encoded',
      planHash: 'hash',
      updatedAt: new Date().toISOString()
    };

    expect(() => DefaultPlanResponseSchema.parse(response)).not.toThrow();
    expect(isDefaultPlanResponse(response)).toBe(true);
    expect(isDefaultPlanResponse({})).toBe(false);
  });
});
