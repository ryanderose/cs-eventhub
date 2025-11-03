import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['../../playwright/projects/api/**/*.contract.{ts,tsx}'],
    environment: 'node',
    reporters: 'dot'
  }
});
