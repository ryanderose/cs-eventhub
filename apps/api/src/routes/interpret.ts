import { performance } from "node:perf_hooks";
import type { FastifyInstance } from "fastify";
import type { Telemetry } from "@eventhub/telemetry";
import { interpret } from "@eventhub/ai-interpreter";

export function registerInterpretRoute(app: FastifyInstance, telemetry: Telemetry) {
  app.post("/v1/interpret", async (request, reply) => {
    const start = performance.now();
    const body = request.body as { text: string; tenantId: string };
    const span = telemetry.startSpan("composer.interpret", { attributes: { tenantId: body?.tenantId ?? "unknown" } });
    try {
      const result = interpret({ text: body?.text ?? "", tenantId: body?.tenantId ?? "unknown" });
      const latencyMs = Math.round(performance.now() - start);
      span.end();
      return reply.send({ query: result.query, latencyMs });
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  });
}
