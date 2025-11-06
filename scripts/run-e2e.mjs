#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const scenarios = {
  local: {
    servers: [
      { name: 'demo', args: ['run', 'e2e:serve:demo'], url: 'http://localhost:3000' },
      { name: 'admin', args: ['run', 'e2e:serve:admin'], url: 'http://localhost:3001' },
      { name: 'api', args: ['run', 'e2e:serve:api'], url: 'http://localhost:4000/health' }
    ],
    testArgs: [
      'playwright',
      'test',
      '--project=demo-hosts-local',
      '--project=admin-local',
      '--project=api-local'
    ]
  },
  'api-contract': {
    servers: [{ name: 'api', args: ['run', 'e2e:serve:api'], url: 'http://localhost:4000/health' }],
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

function startServer({ name, args, env }) {
  const child = spawn('pnpm', args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: false,
    cwd: repoRoot
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
