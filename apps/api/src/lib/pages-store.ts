import { kv } from '@vercel/kv';

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

function getMemoryStore(): Map<string, DefaultPagePointer> {
  const globalStore = globalThis as typeof globalThis & PagesStore;
  if (!globalStore.__defaultPagePointers) {
    globalStore.__defaultPagePointers = new Map();
  }
  return globalStore.__defaultPagePointers;
}

export async function getDefaultPagePointer(tenantId: string): Promise<DefaultPagePointer | null> {
  const key = pointerKey(tenantId);
  if (kvAvailable()) {
    const stored = await kvClient.get<string>(key);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as DefaultPagePointer;
    } catch (error) {
      console.warn('pages-store:invalid-pointer', { tenantId, error });
      return null;
    }
  }
  const memory = getMemoryStore();
  return memory.get(key) ?? null;
}

export async function setDefaultPagePointer(tenantId: string, pointer: DefaultPagePointer): Promise<DefaultPagePointer> {
  const key = pointerKey(tenantId);
  if (kvAvailable()) {
    await kvClient.set(key, JSON.stringify(pointer));
  } else {
    const memory = getMemoryStore();
    memory.set(key, pointer);
  }
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
