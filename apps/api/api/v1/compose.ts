import { compose as runComposer } from '@events-hub/ai-composer';
import { startSpan } from '../../src/lib/telemetry';
import {
  buildCacheKey,
  encodeCanonicalPlan,
  persistEncodedPlan,
  shouldInlinePlan
} from '../../src/lib/plan';

export const config = { runtime: 'edge', maxDuration: 15 };

type ComposePayload = {
  tenantId?: string;
  intent?: 'search' | 'qa' | 'navigate';
  filters?: Record<string, unknown>;
  planHash?: string;
  locale?: string;
  streaming?: boolean;
  composerVersion?: string;
};

function readJsonBody(request: Request): Promise<ComposePayload> {
  return request
    .json()
    .catch(() => ({}) as ComposePayload);
}

function buildJsonResponse(body: unknown, cacheKey: string | null) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8'
  });
  if (cacheKey) {
    headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    headers.set('X-Composer-Cache-Key', cacheKey);
  } else {
    headers.set('Cache-Control', 'no-store');
  }
  return new Response(JSON.stringify(body), { status: 200, headers });
}

async function matchEdgeCache(cacheKey: string | null) {
  if (!cacheKey || typeof caches === 'undefined') {
    return null;
  }
  try {
    return await caches.default.match(cacheKey);
  } catch {
    return null;
  }
}

async function writeEdgeCache(cacheKey: string | null, response: Response) {
  if (!cacheKey || typeof caches === 'undefined') {
    return;
  }
  try {
    await caches.default.put(cacheKey, response.clone());
  } catch {
    // ignore cache write failures
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const payload = await readJsonBody(request);
  const cacheKeyCandidate = buildCacheKey(payload.planHash, payload.composerVersion);
  const cached = await matchEdgeCache(cacheKeyCandidate);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set('X-Cache', 'HIT');
    return new Response(cached.body, { status: cached.status, headers });
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

    let body: Record<string, unknown> & { encodedPlan?: string; shortId?: string } = {
      ...result,
      encodedPlan: encoded
    };

    if (!shouldInlinePlan(encoded)) {
      const shortId = await persistEncodedPlan(encoded, planHash);
      body = { ...result, encodedPlan: undefined, shortId };
    }

    const response = buildJsonResponse(body, responseCacheKey);
    await writeEdgeCache(responseCacheKey, response);
    return response;
  } catch (error) {
    span.setAttribute('composer.error', String(error));
    return new Response(JSON.stringify({ error: 'compose_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  } finally {
    span.end();
  }
}
