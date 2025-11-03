import { formatTelemetryEvent, type AnalyticsEnvelope, type SdkEvent } from '@events-hub/telemetry';

export type TelemetryMode = 'noop' | 'dev' | 'prod';

const DEFAULT_MODE: TelemetryMode = 'noop';

type ConsoleLike = Pick<Console, 'debug' | 'info' | 'warn'>;
type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<unknown>;

interface Dependencies {
  console: ConsoleLike;
  fetch?: FetchLike;
  endpoint?: string;
}

const VALID_MODES: TelemetryMode[] = ['noop', 'dev', 'prod'];

export function resolveTelemetryMode(env: NodeJS.ProcessEnv = process.env): TelemetryMode {
  const raw = env.TELEMETRY_MODE?.toLowerCase();
  if (!raw) {
    return DEFAULT_MODE;
  }

  if (VALID_MODES.includes(raw as TelemetryMode)) {
    return raw as TelemetryMode;
  }

  const logger = env.NODE_ENV === 'test' ? undefined : console;
  logger?.warn?.(`[telemetry] Unsupported TELEMETRY_MODE "${raw}", falling back to "${DEFAULT_MODE}".`);
  return DEFAULT_MODE;
}

export interface TelemetryClient {
  mode: TelemetryMode;
  emit(envelope: AnalyticsEnvelope, payload: SdkEvent): Promise<void>;
}

function ensureDependencies(mode: TelemetryMode, deps: Dependencies): void {
  if (mode !== 'prod') {
    return;
  }

  if (!deps.fetch) {
    throw new Error('Telemetry fetch implementation is required when TELEMETRY_MODE=prod.');
  }

  if (!deps.endpoint) {
    throw new Error('Telemetry endpoint (TELEMETRY_ENDPOINT) is required when TELEMETRY_MODE=prod.');
  }
}

export function createTelemetryClient(
  mode: TelemetryMode = resolveTelemetryMode(),
  overrides: Partial<Dependencies> = {}
): TelemetryClient {
  const deps: Dependencies = {
    console,
    fetch: typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined,
    endpoint: process.env.TELEMETRY_ENDPOINT,
    ...overrides
  };

  ensureDependencies(mode, deps);

  if (mode === 'noop') {
    return {
      mode,
      async emit(envelope, payload) {
        // Ensure payload shape is validated without emitting network traffic.
        formatTelemetryEvent(envelope, payload);
      }
    };
  }

  if (mode === 'dev') {
    return {
      mode,
      async emit(envelope, payload) {
        const event = formatTelemetryEvent(envelope, payload);
        deps.console.debug?.(
          '[telemetry][dev]',
          JSON.stringify(
            {
              emittedAt: new Date().toISOString(),
              event
            },
            null,
            2
          )
        );
      }
    };
  }

  return {
    mode,
    async emit(envelope, payload) {
      const event = formatTelemetryEvent(envelope, payload);
      await deps.fetch!(deps.endpoint!, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          emittedAt: new Date().toISOString(),
          event
        })
      });
      deps.console.info?.('[telemetry][prod] event dispatched');
    }
  };
}
