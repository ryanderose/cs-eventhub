import { describe, expect, it } from 'vitest';
import { compose } from './index';

describe('AI Composer', () => {
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
});
