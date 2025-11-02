import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['playwright/projects/api/**/*.contract.{ts,tsx}'],
    passWithNoTests: true,
    reporters: 'default',
    environment: 'node'
  }
});
