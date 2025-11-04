import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: path.resolve(__dirname, '..', '..'),
  test: {
    include: ['playwright/projects/api/**/*.contract.{ts,tsx}'],
    passWithNoTests: true,
    reporters: 'default',
    environment: 'node'
  }
});
