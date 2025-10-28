import { canonicalizePageDoc, computePlanHash, type PageDoc } from '@events-hub/page-schema';
import { decodePlan as decodePlanDoc, encodePlan as encodePlanDoc } from '@events-hub/router-helpers';
import { kv } from '@vercel/kv';

type MemoryEntry = { encoded: string; expiresAt: number };

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
  const canonical = canonicalizePageDoc(page);
  const encoded = encodePlanDoc(canonical);
  const planHash = canonical.meta?.planHash ?? computePlanHash(canonical);
  return { canonical, encoded, planHash };
}

export function decodePlan(encoded: string) {
  return decodePlanDoc(encoded);
}

export async function persistEncodedPlan(encoded: string, planHash: string) {
  const key = planKey(planHash);
  if (kvAvailable()) {
    await kv.set(key, encoded, { ex: TTL_SECONDS });
  } else {
    const cache = getMemoryCache();
    cache.set(key, { encoded, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }
  return planHash;
}

export async function resolveEncodedPlan(planHash: string) {
  const key = planKey(planHash);
  if (kvAvailable()) {
    const encoded = await kv.get<string>(key);
    return encoded ?? null;
  }
  const cache = getMemoryCache();
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
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
