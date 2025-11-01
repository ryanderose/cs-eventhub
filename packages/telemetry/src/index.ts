export type AnalyticsEnvelope = {
  tenantId: string;
  sessionId: string;
  ts: number;
  route: string;
  section?: string;
  planHash?: string;
  device?: string;
  referrer?: string;
};

export type SdkEvent =
  | { type: 'sdk.blockHydrated'; blockId: string; firstPaintMs: number; items: number }
  | { type: 'sdk.blockDepleted'; blockId: string; totalItems: number }
  | { type: 'sdk.sectionChanged'; section: string }
  | { type: 'card_impression'; canonicalId: string; blockId: string; position: number; visiblePct: number }
  | { type: 'card_click'; canonicalId: string; blockId: string; position: number }
  | { type: 'ticket_outbound_click'; canonicalId: string; blockId: string; href: string }
  | { type: 'promo_impression'; promoId: string; blockId: string; visiblePct: number }
  | { type: 'promo_click'; promoId: string; blockId: string }
  | { type: 'chat_open'; context: 'global' | 'event' }
  | { type: 'chat_submit'; context: 'global' | 'event' }
  | { type: 'chat_latency_ms'; p50: number; p95: number }
  | { type: 'ai_fallback_triggered'; reason: 'timeout' | 'policy' };

export type TelemetryEvent = {
  envelope: AnalyticsEnvelope;
  payload: SdkEvent;
};

export function formatTelemetryEvent(envelope: AnalyticsEnvelope, payload: SdkEvent): TelemetryEvent {
  return { envelope, payload };
}

export const ADMIN_DEFAULT_PLAN_SPANS = {
  fetch: 'analytics.admin.default_plan.fetch',
  save: 'analytics.admin.default_plan.save'
} as const;

export const CACHE_PAGES_STORE_EVENTS = {
  pointerGet: 'cache.pages_store.get_pointer',
  pointerSet: 'cache.pages_store.set_pointer',
  pointerInvalid: 'cache.pages_store.invalid_pointer',
  pointerFallback: 'cache.pages_store.memory_fallback'
} as const;

export type TelemetryLogLevel = 'info' | 'warn' | 'error' | 'debug';

function shouldEmitDebug() {
  return Boolean(process.env.DEBUG?.includes('telemetry'));
}

function pickLogger(level: TelemetryLogLevel): ((message?: unknown, ...optionalParams: unknown[]) => void) {
  switch (level) {
    case 'warn':
      return console.warn.bind(console);
    case 'error':
      return console.error.bind(console);
    case 'debug':
      return console.debug.bind(console);
    case 'info':
    default:
      return console.info.bind(console);
  }
}

export function emitTelemetry(name: string, details: Record<string, unknown>, level: TelemetryLogLevel = 'info'): void {
  if (process.env.NODE_ENV === 'test') return;
  if (level === 'debug' && !shouldEmitDebug()) return;
  const logger = pickLogger(level);
  logger(`[telemetry] ${name}`, details);
}

type AdminDefaultPlanEnvelope = Pick<AnalyticsEnvelope, 'tenantId' | 'planHash'> &
  Partial<Omit<AnalyticsEnvelope, 'tenantId' | 'planHash'>>;

export type AdminDefaultPlanEvent = {
  type: (typeof ADMIN_DEFAULT_PLAN_SPANS)[keyof typeof ADMIN_DEFAULT_PLAN_SPANS];
  status: 'success' | 'error' | 'conflict' | 'invalid';
  envelope: AdminDefaultPlanEnvelope;
  source?: string;
  message?: string;
  level?: TelemetryLogLevel;
};

function resolveLevel(event: AdminDefaultPlanEvent): TelemetryLogLevel {
  if (event.level) {
    return event.level;
  }
  if (event.status === 'success') return 'info';
  if (event.status === 'conflict' || event.status === 'invalid') return 'warn';
  return 'error';
}

export function recordAdminDefaultPlan(event: AdminDefaultPlanEvent): void {
  const level = resolveLevel(event);
  const timestamp = event.envelope.ts ?? Date.now();
  const details: Record<string, unknown> = {
    status: event.status,
    tenantId: event.envelope.tenantId,
    planHash: event.envelope.planHash,
    source: event.source ?? 'admin',
    ts: timestamp
  };
  if (event.envelope.route) {
    details.route = event.envelope.route;
  }
  if (event.envelope.section) {
    details.section = event.envelope.section;
  }
  if (event.envelope.sessionId) {
    details.sessionId = event.envelope.sessionId;
  }
  if (event.envelope.device) {
    details.device = event.envelope.device;
  }
  if (event.envelope.referrer) {
    details.referrer = event.envelope.referrer;
  }
  if (event.message) {
    details.message = event.message;
  }

  emitTelemetry(event.type, details, level);
}
