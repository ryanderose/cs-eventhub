import Fastify, { type FastifyInstance } from 'fastify';
import { trace } from '@opentelemetry/api';
import { interpret } from '@events-hub/ai-interpreter';
import { compose } from '@events-hub/ai-composer';
import { buildFragmentCsp } from '@events-hub/security';

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
    const result = compose({
      intent: payload.intent ?? 'search',
      filters: payload.filters ?? {},
      planHash: payload.planHash
    });
    span.setAttribute('plan.hash', result.page.meta?.planHash ?? '');
    span.end();
    return reply.send(result);
  });

  fastify.get('/v1/fragment/:tenantId', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const html = `<div data-tenant="${tenantId}">Fragment placeholder</div>`;
    const csp = buildFragmentCsp({ scriptSrc: [], styleSrc: [] });
    reply.header('Content-Security-Policy', csp);
    reply.type('text/html');
    return reply.send(html);
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
