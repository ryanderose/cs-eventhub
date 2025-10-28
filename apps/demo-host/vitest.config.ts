import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: '.',
    environment: 'jsdom',
    include: ['app/**/*.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['./vitest.setup.ts']
  },
  deps: {
    inline: ['next', 'react', 'react-dom']
  }
});
