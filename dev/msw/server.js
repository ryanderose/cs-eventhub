import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "warn" });

console.log("MSW edge proxy running on 8080 (mocked)");
setInterval(() => {}, 1 << 30);
