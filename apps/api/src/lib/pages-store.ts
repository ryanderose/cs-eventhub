import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { kv } from '@vercel/kv';
import { type PageDoc, withPlanHash } from '@events-hub/page-schema';
import { decodePlan, encodeCanonicalPlan, persistEncodedPlan, resolveEncodedPlan } from './plan';

type KvClient = {
  set: (key: string, value: string) => Promise<unknown>;
  get: <T = unknown>(key: string) => Promise<T | null>;
};

const kvClient = kv as unknown as KvClient;

type DefaultPagePointer = {
  planHash: string;
  updatedAt: string;
};

type DefaultPageRecord = DefaultPagePointer & {
  plan: PageDoc;
  encodedPlan: string;
};

type PointerMemoryStore = {
  __defaultPagePointers?: Map<string, DefaultPagePointer>;
};

function getPointerCache(): Map<string, DefaultPagePointer> {
  const globalStore = globalThis as typeof globalThis & PointerMemoryStore;
  if (!globalStore.__defaultPagePointers) {
    globalStore.__defaultPagePointers = new Map();
  }
  return globalStore.__defaultPagePointers;
}

function kvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function getDefaultPageStorageMode(): 'kv' | 'memory' {
  return kvAvailable() ? 'kv' : 'memory';
}

function pointerKey(tenantId: string): string {
  return `pages:default:${tenantId}`;
}

export async function getDefaultPageHash(tenantId: string): Promise<DefaultPagePointer | null> {
  const key = pointerKey(tenantId);
  if (kvAvailable()) {
    const raw = await kvClient.get<string>(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DefaultPagePointer;
    } catch {
      return null;
    }
  }
  const cache = getPointerCache();
  return cache.get(key) ?? null;
}

export async function setDefaultPageHash(tenantId: string, pointer: DefaultPagePointer) {
  const key = pointerKey(tenantId);
  const payload = JSON.stringify(pointer);
  if (kvAvailable()) {
    await kvClient.set(key, payload);
  }
  const cache = getPointerCache();
  cache.set(key, pointer);
}

export async function readDefaultPage(tenantId: string): Promise<DefaultPageRecord | null> {
  const pointer = await getDefaultPageHash(tenantId);
  if (!pointer) {
    return null;
  }
  const encoded = await resolveEncodedPlan(pointer.planHash);
  if (!encoded) {
    return null;
  }
  const plan = decodePlan(encoded) as PageDoc;
  const normalized = plan.meta?.planHash ? plan : withPlanHash(plan);
  return {
    plan: normalized,
    encodedPlan: encoded,
    planHash: normalized.meta.planHash!,
    updatedAt: pointer.updatedAt
  };
}

export async function writeDefaultPage(plan: PageDoc): Promise<DefaultPageRecord> {
  const { canonical, encoded, planHash } = encodeCanonicalPlan({
    ...plan,
    updatedAt: plan.updatedAt ?? new Date().toISOString()
  });
  await persistEncodedPlan(encoded, planHash, { ttlSeconds: null });
  await setDefaultPageHash(canonical.tenantId, {
    planHash,
    updatedAt: canonical.updatedAt
  });
  return {
    plan: canonical,
    encodedPlan: encoded,
    planHash,
    updatedAt: canonical.updatedAt
  };
}

export function loadSeedPlan(tenantId: string): PageDoc {
  return createDefaultDemoPlan({ tenantId });
}

export function __resetDefaultPageStoreForTests() {
  getPointerCache().clear();
}
