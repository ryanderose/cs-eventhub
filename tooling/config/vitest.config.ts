import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/tests/**/*.test.ts", "packages/**/tests/**/*.test.tsx", "apps/**/tests/**/*.test.ts", "apps/**/tests/**/*.test.tsx"],
    globals: true
  }
});
