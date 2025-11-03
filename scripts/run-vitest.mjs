#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const argv = process.argv.slice(2);

let runInBand = false;
let testType;
const passthrough = [];

for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];

  if (arg === '--runInBand') {
    runInBand = true;
    continue;
  }

  if (arg === '--type') {
    testType = argv[index + 1];
    index += 1;
    continue;
  }

  if (arg.startsWith('--type=')) {
    testType = arg.split('=')[1];
    continue;
  }

  passthrough.push(arg);
}

if (runInBand) {
  passthrough.push('--maxWorkers', '1', '--minWorkers', '1');
}

const env = { ...process.env };
if (testType) {
  env.VITEST_TEST_TYPE = testType;
}

const vitestBin =
  process.platform === 'win32'
    ? join(repoRoot, 'node_modules', '.bin', 'vitest.cmd')
    : join(repoRoot, 'node_modules', '.bin', 'vitest');

const args = ['run', '--config', join(repoRoot, 'vitest.config.ts'), '--passWithNoTests', ...passthrough];

const child = spawn(vitestBin, args, {
  cwd: process.cwd(),
  env,
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
