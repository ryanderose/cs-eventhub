import type { VercelRequest, VercelResponse } from '@vercel/node';
import { compose as runComposer } from '@events-hub/ai-composer';
import { startSpan } from '../../src/lib/telemetry';
import {
  buildCacheKey,
  encodeCanonicalPlan,
  persistEncodedPlan,
  shouldInlinePlan
} from '../../src/lib/plan';

export const config = { runtime: 'nodejs', maxDuration: 15 };

type ComposePayload = {
  tenantId?: string;
  intent?: 'search' | 'qa' | 'navigate';
  filters?: Record<string, unknown>;
  planHash?: string;
  locale?: string;
  streaming?: boolean;
  composerVersion?: string;
};

type ComposeResponseBody = Record<string, unknown> & {
  encodedPlan?: string;
  shortId?: string;
};

type CachedComposeEntry = {
  body: ComposeResponseBody;
  headers: Record<string, string>;
  status: number;
  expiresAt: number;
};

type ComposeCacheStore = {
  __composeCache?: Map<string, CachedComposeEntry>;
};

const CACHE_TTL_MS = 300_000;

function getComposeCache(): Map<string, CachedComposeEntry> {
  const globalStore = globalThis as typeof globalThis & ComposeCacheStore;
  if (!globalStore.__composeCache) {
    globalStore.__composeCache = new Map();
  }
  return globalStore.__composeCache;
}

function readJsonBody(req: VercelRequest): ComposePayload {
  if (!req.body) {
    return {} as ComposePayload;
  }
  if (typeof req.body === 'object') {
    return req.body as ComposePayload;
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf-8')) as ComposePayload;
    } catch {
      return {} as ComposePayload;
    }
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as ComposePayload;
    } catch {
      return {} as ComposePayload;
    }
  }
  return {} as ComposePayload;
}

function readCachedResponse(cacheKey: string | null): CachedComposeEntry | null {
  if (!cacheKey) return null;
  const cache = getComposeCache();
  const entry = cache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(cacheKey);
    return null;
  }
  return entry;
}

function writeCachedResponse(
  cacheKey: string | null,
  body: ComposeResponseBody,
  headers: Record<string, string>,
  status: number
) {
  if (!cacheKey) return;
  const cache = getComposeCache();
  cache.set(cacheKey, {
    body,
    headers,
    status,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

function sendJson(
  res: VercelResponse,
  status: number,
  body: unknown,
  headers: Record<string, string>
) {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const payload = readJsonBody(req);
  const cacheKeyCandidate = buildCacheKey(payload.planHash, payload.composerVersion);
  const cached = readCachedResponse(cacheKeyCandidate);
  if (cached) {
    sendJson(res, cached.status, cached.body, {
      ...cached.headers,
      'X-Cache': 'HIT'
    });
    return;
  }

  const span = startSpan('composer.call');
  try {
    const result = await runComposer({
      tenantId: payload.tenantId ?? 'demo',
      intent: payload.intent ?? 'search',
      filters: (payload.filters as any) ?? {},
      planHash: payload.planHash,
      locale: payload.locale ?? 'en-US',
      streaming: payload.streaming ?? false
    });

    const { encoded, planHash } = encodeCanonicalPlan(result.page);
    const responseCacheKey = buildCacheKey(planHash, result.composerVersion);
    span.setAttribute('plan.hash', planHash);
    span.setAttribute('composer.version', result.composerVersion);

    let body: ComposeResponseBody = {
      ...result,
      encodedPlan: encoded
    };

    if (!shouldInlinePlan(encoded)) {
      const shortId = await persistEncodedPlan(encoded, planHash);
      body = { ...result, encodedPlan: undefined, shortId };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': responseCacheKey
        ? 's-maxage=300, stale-while-revalidate=60'
        : 'no-store'
    };

    if (responseCacheKey) {
      headers['X-Composer-Cache-Key'] = responseCacheKey;
    }

    writeCachedResponse(responseCacheKey, body, headers, 200);
    sendJson(res, 200, body, headers);
  } catch (error) {
    span.setAttribute('composer.error', String(error));
    sendJson(
      res,
      500,
      { error: 'compose_failed' },
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    );
  } finally {
    span.end();
  }
}
