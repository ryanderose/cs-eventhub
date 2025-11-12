import { getDefaultBlockAllowlist } from '@events-hub/default-plan';
import { PageDocSchema, type PageDoc } from '@events-hub/page-schema';
import { startSpan } from '../lib/telemetry';
import {
  getDefaultPageHash,
  getDefaultPageStorageMode,
  loadSeedPlan,
  readDefaultPage,
  writeDefaultPage
} from '../lib/pages-store';
import type { ApiRequest, ApiResponse } from './types';

const DEFAULT_TENANT = 'demo';
const BLOCK_ALLOWLIST = getDefaultBlockAllowlist();
const BLOCK_ALLOWLIST_MAP = new Map(BLOCK_ALLOWLIST.map((entry) => [entry.key, entry]));
const MAX_BLOCKS = BLOCK_ALLOWLIST.length;

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

function validateBlockTuples(blocks: Array<{ key: string; id: string; kind: string }>): {
  valid: boolean;
  message?: string;
} {
  const seenKeys = new Set<string>();
  for (const block of blocks) {
    if (seenKeys.has(block.key)) {
      return { valid: false, message: `Duplicate block key: ${block.key}` };
    }
    seenKeys.add(block.key);
    const allowed = BLOCK_ALLOWLIST_MAP.get(block.key);
    if (!allowed) {
      return { valid: false, message: `Unknown block key: ${block.key}` };
    }
    if (allowed.id !== block.id || allowed.kind !== block.kind) {
      return { valid: false, message: `Block tuple mismatch for key: ${block.key}` };
    }
  }
  return { valid: true };
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
    const storageMode = getDefaultPageStorageMode();
    span.setAttribute('storage.mode', storageMode);
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
      span.setAttribute('block.count', record.plan.blocks.length);
      const blockKeys = record.plan.blocks.map((block) => block.key);
      console.info('[defaultPlan.fetch] success', {
        tenantId,
        planHash: record.planHash,
        seeded,
        storageMode,
        blockCount: record.plan.blocks.length,
        blockKeys
      });
      respond(res, 200, {
        plan: record.plan,
        encodedPlan: record.encodedPlan,
        planHash: record.planHash,
        updatedAt: record.updatedAt
      });
    } catch (error) {
      console.error('[defaultPlan.fetch] failed', { tenantId, storageMode, error });
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
    const storageMode = getDefaultPageStorageMode();
    span.setAttribute('storage.mode', storageMode);

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

      const tupleValidation = validateBlockTuples(incomingPlan.blocks);
      if (!tupleValidation.valid) {
        respond(res, 400, { error: 'invalid_block', message: tupleValidation.message });
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

      const reorderedBlocks = incomingPlan.blocks.map((block) => {
        const template = baselineBlocks.get(block.key);
        if (!template) {
          throw new Error(`Unknown block key: ${block.key}`);
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
          planHash: incomingPlan.meta.planHash,
          flags: {
            ...baselinePlan.meta?.flags,
            seeded: false
          }
        },
        blocks: reorderedBlocks
      };

      console.info('[defaultPlan.update] reorder', {
        incomingOrder: incomingPlan.blocks.map((block) => ({ key: block.key, order: block.order })),
        updatedOrder: reorderedBlocks.map((block) => ({ key: block.key, order: block.order }))
      });

      const record = await writeDefaultPage(updatedPlan);
      span.setAttribute('plan.hash', record.planHash);
      span.setAttribute('block.count', record.plan.blocks.length);
      const blockKeys = record.plan.blocks.map((block) => block.key);
      console.info('[defaultPlan.update] success', {
        tenantId,
        planHash: record.planHash,
        source: 'admin',
        storageMode,
        blockCount: record.plan.blocks.length,
        blockKeys
      });

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
        console.error('[defaultPlan.update] failed', { tenantId, storageMode, error });
        respond(res, 503, { error: 'default_plan_persist_failed' });
      }
    } finally {
      span.end();
    }
    return;
  }

  respond(res, 405, { error: 'method_not_allowed' });
}
