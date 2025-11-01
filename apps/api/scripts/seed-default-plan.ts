#!/usr/bin/env node

import process from 'node:process';
import { loadSeedPlan, writeDefaultPage } from '../src/lib/pages-store';

type SeedOptions = {
  tenant: string;
  quiet: boolean;
};

function printUsage() {
  console.log(`Seed the default plan for a tenant.

Usage:
  pnpm --filter @events-hub/api seed:default-plan -- [--tenant <id>] [--quiet]

Options:
  --tenant <id>   Tenant identifier to seed (default: demo)
  --quiet         Suppress success output (errors still surface)
  --help          Show this message
`);
}

function parseArgs(argv: string[]): SeedOptions {
  let tenant = 'demo';
  let quiet = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--tenant':
        tenant = argv[index + 1] ?? '';
        if (!tenant) {
          throw new Error('Missing value for --tenant');
        }
        index += 1;
        break;
      case '--quiet':
        quiet = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!tenant || tenant.trim().length === 0) {
    throw new Error('Tenant must be a non-empty string');
  }

  return { tenant: tenant.trim(), quiet };
}

async function seed() {
  try {
    const { tenant, quiet } = parseArgs(process.argv.slice(2));
    const plan = loadSeedPlan(tenant);
    const result = await writeDefaultPage(plan);
    if (!quiet) {
      console.log(
        JSON.stringify(
          {
            message: 'Default plan seeded',
            tenantId: tenant,
            planHash: result.planHash,
            updatedAt: result.updatedAt
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : `Unknown error: ${String(error)}`;
    console.error(message);
    process.exitCode = 1;
  }
}

void seed();
