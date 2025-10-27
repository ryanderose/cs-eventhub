import type { FastifyInstance } from "fastify";
import type { Telemetry } from "@eventhub/telemetry";
import { composePage } from "@eventhub/ai-composer";

export function registerComposeRoute(app: FastifyInstance, telemetry: Telemetry) {
  app.post("/v1/compose", async (request, reply) => {
    const body = request.body as { query: unknown; tenantId: string };
    const span = telemetry.startSpan("composer.compose", { attributes: { tenantId: body?.tenantId ?? "unknown" } });
    try {
      const result = composePage({ query: body?.query, tenantId: body?.tenantId ?? "unknown" });
      span.end();
      return reply.send(result);
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  });
}
