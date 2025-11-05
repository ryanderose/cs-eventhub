import { PageDocSchema, type PageDoc } from '@events-hub/page-schema';
import { startSpan } from '../lib/telemetry';
import {
  expectedSeedBlocks,
  getDefaultPageHash,
  loadSeedPlan,
  readDefaultPage,
  writeDefaultPage
} from '../lib/pages-store';
import type { ApiRequest, ApiResponse } from './types';

const DEFAULT_TENANT = 'demo';
const MAX_BLOCKS = expectedSeedBlocks().length;

function resolveTenantId(req: ApiRequest): string {
  const query = (req as any).query ?? {};
  const raw = query.tenantId;
  if (Array.isArray(raw)) {
    return raw[0] ?? DEFAULT_TENANT;
  }
  if (typeof raw === 'string') {
    return raw || DEFAULT_TENANT;
  }
  if (raw != null) {
    return String(raw) || DEFAULT_TENANT;
  }
  return DEFAULT_TENANT;
}

function parseJsonBody(req: ApiRequest): Record<string, unknown> {
  const body = (req as any).body;
  if (!body) return {};
  if (typeof body === 'object' && !Buffer.isBuffer(body)) {
    return body as Record<string, unknown>;
  }
  try {
    if (typeof body === 'string') {
      return JSON.parse(body) as Record<string, unknown>;
    }
    if (Buffer.isBuffer(body)) {
      return JSON.parse(body.toString('utf-8')) as Record<string, unknown>;
    }
  } catch {
    // fall through to empty object
  }
  return {};
}

function ensureContiguousOrders(blocks: Array<{ order: number }>): boolean {
  const expectedOrders = blocks.length;
  const seen = new Set<number>();
  for (const block of blocks) {
    if (!Number.isInteger(block.order) || block.order < 0) {
      return false;
    }
    seen.add(block.order);
  }
  if (seen.size !== expectedOrders) return false;
  for (let i = 0; i < expectedOrders; i += 1) {
    if (!seen.has(i)) return false;
  }
  return true;
}

function setCorsHeaders(res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function respond(res: ApiResponse, status: number, payload: unknown) {
  setCorsHeaders(res);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(payload);
}

function normalisePlanFromRequest(plan: PageDoc, tenantId: string): PageDoc {
  return {
    ...plan,
    tenantId,
    planCursors: plan.planCursors ?? [],
    meta: {
      cacheTags: plan.meta?.cacheTags ?? [],
      flags: plan.meta?.flags ?? {},
      locale: plan.meta?.locale ?? 'en-US',
      composerVersion: plan.meta?.composerVersion,
      generatedAt: plan.meta?.generatedAt,
      planHash: plan.meta?.planHash
    }
  };
}

export async function handleDefaultPlan(req: ApiRequest, res: ApiResponse): Promise<void> {
  const method = req.method ?? 'GET';
  const tenantId = resolveTenantId(req);

  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(204).end();
    return;
  }

  if (method === 'GET') {
    const span = startSpan('defaultPlan.fetch');
    span.setAttribute('tenantId', tenantId);
    try {
      let record = await readDefaultPage(tenantId);
      let seeded = false;
      if (!record) {
        const seed = loadSeedPlan(tenantId);
        record = await writeDefaultPage(seed);
        seeded = true;
      }
      span.setAttribute('seeded', seeded);
      span.setAttribute('plan.hash', record.planHash);
      respond(res, 200, {
        plan: record.plan,
        encodedPlan: record.encodedPlan,
        planHash: record.planHash,
        updatedAt: record.updatedAt
      });
    } catch (error) {
      console.error('[defaultPlan.fetch] failed', error);
      respond(res, 500, { error: 'default_plan_unavailable' });
    } finally {
      span.end();
    }
    return;
  }

  if (method === 'PUT') {
    const body = parseJsonBody(req);
    if (typeof body.plan !== 'object' || !body.plan) {
      respond(res, 400, { error: 'invalid_payload', message: 'Expected { plan } in request body.' });
      return;
    }

    const span = startSpan('defaultPlan.update');
    span.setAttribute('tenantId', tenantId);

    try {
      const parseResult = PageDocSchema.safeParse(body.plan);
      if (!parseResult.success) {
        respond(res, 400, { error: 'validation_failed', message: parseResult.error.message });
        return;
      }
      const incomingPlan = normalisePlanFromRequest(parseResult.data, tenantId);

      if (incomingPlan.blocks.length !== MAX_BLOCKS) {
        respond(res, 400, { error: 'invalid_block_count', message: `Expected ${MAX_BLOCKS} blocks.` });
        return;
      }

      if (!ensureContiguousOrders(incomingPlan.blocks)) {
        respond(res, 400, { error: 'invalid_block_order', message: 'Block order must be contiguous starting at 0.' });
        return;
      }

      const existingRecord = await readDefaultPage(tenantId);
      const pointer = existingRecord
        ? { planHash: existingRecord.planHash }
        : await getDefaultPageHash(tenantId);

      const incomingHash = incomingPlan.meta.planHash;
      if (pointer?.planHash) {
        if (!incomingHash) {
          respond(res, 412, { error: 'plan_conflict', planHash: pointer.planHash });
          return;
        }
        if (pointer.planHash !== incomingHash) {
          respond(res, 412, { error: 'plan_conflict', planHash: pointer.planHash });
          return;
        }
      }

      const baselinePlan = existingRecord?.plan ?? loadSeedPlan(tenantId);
      const baselineBlocks = new Map(baselinePlan.blocks.map((block) => [block.key, block]));
      const expectedKeys = new Set(expectedSeedBlocks().map((block) => block.key));

      const reorderedBlocks = incomingPlan.blocks.map((block) => {
        const template = baselineBlocks.get(block.key);
        if (!template) {
          throw new Error(`Unknown block key: ${block.key}`);
        }
        if (!expectedKeys.has(block.key) || template.id !== block.id || template.kind !== block.kind) {
          throw new Error(`Block mismatch for key: ${block.key}`);
        }
        return {
          ...template,
          order: block.order
        };
      });

      const now = new Date().toISOString();
      const updatedPlan: PageDoc = {
        ...baselinePlan,
        updatedAt: now,
        meta: {
          ...baselinePlan.meta,
          generatedAt: now,
          planHash: incomingPlan.meta.planHash
        },
        blocks: reorderedBlocks
      };

      const record = await writeDefaultPage(updatedPlan);
      span.setAttribute('plan.hash', record.planHash);
      console.info('[defaultPlan.update] success', { tenantId, planHash: record.planHash, source: 'admin' });

      respond(res, 200, {
        plan: record.plan,
        encodedPlan: record.encodedPlan,
        planHash: record.planHash,
        updatedAt: record.updatedAt
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Unknown block')) {
        respond(res, 400, { error: 'invalid_block', message: error.message });
      } else if (error instanceof Error && error.message.startsWith('Block mismatch')) {
        respond(res, 400, { error: 'invalid_block', message: error.message });
      } else {
        console.error('[defaultPlan.update] failed', error);
        respond(res, 503, { error: 'default_plan_persist_failed' });
      }
    } finally {
      span.end();
    }
    return;
  }

  respond(res, 405, { error: 'method_not_allowed' });
}
