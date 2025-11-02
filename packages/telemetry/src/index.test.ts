import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_DEFAULT_PLAN_SPANS, recordAdminDefaultPlan, resolveTelemetryMode } from './index';

const originalEnv = process.env.NODE_ENV;
const originalTelemetryMode = process.env.TELEMETRY_MODE;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  if (originalTelemetryMode === undefined) {
    delete process.env.TELEMETRY_MODE;
  } else {
    process.env.TELEMETRY_MODE = originalTelemetryMode;
  }
  vi.restoreAllMocks();
});

describe('recordAdminDefaultPlan', () => {
  it('logs plan events outside of test mode', () => {
    process.env.NODE_ENV = 'development';
    process.env.TELEMETRY_MODE = 'dev';
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
      '[telemetry:dev] analytics.admin.default_plan.save',
      expect.objectContaining({
        status: 'success',
        tenantId: 'demo',
        planHash: 'hash-123',
        route: '/blocks',
        sessionId: 'unit-test',
        source: 'admin-ui',
        ts: 123,
        telemetryMode: 'dev'
      })
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
    process.env.TELEMETRY_MODE = 'dev';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.save,
      status: 'conflict',
      envelope: { tenantId: 'demo', planHash: 'hash-0001' },
      message: 'stale plan detected',
      source: 'api'
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[telemetry:dev] analytics.admin.default_plan.save',
      expect.objectContaining({
        status: 'conflict',
        tenantId: 'demo',
        planHash: 'hash-0001',
        message: 'stale plan detected',
        source: 'api',
        telemetryMode: 'dev'
      })
    );
  });

  it('treats invalid payloads as warnings', () => {
    process.env.NODE_ENV = 'development';
    process.env.TELEMETRY_MODE = 'dev';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.save,
      status: 'invalid',
      envelope: { tenantId: 'demo' },
      message: 'Plan payload invalid',
      source: 'api'
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[telemetry:dev] analytics.admin.default_plan.save',
      expect.objectContaining({
        status: 'invalid',
        tenantId: 'demo',
        message: 'Plan payload invalid',
        source: 'api',
        telemetryMode: 'dev'
      })
    );
  });

  it('suppresses events when telemetry mode is noop', () => {
    process.env.NODE_ENV = 'development';
    process.env.TELEMETRY_MODE = 'noop';
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
      status: 'success',
      envelope: { tenantId: 'demo', planHash: 'hash-777' }
    });
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('uses prod prefix when telemetry mode is prod', () => {
    process.env.NODE_ENV = 'production';
    process.env.TELEMETRY_MODE = 'prod';
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
      status: 'success',
      envelope: { tenantId: 'demo', planHash: 'hash-888' }
    });
    expect(infoSpy).toHaveBeenCalledWith(
      '[telemetry] analytics.admin.default_plan.fetch',
      expect.objectContaining({ telemetryMode: 'prod', planHash: 'hash-888', tenantId: 'demo' })
    );
  });
});

describe('resolveTelemetryMode', () => {
  it('defaults to dev outside production/test when unset', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.TELEMETRY_MODE;
    expect(resolveTelemetryMode()).toBe('dev');
  });

  it('defaults to prod in production when unset', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TELEMETRY_MODE;
    expect(resolveTelemetryMode()).toBe('prod');
  });

  it('defaults to noop in test when unset', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.TELEMETRY_MODE;
    expect(resolveTelemetryMode()).toBe('noop');
  });
});
