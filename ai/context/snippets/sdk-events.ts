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
