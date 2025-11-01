import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PageDocSchema, type PageDoc } from '@events-hub/page-schema';
import { buildDefaultStaticPlan } from '@events-hub/ai-composer';
import { persistDefaultPlan, resolveDefaultPlan } from '../../../src/lib/plan';
import { getDefaultPagePointer } from '../../../src/lib/pages-store';

export const config = { runtime: 'nodejs' };

const DEFAULT_TENANT = 'demo';

function resolveTenantId(req: VercelRequest): string {
  const headerTenant = req.headers['x-tenant-id'];
  if (typeof headerTenant === 'string' && headerTenant.trim()) {
    return headerTenant.trim();
  }
  const queryTenant = Array.isArray(req.query.tenantId) ? req.query.tenantId[0] : req.query.tenantId;
  if (typeof queryTenant === 'string' && queryTenant.trim()) {
    return queryTenant.trim();
  }
  return DEFAULT_TENANT;
}

function parseBody(req: VercelRequest): unknown {
  if (!req.body) return null;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw Object.assign(new Error('Invalid JSON body'), { status: 400, cause: error });
    }
  }
  return req.body;
}

function respond(res: VercelResponse, status: number, payload: unknown) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(payload);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tenantId = resolveTenantId(req);
  try {
    if (req.method === 'GET') {
      const resolved = await resolveDefaultPlan(tenantId);
      if (resolved) {
        respond(res, 200, {
          plan: { ...resolved.plan, meta: { ...resolved.plan.meta, planHash: resolved.planHash } },
          encodedPlan: resolved.encodedPlan,
          planHash: resolved.planHash,
          updatedAt: resolved.updatedAt
        });
        return;
      }
      const fallback = buildDefaultStaticPlan(tenantId);
      const persisted = await persistDefaultPlan(fallback, tenantId);
      respond(res, 200, {
        plan: persisted.canonical,
        encodedPlan: persisted.encoded,
        planHash: persisted.planHash,
        updatedAt: persisted.updatedAt
      });
      return;
    }

    if (req.method === 'PUT') {
      const ifMatchHeader = req.headers['if-match'];
      const ifMatch = Array.isArray(ifMatchHeader) ? ifMatchHeader[0] : ifMatchHeader;
      const pointer = await getDefaultPagePointer(tenantId);
      if (pointer && ifMatch && ifMatch !== pointer.planHash && ifMatch !== '*') {
        respond(res, 412, { error: 'Plan hash mismatch', planHash: pointer.planHash });
        return;
      }

      const body = parseBody(req);
      if (!body || typeof body !== 'object' || !('plan' in (body as Record<string, unknown>))) {
        respond(res, 400, { error: 'Invalid payload' });
        return;
      }

      const incomingPlan = (body as { plan: unknown }).plan;
      let parsedPlan: PageDoc;
      try {
        parsedPlan = PageDocSchema.parse(incomingPlan);
      } catch (error) {
        respond(res, 400, { error: 'Plan validation failed', message: (error as Error).message });
        return;
      }

      if (parsedPlan.tenantId !== tenantId) {
        respond(res, 400, { error: 'Tenant mismatch' });
        return;
      }

      const persisted = await persistDefaultPlan(parsedPlan, tenantId);
      respond(res, 200, {
        plan: persisted.canonical,
        encodedPlan: persisted.encoded,
        planHash: persisted.planHash,
        updatedAt: persisted.updatedAt
      });
      return;
    }

    respond(res, 405, { error: 'Method Not Allowed' });
  } catch (error) {
    console.error('default-plan-handler-error', { tenantId, error });
    if ((error as { status?: number }).status === 400) {
      respond(res, 400, { error: 'Bad Request', message: (error as Error).message });
      return;
    }
    respond(res, 500, { error: 'Internal Server Error' });
  }
}
