import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerInterpretRoute } from "./routes/interpret";
import { registerComposeRoute } from "./routes/compose";
import { registerFragmentRoute } from "./routes/fragment";
import { createTelemetry } from "@eventhub/telemetry";

const telemetry = createTelemetry({ serviceName: "events-hub-api" });

export const app = Fastify({ logger: true });

app.register(cors, { origin: true });

registerInterpretRoute(app, telemetry);
registerComposeRoute(app, telemetry);
registerFragmentRoute(app, telemetry);

export async function start() {
  await app.listen({ port: 4000, host: "0.0.0.0" });
  app.log.info("API listening on http://localhost:4000");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
