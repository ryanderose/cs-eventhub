export type LogCode =
  | 'SRI_MISMATCH'
  | 'CSP_BLOCKED'
  | 'ROUTER_MISCONFIGURED'
  | 'CONSENT_PENDING'
  | 'PLAN_RESOLUTION_FAILED'
  | 'TRUSTED_TYPES_ABORT';

export type LogMetadata = Record<string, unknown>;

export interface HubLogger {
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
  code(level: 'info' | 'warn' | 'error', code: LogCode, message: string, metadata?: LogMetadata): void;
  child(scope: string): HubLogger;
}

const PREFIX = '[hub-embed]';

function formatMessage(scope: string | null, message: string): string {
  return scope ? `${PREFIX}:${scope} ${message}` : `${PREFIX} ${message}`;
}

function emit(level: 'info' | 'warn' | 'error', scope: string | null, message: string, metadata?: LogMetadata) {
  const formatted = formatMessage(scope, message);
  if (metadata) {
    console[level](formatted, metadata);
  } else {
    console[level](formatted);
  }
}

export function createLogger(scope: string | null = null): HubLogger {
  return {
    info(message, metadata) {
      emit('info', scope, message, metadata);
    },
    warn(message, metadata) {
      emit('warn', scope, message, metadata);
    },
    error(message, metadata) {
      emit('error', scope, message, metadata);
    },
    code(level, code, message, metadata) {
      emit(level, scope, `${code} — ${message}`, metadata);
    },
    child(childScope: string) {
      const nextScope = scope ? `${scope}.${childScope}` : childScope;
      return createLogger(nextScope);
    }
  };
}
