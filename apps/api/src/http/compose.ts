import type { ComposeResult } from '@events-hub/ai-composer';
import { compose as runComposer } from '@events-hub/ai-composer';
import { startSpan } from '../lib/telemetry';
import {
  buildCacheKey,
  encodeCanonicalPlan,
  persistEncodedPlan,
  shouldInlinePlan
} from '../lib/plan';
import type { ApiRequest, ApiResponse } from './types';

export type ComposePayload = {
  tenantId?: string;
  intent?: 'search' | 'qa' | 'navigate';
  filters?: Record<string, unknown>;
  planHash?: string;
  locale?: string;
  streaming?: boolean;
  composerVersion?: string;
};

type ComposeResponseBody = ComposeResult & {
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

function isFetchRequest(value: unknown): value is Request {
  return typeof Request !== 'undefined' && value instanceof Request;
}

async function readJsonBody(req: ApiRequest | Request): Promise<ComposePayload> {
  if (isFetchRequest(req)) {
    try {
      return (await req.json()) as ComposePayload;
    } catch {
      return {} as ComposePayload;
    }
  }

  const body = (req as any).body;
  if (!body) {
    return {} as ComposePayload;
  }
  if (typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body as ComposePayload;
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf-8')) as ComposePayload;
    } catch {
      return {} as ComposePayload;
    }
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as ComposePayload;
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

function sendNodeJson(res: ApiResponse, status: number, body: unknown, headers: Record<string, string>) {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.status(status).json(body);
}

function sendEdgeJson(status: number, body: unknown, headers: Record<string, string>) {
  const responseHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });
  if (!responseHeaders.has('content-type')) {
    responseHeaders.set('content-type', 'application/json; charset=utf-8');
  }
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

export async function handleCompose(
  req: ApiRequest | Request,
  res?: ApiResponse
): Promise<void | Response> {
  const method = isFetchRequest(req) ? req.method : (req as ApiRequest).method ?? 'GET';
  const respond = res
    ? (status: number, body: unknown, headers: Record<string, string>) => {
        sendNodeJson(res, status, body, headers);
        return undefined;
      }
    : (status: number, body: unknown, headers: Record<string, string>) =>
        sendEdgeJson(status, body, headers);

  if (method.toUpperCase() !== 'POST') {
    return respond(
      405,
      { error: 'Method Not Allowed' },
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    );
  }

  const payload = await readJsonBody(req);
  const cacheKeyCandidate = buildCacheKey(payload.planHash, payload.composerVersion);
  const cached = readCachedResponse(cacheKeyCandidate);
  if (cached) {
    return respond(
      cached.status,
      cached.body,
      {
        ...cached.headers,
        'X-Cache': 'HIT'
      }
    );
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
    return respond(200, body, headers);
  } catch (error) {
    span.setAttribute('composer.error', String(error));
    return respond(
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
