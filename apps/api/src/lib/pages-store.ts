import { kv } from '@vercel/kv';
import { CACHE_PAGES_STORE_EVENTS, emitTelemetry, type TelemetryLogLevel } from '@events-hub/telemetry';

type KvClient = {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: (key: string, value: string) => Promise<unknown>;
};

const kvClient = kv as unknown as KvClient;

type PagesStore = {
  __defaultPagePointers?: Map<string, DefaultPagePointer>;
};

type DefaultPagePointer = {
  planHash: string;
  updatedAt: string;
};

function pointerKey(tenantId: string) {
  return `pages:default:${tenantId}`;
}

function kvAvailable() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function logPointerEvent(
  eventKey: keyof typeof CACHE_PAGES_STORE_EVENTS,
  tenantId: string,
  extra: Record<string, unknown> = {},
  level: TelemetryLogLevel = 'debug'
) {
  const store = kvAvailable() ? 'kv' : 'memory';
  emitTelemetry(CACHE_PAGES_STORE_EVENTS[eventKey], { tenantId, store, ...extra }, level);
}

function logFallback(tenantId: string, action: 'get' | 'set') {
  if (kvAvailable()) return;
  emitTelemetry(CACHE_PAGES_STORE_EVENTS.pointerFallback, { tenantId, store: 'memory', action }, 'debug');
}

function getMemoryStore(): Map<string, DefaultPagePointer> {
  const globalStore = globalThis as typeof globalThis & PagesStore;
  if (!globalStore.__defaultPagePointers) {
    globalStore.__defaultPagePointers = new Map();
  }
  return globalStore.__defaultPagePointers;
}

export async function getDefaultPagePointer(tenantId: string): Promise<DefaultPagePointer | null> {
  const key = pointerKey(tenantId);
  const usingKv = kvAvailable();
  if (usingKv) {
    const stored = await kvClient.get<string>(key);
    if (!stored) {
      logPointerEvent('pointerGet', tenantId, { hit: false });
      return null;
    }
    try {
      const parsed = JSON.parse(stored) as DefaultPagePointer;
      logPointerEvent('pointerGet', tenantId, { hit: true });
      return parsed;
    } catch (error) {
      logPointerEvent('pointerInvalid', tenantId, { error: (error as Error).message ?? 'invalid pointer payload' }, 'warn');
      return null;
    }
  }
  logFallback(tenantId, 'get');
  const memory = getMemoryStore();
  const pointer = memory.get(key) ?? null;
  logPointerEvent('pointerGet', tenantId, { hit: Boolean(pointer) });
  return pointer;
}

export async function setDefaultPagePointer(tenantId: string, pointer: DefaultPagePointer): Promise<DefaultPagePointer> {
  const key = pointerKey(tenantId);
  const usingKv = kvAvailable();
  if (usingKv) {
    await kvClient.set(key, JSON.stringify(pointer));
  } else {
    logFallback(tenantId, 'set');
    const memory = getMemoryStore();
    memory.set(key, pointer);
  }
  logPointerEvent('pointerSet', tenantId, { planHash: pointer.planHash });
  return pointer;
}

export async function getDefaultPageHash(tenantId: string): Promise<string | null> {
  const pointer = await getDefaultPagePointer(tenantId);
  return pointer?.planHash ?? null;
}

export async function setDefaultPageHash(tenantId: string, planHash: string, updatedAt = new Date().toISOString()): Promise<DefaultPagePointer> {
  const pointer: DefaultPagePointer = { planHash, updatedAt };
  return setDefaultPagePointer(tenantId, pointer);
}

export type { DefaultPagePointer };
