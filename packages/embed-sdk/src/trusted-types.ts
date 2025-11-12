import { HUB_TRUSTED_TYPES_POLICY, sanitizeHtml, tryCreateTrustedTypesPolicy, type TrustedTypesInitResult } from '@events-hub/security';

type LoggerLike = Pick<Console, 'info' | 'warn' | 'error'>;

export type TrustedTypesState = TrustedTypesInitResult & {
  timestamp: number;
};

const defaultLogger: LoggerLike = console;

export function initializeTrustedTypes(logger: LoggerLike = defaultLogger): TrustedTypesState {
  if (typeof window === 'undefined') {
    return { policy: null, supported: false, enforced: false, timestamp: Date.now() };
  }
  const factory = 'trustedTypes' in window ? (window as typeof window & { trustedTypes?: unknown }).trustedTypes : undefined;
  const result = tryCreateTrustedTypesPolicy(factory as Parameters<typeof tryCreateTrustedTypesPolicy>[0], HUB_TRUSTED_TYPES_POLICY);
  if (!result.supported) {
    logger.info('[hub-embed] Trusted Types not supported in this environment.');
  } else if (result.enforced && !result.policy) {
    logger.error('[hub-embed] Trusted Types enforcement detected but policy creation failed.', {
      reason: result.error?.message
    });
  }
  return { ...result, timestamp: Date.now() };
}

export function sanitizeWithTrustedTypes(input: string, state: TrustedTypesState): string | TrustedHTML {
  const sanitized = sanitizeHtml(input);
  if (state.policy?.createHTML) {
    return state.policy.createHTML(sanitized);
  }
  return sanitized;
}

export function shouldAbortForTrustedTypes(state: TrustedTypesState): boolean {
  return state.enforced && !state.policy;
}
