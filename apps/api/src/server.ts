import Fastify, { type FastifyInstance } from 'fastify';
import { trace } from '@opentelemetry/api';
import { interpret } from '@events-hub/ai-interpreter';
import { compose } from '@events-hub/ai-composer';
import { buildFragmentCsp } from '@events-hub/security';
import { canonicalizePageDoc, computePlanHash } from '@events-hub/page-schema';
import { encodePlan, decodePlan } from '@events-hub/router-helpers';

const planStore = new Map<string, { plan: string; createdAt: number }>();
const PLAN_TTL_MS = 3_600_000;

function persistShortPlan(plan: string): string {
  const page = decodePlan(plan);
  const canonical = canonicalizePageDoc(page);
  const hash = computePlanHash(canonical);
  planStore.set(hash, { plan, createdAt: Date.now() });
  return hash;
}

function resolveShortPlan(id: string): string | undefined {
  const entry = planStore.get(id);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > PLAN_TTL_MS) {
    planStore.delete(id);
    return undefined;
  }
  return entry.plan;
}

export function buildServer(): FastifyInstance {
  const fastify = Fastify({ logger: true });

  fastify.post('/v1/interpret', async (request, reply) => {
    const { query = '' } = (request.body as { query?: string }) ?? {};
    const span = trace.getTracer('api').startSpan('interpreter.call');
    const result = interpret(query);
    span.setAttribute('filters.count', Object.keys(result.filters).length);
    span.end();
    return reply.send({ ...result, latencyMs: 5, spans: ['interpreter.stub'] });
  });

  fastify.post('/v1/compose', async (request, reply) => {
    const payload = request.body as any;
    const span = trace.getTracer('api').startSpan('composer.call');
    const result = await compose({
      tenantId: payload.tenantId ?? 'demo',
      intent: payload.intent ?? 'search',
      filters: payload.filters ?? {},
      planHash: payload.planHash,
      locale: payload.locale ?? 'en-US',
      streaming: payload.streaming ?? false
    });
    const plan = canonicalizePageDoc(result.page);
    const encoded = encodePlan(plan);
    span.setAttribute('plan.hash', plan.meta?.planHash ?? '');
    span.end();
    if (encoded.length > 2_000) {
      const shortId = persistShortPlan(encoded);
      return reply.send({ ...result, encodedPlan: undefined, shortId });
    }
    return reply.send({ ...result, encodedPlan: encoded });
  });

  fastify.get('/v1/fragment/:tenantId', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const html = `<div data-tenant="${tenantId}">Fragment placeholder</div>`;
    const csp = buildFragmentCsp({ scriptSrc: [], styleSrc: [] });
    reply.header('Content-Security-Policy', csp);
    reply.type('text/html');
    return reply.send(html);
  });

  fastify.get('/v1/plan/:planId', async (request, reply) => {
    const { planId } = request.params as { planId: string };
    const encoded = resolveShortPlan(planId);
    if (!encoded) {
      return reply.status(404).send({ error: 'Plan not found' });
    }
    const page = decodePlan(encoded);
    return reply.send({ plan: page, encoded });
  });

  return fastify;
}

const executedAsScript = Boolean(process.argv[1]?.includes('server'));

if (executedAsScript) {
  buildServer()
    .listen({ port: 4000, host: '0.0.0.0' })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default buildServer;
