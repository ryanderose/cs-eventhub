import Fastify from "fastify";
import { renderPageToString } from "@eventhub/embed-sdk";
import { demoPage } from "./pageDoc";

const server = Fastify();

server.get("/", async () => {
  const rendered = renderPageToString(demoPage);
  const pageJson = JSON.stringify(demoPage);
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Events Hub Demo Host</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      ${rendered.head}
    </head>
    <body>
      <div id="events-hub-root">${rendered.html}</div>
      <script type="module">
        import { hydrate } from "@eventhub/embed-sdk";
        const page = ${pageJson};
        hydrate(document.getElementById("events-hub-root"), page);
      </script>
    </body>
  </html>`;
});

server.get("/page.json", async () => demoPage);

export async function startDemoHost() {
  await server.listen({ port: 3333, host: "0.0.0.0" });
  console.log("Demo host listening on http://localhost:3333");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startDemoHost().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
