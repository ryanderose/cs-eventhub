import { canonicalizePageDoc, computePlanHash, PageDocSchema, type PageDoc } from '@events-hub/page-schema';
import { decodePlan as decodePlanDoc, encodePlan as encodePlanDoc } from '@events-hub/router-helpers';
import { kv } from '@vercel/kv';
import { getDefaultPagePointer, setDefaultPageHash, type DefaultPagePointer } from './pages-store';

type KvClient = {
  set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown>;
  get: <T = unknown>(key: string) => Promise<T | null>;
};

const kvClient = kv as unknown as KvClient;

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
    await kvClient.set(key, encoded, { ex: TTL_SECONDS });
  } else {
    const cache = getMemoryCache();
    cache.set(key, { encoded, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }
  return planHash;
}

async function persistEncodedPlanPermanent(encoded: string, planHash: string) {
  const key = planKey(planHash);
  if (kvAvailable()) {
    await kvClient.set(key, encoded);
  } else {
    const cache = getMemoryCache();
    cache.set(key, { encoded, expiresAt: Number.POSITIVE_INFINITY });
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

type PersistedDefaultPlan = {
  canonical: PageDoc;
  encoded: string;
  planHash: string;
  updatedAt: string;
};

export async function persistDefaultPlan(plan: PageDoc, tenantId: string): Promise<PersistedDefaultPlan> {
  const timestamp = new Date().toISOString();
  const parsed = PageDocSchema.parse({ ...plan, updatedAt: timestamp });
  const canonical = canonicalizePageDoc(parsed);
  const planHash = computePlanHash(canonical);
  const hashedCanonical = { ...canonical, meta: { ...canonical.meta, planHash } };
  const encoded = encodePlanDoc(hashedCanonical);
  await persistEncodedPlanPermanent(encoded, planHash);
  const pointer = await setDefaultPageHash(tenantId, planHash, timestamp);
  return { canonical: hashedCanonical, encoded, planHash, updatedAt: pointer.updatedAt };
}

type ResolvedDefaultPlan = {
  plan: PageDoc;
  encodedPlan: string;
  planHash: string;
  updatedAt: string;
  pointer: DefaultPagePointer;
};

export async function resolveDefaultPlan(tenantId: string): Promise<ResolvedDefaultPlan | null> {
  const pointer = await getDefaultPagePointer(tenantId);
  if (!pointer) {
    return null;
  }
  const encoded = await resolveEncodedPlan(pointer.planHash);
  if (!encoded) {
    return null;
  }
  const decoded = decodePlanDoc(encoded);
  const plan = PageDocSchema.parse(decoded);
  return { plan, encodedPlan: encoded, planHash: pointer.planHash, updatedAt: pointer.updatedAt, pointer };
}
