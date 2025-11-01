import { describe, expect, it, vi, afterEach } from 'vitest';
import { compose, buildDefaultStaticPlan } from './index';
import { computePlanHash } from '@events-hub/page-schema';

describe('AI Composer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a deterministic plan with plan hash', async () => {
    const result = await compose({
      tenantId: 'demo',
      intent: 'search',
      filters: { categories: ['music'], dateRange: { preset: 'weekend' } }
    });

    expect(result.page.meta.planHash).toBeDefined();
    expect(result.page.blocks.some((block) => block.kind === 'map-grid')).toBe(true);
    expect(result.page.blocks.some((block) => block.kind === 'promo-slot')).toBe(true);
    expect(result.composerVersion).toMatch(/composer\/1.5/);
  });

  it('builds the static default plan with stable ordering and hash', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    const plan = buildDefaultStaticPlan('demo');
    expect(plan.blocks).toHaveLength(3);
    expect(plan.blocks.map((block) => block.key)).toEqual(['block-one', 'block-who', 'block-three']);
    expect(plan.meta.planHash).toBeDefined();
    const recomputed = computePlanHash({ ...plan, meta: { ...plan.meta, planHash: undefined } });
    expect(plan.meta.planHash).toBe(recomputed);

    const second = buildDefaultStaticPlan('demo');
    expect(second.meta.planHash).toBe(plan.meta.planHash);
  });
});
