#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demoDir = resolve(repoRoot, 'apps/demo-host');
const adminDir = resolve(repoRoot, 'apps/admin');
const apiDir = resolve(repoRoot, 'apps/api');
const binExt = process.platform === 'win32' ? '.cmd' : '';
const nextBin = (appDir) => resolve(appDir, 'node_modules', '.bin', `next${binExt}`);
const tsxBin = resolve(repoRoot, 'node_modules', '.bin', `tsx${binExt}`);

function resolvePort(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const demoPort = resolvePort(process.env.PLAYWRIGHT_DEMO_PORT ?? process.env.DEMO_PORT, 3000);
const adminPort = resolvePort(process.env.PLAYWRIGHT_ADMIN_PORT ?? process.env.ADMIN_PORT, 3001);
const apiPort = resolvePort(process.env.PLAYWRIGHT_API_PORT ?? process.env.API_PORT, 4000);

const serverConfigs = {
  demo: {
    name: 'demo',
    command: nextBin(demoDir),
    args: ['dev', '-p', String(demoPort), '-H', '0.0.0.0'],
    cwd: demoDir,
    env: {
      CHOKIDAR_USEPOLLING: '1',
      WATCHPACK_POLLING: 'true',
      NEXT_USE_POLLING: 'true',
      PORT: String(demoPort),
      HOST: '0.0.0.0'
    },
    url: `http://localhost:${demoPort}`
  },
  admin: {
    name: 'admin',
    command: nextBin(adminDir),
    args: ['dev', '-p', String(adminPort), '-H', '0.0.0.0'],
    cwd: adminDir,
    env: {
      CHOKIDAR_USEPOLLING: '1',
      WATCHPACK_POLLING: 'true',
      NEXT_USE_POLLING: 'true',
      PORT: String(adminPort),
      HOST: '0.0.0.0'
    },
    url: `http://localhost:${adminPort}`
  },
  api: {
    name: 'api',
    command: tsxBin,
    args: ['watch', 'adapters/local/server.ts'],
    cwd: apiDir,
    env: {
      PORT: String(apiPort),
      HOST: '0.0.0.0'
    },
    url: `http://localhost:${apiPort}/health`
  }
};

const scenarios = {
  local: {
    servers: [serverConfigs.demo, serverConfigs.admin, serverConfigs.api],
    testArgs: [
      'playwright',
      'test',
      '--project=demo-hosts-local',
      '--project=admin-local',
      '--project=api-local'
    ]
  },
  'api-contract': {
    servers: [serverConfigs.api],
    testArgs: [
      '--filter',
      '@events-hub/api',
      'exec',
      'vitest',
      'run',
      '--config',
      'vitest.contract.ts',
      '--reporter=dot'
    ]
  }
};

const scenario = process.argv[2] ?? 'local';
if (!scenarios[scenario]) {
  console.error(`[run-e2e] Unknown scenario "${scenario}".`);
  process.exit(1);
}

const WAIT_TIMEOUT_MS = 120_000;
const WAIT_INTERVAL_MS = 1_000;

const children = [];
let shuttingDown = false;

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    console.log(`[run-e2e] Received ${signal}, shutting down...`);
    void cleanup(130);
  });
}

function startServer({ name, command = 'pnpm', args, env, cwd = repoRoot }) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: false,
    cwd
  });

  child.once('exit', (code, signal) => {
    if (shuttingDown) return;
    console.error(
      `[run-e2e] ${name} server exited unexpectedly (${signal ?? `code ${code}`}).`
    );
    void cleanup(typeof code === 'number' ? code : 1);
  });

  children.push(child);
}

async function waitForUrl(url) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return;
      }
    } catch {
      // Retry
    }
    await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL_MS));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function runCommand(command, args, options) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: options?.env ?? process.env,
      cwd: repoRoot
    });
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited via signal ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

async function cleanup(exitCode) {
  if (shuttingDown) {
    if (typeof exitCode === 'number') {
      process.exit(exitCode);
    }
    return;
  }
  shuttingDown = true;

  await Promise.all(
    children.map(
      (child) =>
        new Promise((resolve) => {
          const killTimer = setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }, 5_000);

          child.once('exit', () => {
            clearTimeout(killTimer);
            resolve();
          });

          child.kill('SIGTERM');
        })
    )
  );

  if (typeof exitCode === 'number') {
    process.exit(exitCode);
  }
}

async function main() {
  const { servers, testArgs } = scenarios[scenario];

  if (scenario === 'local') {
    console.log('[run-e2e] Ensuring Playwright browsers are installed...');
    const browsersEnv = {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? '0'
    };
    await runCommand('pnpm', ['exec', 'playwright', 'install', '--with-deps'], { env: browsersEnv });
  }

  servers.forEach(startServer);
  console.log('[run-e2e] Waiting for dev servers to become ready...');
  await Promise.all(servers.map(({ url }) => waitForUrl(url)));
  console.log('[run-e2e] Servers ready, launching Playwright tests...');

  try {
    await runCommand('pnpm', testArgs);
    await cleanup(0);
  } catch (error) {
    console.error('[run-e2e] Playwright failed:', error.message);
    await cleanup(1);
  }
}

main().catch(async (error) => {
  console.error('[run-e2e] Unexpected error:', error);
  await cleanup(1);
});
