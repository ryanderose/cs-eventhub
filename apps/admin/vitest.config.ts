import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["../../tooling/config/vitest.setup.ts"],
    globals: true
  }
});
