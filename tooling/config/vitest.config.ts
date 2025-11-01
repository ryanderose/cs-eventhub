import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  test: {
    include: ['packages/**/*.{test,spec}.ts?(x)', 'apps/**/__tests__/**/*.{test,spec}.ts?(x)'],
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage'
    }
  }
});
