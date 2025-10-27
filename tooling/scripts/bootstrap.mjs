#!/usr/bin/env node
import { execSync } from 'node:child_process';

execSync('pnpm install', { stdio: 'inherit' });
execSync('pnpm -w build', { stdio: 'inherit' });
