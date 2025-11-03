import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTelemetryClient, resolveTelemetryMode, type TelemetryMode } from '../src/config/telemetry';

const envelope = {
  tenantId: 'demo',
  sessionId: 'session-1',
  ts: Date.now(),
  route: '/',
  planHash: 'hash',
  device: 'desktop'
};

const payload = {
  type: 'sdk.blockHydrated' as const,
  blockId: 'block-1',
  firstPaintMs: 12,
  items: 4
};

function createConsoleStub() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.TELEMETRY_MODE;
  delete process.env.TELEMETRY_ENDPOINT;
});

describe('resolveTelemetryMode', () => {
  it('defaults to noop when TELEMETRY_MODE is unset', () => {
    delete process.env.TELEMETRY_MODE;
    expect(resolveTelemetryMode()).toBe('noop');
  });

  it('normalises case for supported modes', () => {
    process.env.TELEMETRY_MODE = 'DEV';
    expect(resolveTelemetryMode()).toBe('dev');
  });

  it('falls back to noop for unsupported values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    process.env.TELEMETRY_MODE = 'invalid';
    expect(resolveTelemetryMode()).toBe('noop');
    expect(warn).toHaveBeenCalledWith('[telemetry] Unsupported TELEMETRY_MODE "invalid", falling back to "noop".');
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });
});

describe('createTelemetryClient', () => {
  const supportedModes: TelemetryMode[] = ['noop', 'dev', 'prod'];

  it.each(supportedModes)('returns client with requested mode: %s', (mode) => {
    const consoleStub = createConsoleStub();
    const baseDeps = { console: consoleStub };
    const client =
      mode === 'prod'
        ? createTelemetryClient('prod', {
            ...baseDeps,
            fetch: vi.fn(),
            endpoint: 'https://example.test/telemetry'
          } as any)
        : createTelemetryClient(mode, baseDeps);
    expect(client.mode).toBe(mode);
  });

  it('noop mode validates payload without side effects', async () => {
    const consoleStub = createConsoleStub();
    const fetchStub = vi.fn();
    const client = createTelemetryClient('noop', { console: consoleStub, fetch: fetchStub });

    await client.emit(envelope, payload);

    expect(consoleStub.debug).not.toHaveBeenCalled();
    expect(consoleStub.info).not.toHaveBeenCalled();
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('dev mode logs event payload to console', async () => {
    const consoleStub = createConsoleStub();
    const fetchStub = vi.fn();
    const client = createTelemetryClient('dev', { console: consoleStub, fetch: fetchStub });

    await client.emit(envelope, payload);

    expect(consoleStub.debug).toHaveBeenCalledTimes(1);
    const [prefix, pretty] = consoleStub.debug.mock.calls[0];
    expect(prefix).toBe('[telemetry][dev]');
    expect(pretty).toContain('"type": "sdk.blockHydrated"');
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('throws when prod mode is missing fetch implementation', () => {
    const consoleStub = createConsoleStub();
    const originalFetch = globalThis.fetch;
    // @ts-expect-error - simulate missing fetch implementation
    globalThis.fetch = undefined;
    try {
      expect(() => createTelemetryClient('prod', { console: consoleStub, endpoint: 'https://example.test/ingest' })).toThrow(
        'Telemetry fetch implementation is required when TELEMETRY_MODE=prod.'
      );
    } finally {
      if (originalFetch) {
        globalThis.fetch = originalFetch;
      } else {
        Reflect.deleteProperty(globalThis, 'fetch');
      }
    }
  });

  it('throws when prod mode is missing endpoint', () => {
    const consoleStub = createConsoleStub();
    const fetchStub = vi.fn();
    expect(() => createTelemetryClient('prod', { console: consoleStub, fetch: fetchStub as any })).toThrow(
      'Telemetry endpoint (TELEMETRY_ENDPOINT) is required when TELEMETRY_MODE=prod.'
    );
  });

  it('prod mode posts payload to configured endpoint', async () => {
    const consoleStub = createConsoleStub();
    const fetchStub = vi.fn().mockResolvedValue({ ok: true });
    const client = createTelemetryClient('prod', {
      console: consoleStub,
      fetch: fetchStub as any,
      endpoint: 'https://example.test/telemetry'
    });

    await client.emit(envelope, payload);

    expect(fetchStub).toHaveBeenCalledWith(
      'https://example.test/telemetry',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' }
      })
    );
    expect(consoleStub.info).toHaveBeenCalledWith('[telemetry][prod] event dispatched');
  });
});
