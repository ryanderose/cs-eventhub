#!/usr/bin/env node

import process from 'node:process';
import { deleteEncodedPlan } from '../src/lib/plan';
import { getDefaultPageHash, getDefaultPageStorageMode, loadSeedPlan, writeDefaultPage } from '../src/lib/pages-store';

type SeedOptions = {
  tenant: string;
  quiet: boolean;
  force: boolean;
  dryRun: boolean;
};

function printUsage() {
  console.log(`Seed the default plan for a tenant.

Usage:
  pnpm --filter @events-hub/api seed:default-plan -- [--tenant <id>] [--quiet] [--force] [--dry-run]

Options:
  --tenant <id>   Tenant identifier to seed (default: demo)
  --quiet         Suppress success output (errors still surface)
  --force         Rewrite an existing default plan pointer
  --dry-run       Output the planned action without mutating storage
  --help          Show this message
`);
}

function parseArgs(argv: string[]): SeedOptions {
  let tenant = 'demo';
  let quiet = false;
  let force = false;
  let dryRun = false;

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
      case '--':
        // Ignore argument separator inserted by package managers.
        break;
      case '--force':
        force = true;
        break;
      case '--dry-run':
        dryRun = true;
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

  return { tenant: tenant.trim(), quiet, force, dryRun };
}

async function seed() {
  try {
    const { tenant, quiet, force, dryRun } = parseArgs(process.argv.slice(2));
    const storageMode = getDefaultPageStorageMode();
    const existingPointer = await getDefaultPageHash(tenant);

    if (existingPointer && !force) {
      if (!quiet) {
        console.log(
          JSON.stringify(
            {
              message: 'Default plan already seeded (use --force to rewrite)',
              tenantId: tenant,
              planHash: existingPointer.planHash,
              updatedAt: existingPointer.updatedAt,
              storageMode
            },
            null,
            2
          )
        );
      }
      return;
    }

    const plan = loadSeedPlan(tenant);

    if (dryRun) {
      if (!quiet) {
        console.log(
          JSON.stringify(
            {
              message: existingPointer ? 'Dry run: would rewrite default plan' : 'Dry run: would seed default plan',
              tenantId: tenant,
              storageMode,
              previousPlanHash: existingPointer?.planHash ?? null
            },
            null,
            2
          )
        );
      }
      return;
    }

    const result = await writeDefaultPage(plan);

    if (force && existingPointer?.planHash && existingPointer.planHash !== result.planHash) {
      await deleteEncodedPlan(existingPointer.planHash);
    }

    if (!quiet) {
      console.log(
        JSON.stringify(
          {
            message: existingPointer ? 'Default plan rewritten' : 'Default plan seeded',
            tenantId: tenant,
            planHash: result.planHash,
            previousPlanHash: existingPointer?.planHash ?? null,
            updatedAt: result.updatedAt,
            storageMode
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
