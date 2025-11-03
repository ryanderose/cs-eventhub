import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const previewUrl = process.env.PREVIEW_URL;

const chromePathCandidates: string[] = [];
const envChromePath = process.env.PW_CHROME_PATH ?? process.env.PLAYWRIGHT_CHROME_PATH;
if (envChromePath) {
  chromePathCandidates.push(envChromePath);
}

if (process.platform === 'darwin') {
  chromePathCandidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
} else if (process.platform === 'win32') {
  chromePathCandidates.push('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
  chromePathCandidates.push('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
} else {
  chromePathCandidates.push('/usr/bin/google-chrome');
  chromePathCandidates.push('/usr/bin/google-chrome-stable');
  chromePathCandidates.push('/snap/bin/chromium');
}

const chromeExecutable = chromePathCandidates.find((candidate) => {
  if (!candidate) return false;
  try {
    return fs.existsSync(candidate);
  } catch {
    return false;
  }
});

const resolvedChannel =
  process.env.PW_CHANNEL ?? process.env.PLAYWRIGHT_CHANNEL ?? (isCI ? undefined : 'chrome');

if (process.env.DEBUG_PLAYWRIGHT_CONFIG) {
  console.log('[playwright-config] chromeExecutable:', chromeExecutable);
  console.log('[playwright-config] resolvedChannel:', resolvedChannel);
}

const pwHome = process.env.PW_HOME ?? path.resolve(process.cwd(), '.pw-home');
const userDataDir = process.env.PW_USER_DATA_DIR ?? path.resolve(process.cwd(), '.pw-user');
const crashDir = process.env.PW_CRASH_DIR ?? path.resolve(process.cwd(), '.chrome-crashes');

fs.mkdirSync(path.join(pwHome, 'Library', 'Application Support', 'Google', 'Chrome', 'Crashpad'), {
  recursive: true
});
fs.mkdirSync(userDataDir, { recursive: true });
fs.mkdirSync(crashDir, { recursive: true });

const baseUse: Parameters<typeof defineConfig>[0]['use'] = {
  browserName: 'chromium',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  userDataDir,
  launchOptions: {
    args: [
      `--crash-dumps-dir=${crashDir}`,
      '--noerrdialogs',
      '--disable-dev-shm-usage'
    ],
    env: {
      ...process.env,
      HOME: pwHome
    }
  }
};

if (chromeExecutable) {
  baseUse.launchOptions = {
    ...(baseUse.launchOptions ?? {}),
    executablePath: chromeExecutable
  };
  baseUse.channel = undefined;
} else if (resolvedChannel) {
  baseUse.channel = resolvedChannel;
}

export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: baseUse,
  projects: [
    {
      name: 'demo-hosts-local',
      testDir: 'playwright/projects/demo-hosts',
      grepInvert: /@preview/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3000' },
      webServer: {
        command:
          'PORT=3000 NEXT_PUBLIC_EMBED_MODE=linked NEXT_PUBLIC_API_BASE=http://127.0.0.1:4101 pnpm --filter @events-hub/demo-host dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !isCI,
        timeout: 120_000
      }
    },
    {
      name: 'admin-local',
      testDir: 'playwright/projects/admin',
      grepInvert: /@preview/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3001' },
      webServer: {
        command: 'PORT=3001 NEXT_PUBLIC_API_BASE=http://127.0.0.1:4102 pnpm --filter @events-hub/admin dev',
        url: 'http://127.0.0.1:3001',
        reuseExistingServer: !isCI,
        timeout: 120_000
      }
    },
    {
      name: 'api-local',
      testDir: 'playwright/projects/api',
      grepInvert: /@preview/,
      use: { baseURL: 'http://127.0.0.1:4000' },
      webServer: {
        command: 'PORT=4000 pnpm --filter @events-hub/api dev',
        url: 'http://127.0.0.1:4000/health',
        reuseExistingServer: !isCI,
        timeout: 60_000
      }
    },
    {
      name: 'demo-hosts-preview',
      testDir: 'playwright/projects/demo-hosts',
      grep: /@preview/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: previewUrl
      },
      webServer: {
        command:
          'PORT=3000 NEXT_PUBLIC_EMBED_MODE=linked NEXT_PUBLIC_API_BASE=http://127.0.0.1:4101 pnpm --filter @events-hub/demo-host dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !isCI,
        timeout: 120_000
      }
    },
    {
      name: 'admin-preview',
      testDir: 'playwright/projects/admin',
      grep: /@preview/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: previewUrl
      },
      webServer: {
        command: 'PORT=3001 NEXT_PUBLIC_API_BASE=http://127.0.0.1:4102 pnpm --filter @events-hub/admin dev',
        url: 'http://127.0.0.1:3001',
        reuseExistingServer: !isCI,
        timeout: 120_000
      }
    },
    {
      name: 'api-preview',
      testDir: 'playwright/projects/api',
      grep: /@preview/,
      use: {
        baseURL: previewUrl
      },
      webServer: {
        command: 'PORT=4000 pnpm --filter @events-hub/api dev',
        url: 'http://127.0.0.1:4000/health',
        reuseExistingServer: !isCI,
        timeout: 60_000
      }
    }
  ]
});
