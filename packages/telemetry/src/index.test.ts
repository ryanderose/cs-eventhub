import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_DEFAULT_PLAN_SPANS, recordAdminDefaultPlan } from './index';

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  vi.restoreAllMocks();
});

describe('recordAdminDefaultPlan', () => {
  it('logs plan events outside of test mode', () => {
    process.env.NODE_ENV = 'development';
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.save,
      status: 'success',
      envelope: {
        tenantId: 'demo',
        planHash: 'hash-123',
        route: '/blocks',
        sessionId: 'unit-test',
        ts: 123
      },
      source: 'admin-ui'
    });
    expect(spy).toHaveBeenCalledWith(
      '[telemetry] analytics.admin.default_plan.save',
      expect.objectContaining({ status: 'success', tenantId: 'demo', planHash: 'hash-123', route: '/blocks', sessionId: 'unit-test', source: 'admin-ui', ts: 123 })
    );
  });

  it('is silent when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
      status: 'error',
      envelope: { tenantId: 'demo', planHash: 'hash-999' },
      source: 'admin-ui'
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('logs conflicts as warnings', () => {
    process.env.NODE_ENV = 'development';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.save,
      status: 'conflict',
      envelope: { tenantId: 'demo', planHash: 'hash-0001' },
      message: 'stale plan detected',
      source: 'api'
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[telemetry] analytics.admin.default_plan.save',
      expect.objectContaining({ status: 'conflict', tenantId: 'demo', planHash: 'hash-0001', message: 'stale plan detected', source: 'api' })
    );
  });

  it('treats invalid payloads as warnings', () => {
    process.env.NODE_ENV = 'development';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.save,
      status: 'invalid',
      envelope: { tenantId: 'demo' },
      message: 'Plan payload invalid',
      source: 'api'
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[telemetry] analytics.admin.default_plan.save',
      expect.objectContaining({ status: 'invalid', tenantId: 'demo', message: 'Plan payload invalid', source: 'api' })
    );
  });
});
