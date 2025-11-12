export type AnalyticsEnvelope = {
  tenantId: string;
  sessionId: string;
  ts: number;
  route: string;
  routeName?: string;
  previousUrl?: string;
  section?: string;
  planHash?: string;
  device?: string;
  referrer?: string;
  embedId?: string;
  version?: string;
};

type BaseSdkEvent = {
  routeName?: string;
  previousUrl?: string;
  embedId?: string;
  tenantId?: string;
  version?: string;
};

export type SdkEvent =
  | (BaseSdkEvent & { type: 'sdk.blockHydrated'; blockId: string; firstPaintMs: number; items: number })
  | (BaseSdkEvent & { type: 'sdk.blockDepleted'; blockId: string; totalItems: number })
  | (BaseSdkEvent & { type: 'sdk.sectionChanged'; section: string })
  | (BaseSdkEvent & { type: 'filters_reset'; active: string[] })
  | (BaseSdkEvent & { type: 'card_impression'; canonicalId: string; blockId: string; position: number; visiblePct: number })
  | (BaseSdkEvent & { type: 'card_click'; canonicalId: string; blockId: string; position: number })
  | (BaseSdkEvent & { type: 'ticket_outbound_click'; canonicalId: string; blockId: string; href: string })
  | (BaseSdkEvent & { type: 'promo_impression'; promoId: string; blockId: string; visiblePct: number })
  | (BaseSdkEvent & { type: 'promo_click'; promoId: string; blockId: string })
  | (BaseSdkEvent & { type: 'chat_open'; context: 'global' | 'event' })
  | (BaseSdkEvent & { type: 'chat_submit'; context: 'global' | 'event' })
  | (BaseSdkEvent & { type: 'chat_latency_ms'; p50: number; p95: number })
  | (BaseSdkEvent & { type: 'ai_fallback_triggered'; reason: 'timeout' | 'policy' })
  | (BaseSdkEvent & { type: 'sdk.deprecation'; from: string; to: string });

export type TelemetryEvent = {
  envelope: AnalyticsEnvelope;
  payload: SdkEvent;
};

export function formatTelemetryEvent(envelope: AnalyticsEnvelope, payload: SdkEvent): TelemetryEvent {
  return { envelope, payload };
}
