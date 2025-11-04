import { defineConfig, devices } from '@playwright/test';

if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
}

const CI = process.env.CI === 'true';
const NEXT_DEV_ENV = 'CHOKIDAR_USEPOLLING=1 WATCHPACK_POLLING=true NEXT_USE_POLLING=true';
const NEXT_DEV_HOST = 'HOST=0.0.0.0';

export default defineConfig({
  testDir: 'playwright',
  timeout: 45_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  retries: CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'demo-hosts-local',
      grepInvert: /@preview/,
      testMatch: ['**/projects/demo/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000'
      },
      webServer: {
        command: `${NEXT_DEV_ENV} PORT=3000 ${NEXT_DEV_HOST} pnpm --filter @events-hub/demo-host dev`,
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000
      }
    },
    {
      name: 'admin-local',
      grepInvert: /@preview/,
      testMatch: ['**/projects/admin/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001'
      },
      webServer: {
        command: `${NEXT_DEV_ENV} PORT=3001 ${NEXT_DEV_HOST} pnpm --filter @events-hub/admin dev`,
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 120_000
      }
    },
    {
      name: 'api-local',
      grepInvert: /@preview/,
      testMatch: ['**/projects/api/**/*.spec.ts'],
      use: {
        baseURL: 'http://localhost:4000'
      },
      webServer: {
        command: `PORT=4000 ${NEXT_DEV_HOST} pnpm --filter @events-hub/api dev`,
        url: 'http://localhost:4000/health',
        reuseExistingServer: true,
        timeout: 120_000
      }
    },
    {
      name: 'demo-hosts-preview',
      grep: /@preview/,
      testMatch: ['**/projects/demo/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PREVIEW_DEMO_URL ?? process.env.PREVIEW_URL
      }
    },
    {
      name: 'admin-preview',
      grep: /@preview/,
      testMatch: ['**/projects/admin/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PREVIEW_ADMIN_URL ?? process.env.PREVIEW_URL
      }
    },
    {
      name: 'api-preview',
      grep: /@preview/,
      testMatch: ['**/projects/api/**/*.spec.ts'],
      use: {
        baseURL: process.env.PREVIEW_API_URL ?? process.env.PREVIEW_URL
      }
    }
  ]
});
