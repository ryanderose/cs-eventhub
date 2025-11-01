import { afterEach, describe, expect, it, vi } from 'vitest';
import { recordAdminDefaultPlan } from './index';

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  vi.restoreAllMocks();
});

describe('recordAdminDefaultPlan', () => {
  it('logs plan events outside of test mode', () => {
    process.env.NODE_ENV = 'development';
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    recordAdminDefaultPlan({ type: 'analytics.admin.default_plan.save', status: 'success', planHash: 'hash-123' });
    expect(spy).toHaveBeenCalledWith('[telemetry] analytics.admin.default_plan.save', { status: 'success', planHash: 'hash-123' });
  });

  it('is silent when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    recordAdminDefaultPlan({ type: 'analytics.admin.default_plan.fetch', status: 'error', planHash: 'hash-999' });
    expect(spy).not.toHaveBeenCalled();
  });
});
