import { canonicalizePageDoc, withPlanHash, type PageDoc } from '@events-hub/page-schema';
import { decodePlan as decodePlanDoc, encodePlan as encodePlanDoc } from '@events-hub/router-helpers';
import { kv } from '@vercel/kv';

type KvClient = {
  set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown>;
  get: <T = unknown>(key: string) => Promise<T | null>;
};

const kvClient = kv as unknown as KvClient;

type MemoryEntry = { encoded: string; expiresAt: number | null };

type GlobalPlanCache = {
  __planCache?: Map<string, MemoryEntry>;
};

const INLINE_PLAN_LIMIT = Number(process.env.PLAN_INLINE_LIMIT ?? '2000');
const TTL_SECONDS = Number(process.env.PLAN_CACHE_TTL_SECONDS ?? '3600');

function getMemoryCache(): Map<string, MemoryEntry> {
  const globalStore = globalThis as typeof globalThis & GlobalPlanCache;
  if (!globalStore.__planCache) {
    globalStore.__planCache = new Map();
  }
  return globalStore.__planCache;
}

function planKey(planHash: string): string {
  return `plan:${planHash}`;
}

function kvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function encodeCanonicalPlan(page: PageDoc) {
  const canonical = withPlanHash(canonicalizePageDoc(page));
  const encoded = encodePlanDoc(canonical);
  const planHash = canonical.meta.planHash!;
  return { canonical, encoded, planHash };
}

export function decodePlan(encoded: string) {
  return decodePlanDoc(encoded);
}

type PersistOptions = {
  ttlSeconds?: number | null;
};

export async function persistEncodedPlan(
  encoded: string,
  planHash: string,
  options?: PersistOptions
) {
  const key = planKey(planHash);
  const ttlSeconds = options?.ttlSeconds ?? TTL_SECONDS;
  if (kvAvailable()) {
    if (ttlSeconds == null) {
      await kvClient.set(key, encoded);
    } else {
      await kvClient.set(key, encoded, { ex: ttlSeconds });
    }
  } else {
    const cache = getMemoryCache();
    cache.set(key, {
      encoded,
      expiresAt: ttlSeconds == null ? null : Date.now() + ttlSeconds * 1000
    });
  }
  return planHash;
}

export async function resolveEncodedPlan(planHash: string) {
  const key = planKey(planHash);
  if (kvAvailable()) {
    const encoded = await kvClient.get<string>(key);
    return encoded ?? null;
  }
  const cache = getMemoryCache();
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.encoded;
}

export function shouldInlinePlan(encoded: string): boolean {
  return encoded.length <= INLINE_PLAN_LIMIT;
}

export function buildCacheKey(planHash: string | undefined, composerVersion: string | undefined) {
  if (!planHash || !composerVersion) {
    return null;
  }
  return `compose:${planHash}:${composerVersion}`;
}
