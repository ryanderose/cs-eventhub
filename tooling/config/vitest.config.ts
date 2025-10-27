import { defineConfig } from 'vitest/config';

export default defineConfig({
  testDir: '.',
  include: ['packages/**/__tests__/**/*.test.ts'],
  globals: true,
  environment: 'jsdom',
  coverage: {
    reporter: ['text', 'lcov'],
    reportsDirectory: './coverage'
  }
});
