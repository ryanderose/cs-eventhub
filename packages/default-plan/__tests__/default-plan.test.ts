import { describe, expect, it } from 'vitest';
import type { BlockInstance } from '@events-hub/page-schema';
import {
  DEFAULT_BLOCK_TEMPLATES,
  DEFAULT_PLAN_TIMESTAMP,
  createDefaultDemoPlan,
  getDefaultBlockAllowlist,
  relabelBlock,
  summarizeBlock
} from '../src';

describe('default plan module', () => {
  it('creates a deterministic default plan with canonical metadata', () => {
    const plan = createDefaultDemoPlan();

    expect(plan.updatedAt).toBe(DEFAULT_PLAN_TIMESTAMP);
    expect(plan.meta?.generatedAt).toBe(DEFAULT_PLAN_TIMESTAMP);
    expect(plan.blocks).toHaveLength(DEFAULT_BLOCK_TEMPLATES.length);
    expect(plan.meta?.planHash).toBe('default-plan-seed');
    expect(plan.meta?.flags?.seeded).toBe(true);

    plan.blocks.forEach((block, index) => {
      const template = DEFAULT_BLOCK_TEMPLATES[index];
      expect(block.key).toBe(template.key);
      expect(block.id).toBe(template.id);
      expect(block.kind).toBe(template.kind);
      expect(block.order).toBe(index);
    });
  });

  it('accepts timestamp and tenant overrides', () => {
    const now = new Date('2025-03-01T12:00:00.000Z');
    const plan = createDefaultDemoPlan({ tenantId: 'test', planHash: 'custom-hash', now });

    expect(plan.tenantId).toBe('test');
    expect(plan.updatedAt).toBe(now.toISOString());
    expect(plan.meta?.planHash).toBe('custom-hash');
  });

  it('exposes allowlist entries that mirror the block templates', () => {
    const allowlist = getDefaultBlockAllowlist();
    expect(allowlist).toHaveLength(DEFAULT_BLOCK_TEMPLATES.length);
    allowlist.forEach((entry, index) => {
      const template = DEFAULT_BLOCK_TEMPLATES[index];
      expect(entry).toMatchObject({ key: template.key, id: template.id, kind: template.kind });
    });
  });

  it('provides readable labels and summaries for admin previews', () => {
    const plan = createDefaultDemoPlan();
    const heroBlock = plan.blocks.find((block) => block.key === 'hero') as BlockInstance;
    const filterBlock = plan.blocks.find((block) => block.key === 'filter-bar') as BlockInstance;

    expect(relabelBlock(heroBlock)).toBe('Weekend highlights');
    expect(summarizeBlock(filterBlock)).toContain('Facets');
    expect(summarizeBlock(heroBlock)).toContain('Slides');
  });
});
