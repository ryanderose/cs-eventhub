import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PageDocSchema, type PageDoc } from '@events-hub/page-schema';
import { buildDefaultStaticPlan } from '@events-hub/ai-composer';
import { ADMIN_DEFAULT_PLAN_SPANS, recordAdminDefaultPlan } from '@events-hub/telemetry';
import { persistDefaultPlan, resolveDefaultPlan } from '../../../src/lib/plan';
import { getDefaultPagePointer } from '../../../src/lib/pages-store';
import { startSpan } from '../../../src/lib/telemetry';

export const config = { runtime: 'nodejs' };

const DEFAULT_TENANT = 'demo';
const DEFAULT_PLAN_ROUTE = '/v1/plan/default';
const API_SESSION_ID = 'api.default-plan';

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
      const span = startSpan(ADMIN_DEFAULT_PLAN_SPANS.fetch);
      span.setAttribute('tenantId', tenantId);
      try {
        const resolved = await resolveDefaultPlan(tenantId);
        if (resolved) {
          span.setAttribute('planHash', resolved.planHash);
          span.setAttribute('default_plan.result', 'hit');
          logPlanEvent({
            type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
            status: 'success',
            source: 'api',
            envelope: createEnvelope(tenantId, resolved.planHash)
          });
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
        span.setAttribute('planHash', persisted.planHash);
        span.setAttribute('default_plan.result', 'seeded');
        logPlanEvent({
          type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
          status: 'success',
          source: 'api',
          message: 'Seeded fallback default plan',
          envelope: createEnvelope(tenantId, persisted.planHash)
        });
        respond(res, 200, {
          plan: persisted.canonical,
          encodedPlan: persisted.encoded,
          planHash: persisted.planHash,
          updatedAt: persisted.updatedAt
        });
        return;
      } catch (error) {
        span.setAttribute('default_plan.error', (error as Error).message ?? 'unknown');
        logPlanEvent({
          type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
          status: 'error',
          source: 'api',
          message: (error as Error).message,
          envelope: createEnvelope(tenantId)
        });
        throw error;
      } finally {
        span.end();
      }
    }

    if (req.method === 'PUT') {
      const span = startSpan(ADMIN_DEFAULT_PLAN_SPANS.save);
      span.setAttribute('tenantId', tenantId);
      const ifMatchHeader = req.headers['if-match'];
      const ifMatch = Array.isArray(ifMatchHeader) ? ifMatchHeader[0] : ifMatchHeader;
      try {
        const pointer = await getDefaultPagePointer(tenantId);
        if (pointer && ifMatch && ifMatch !== pointer.planHash && ifMatch !== '*') {
          span.setAttribute('default_plan.result', 'conflict');
          span.setAttribute('planHash', pointer.planHash);
          logPlanEvent({
            type: ADMIN_DEFAULT_PLAN_SPANS.save,
            status: 'conflict',
            message: 'If-Match plan hash mismatch',
            envelope: createEnvelope(tenantId, pointer.planHash)
          });
          respond(res, 412, { error: 'Plan hash mismatch', planHash: pointer.planHash });
          return;
        }

        const body = parseBody(req);
        if (!body || typeof body !== 'object' || !('plan' in (body as Record<string, unknown>))) {
          span.setAttribute('default_plan.result', 'invalid');
          logPlanEvent({
            type: ADMIN_DEFAULT_PLAN_SPANS.save,
            status: 'invalid',
            message: 'Invalid payload',
            envelope: createEnvelope(tenantId)
          });
          respond(res, 400, { error: 'Invalid payload' });
          return;
        }

        const incomingPlan = (body as { plan: unknown }).plan;
        let parsedPlan: PageDoc;
        try {
          parsedPlan = PageDocSchema.parse(incomingPlan);
        } catch (error) {
          span.setAttribute('default_plan.result', 'invalid');
          logPlanEvent({
            type: ADMIN_DEFAULT_PLAN_SPANS.save,
            status: 'invalid',
            message: (error as Error).message,
            envelope: createEnvelope(tenantId)
          });
          respond(res, 400, { error: 'Plan validation failed', message: (error as Error).message });
          return;
        }

        if (parsedPlan.tenantId !== tenantId) {
          span.setAttribute('default_plan.result', 'invalid');
          logPlanEvent({
            type: ADMIN_DEFAULT_PLAN_SPANS.save,
            status: 'invalid',
            message: 'Tenant mismatch',
            envelope: createEnvelope(tenantId, parsedPlan.meta?.planHash)
          });
          respond(res, 400, { error: 'Tenant mismatch' });
          return;
        }

        const persisted = await persistDefaultPlan(parsedPlan, tenantId);
        span.setAttribute('default_plan.result', 'saved');
        span.setAttribute('planHash', persisted.planHash);
        logPlanEvent({
          type: ADMIN_DEFAULT_PLAN_SPANS.save,
          status: 'success',
          envelope: createEnvelope(tenantId, persisted.planHash)
        });
        respond(res, 200, {
          plan: persisted.canonical,
          encodedPlan: persisted.encoded,
          planHash: persisted.planHash,
          updatedAt: persisted.updatedAt
        });
        return;
      } catch (error) {
        span.setAttribute('default_plan.error', (error as Error).message ?? 'unknown');
        logPlanEvent({
          type: ADMIN_DEFAULT_PLAN_SPANS.save,
          status: 'error',
          message: (error as Error).message,
          source: 'api',
          envelope: createEnvelope(tenantId)
        });
        throw error;
      } finally {
        span.end();
      }
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
function createEnvelope(tenantId: string, planHash?: string) {
  return {
    tenantId,
    planHash,
    route: DEFAULT_PLAN_ROUTE,
    sessionId: API_SESSION_ID,
    ts: Date.now()
  };
}

function logPlanEvent(event: Parameters<typeof recordAdminDefaultPlan>[0]) {
  recordAdminDefaultPlan(event);
}
