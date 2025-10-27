import type { FastifyInstance } from "fastify";
import type { Telemetry } from "@eventhub/telemetry";
import { composePage } from "@eventhub/ai-composer";
import { encodePlanToHtml } from "@eventhub/router-helpers";

export function registerFragmentRoute(app: FastifyInstance, telemetry: Telemetry) {
  app.get("/v1/fragment/:tenantId", async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const { plan, p } = request.query as { plan?: string; p?: string };
    const span = telemetry.startSpan("composer.fragment", { attributes: { tenantId } });
    try {
      const composition = composePage({ query: { intent: "search", filters: {}, version: "dsl/1" }, tenantId });
      const fragment = encodePlanToHtml({ plan: plan ?? p ?? "", page: composition.page });
      span.end();
      reply.type("text/html");
      return fragment.html;
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      throw error;
    }
  });
}
