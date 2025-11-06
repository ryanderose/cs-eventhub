import { beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.NEXT_PUBLIC_API_BASE;
  delete process.env.NEXT_PUBLIC_CONFIG_URL;
  delete process.env.NEXT_PUBLIC_DEMO_HOSTNAME;
  delete process.env.NEXT_PUBLIC_DEFAULT_TENANT;
  delete process.env.VERCEL_URL;
}

async function loadEnvModule() {
  return import('../lib/env');
}

describe('demo-host env helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    resetEnv();
  });

  it('returns the explicit API base when configured', async () => {
    process.env.NEXT_PUBLIC_API_BASE = 'https://api.example.com';
    const { getApiBase } = await loadEnvModule();
    expect(getApiBase()).toBe('https://api.example.com');
  });

  it('derives the API base from the current host when the env is local', async () => {
    process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:4000';
    const { getApiBase } = await loadEnvModule();
    expect(getApiBase({ host: 'demo-hostbeta.townthink.com' })).toBe('https://apibeta.townthink.com');
  });

  it('preserves local API bases when the host is also local', async () => {
    process.env.NEXT_PUBLIC_API_BASE = 'http://localhost:4000';
    const { getApiBase } = await loadEnvModule();
    expect(getApiBase({ host: 'demo.localhost:3000' })).toBe('http://localhost:4000');
  });

  it('derives the config URL when no env override exists', async () => {
    const { getConfigUrl } = await loadEnvModule();
    expect(getConfigUrl({ host: 'demo-hostbeta.townthink.com', tenantId: 'demo' })).toBe(
      'https://configbeta.townthink.com/config/tenants/demo.json'
    );
  });

  it('respects the explicit config URL when provided', async () => {
    process.env.NEXT_PUBLIC_CONFIG_URL = 'https://config.example.com/config/tenants/demo.json';
    const { getConfigUrl } = await loadEnvModule();
    expect(getConfigUrl()).toBe('https://config.example.com/config/tenants/demo.json');
  });
});
