import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  root: rootDir,
  resolve: {
    alias: [
      {
        find: /^@events-hub\/(.+)$/,
        replacement: `${rootDir}/packages/$1/src`
      }
    ]
  },
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
