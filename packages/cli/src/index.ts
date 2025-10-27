#!/usr/bin/env node
import { program } from 'commander';
import { spawnSync } from 'node:child_process';

program.name('events-hub').description('Developer tooling for Events Hub');

program
  .command('bundle-check')
  .description('Run bundle budget checks')
  .action(() => {
    spawnSync('node', ['../../tooling/scripts/bundle-check.mjs'], { stdio: 'inherit' });
  });

program
  .command('sbom')
  .description('Generate SBOM artifact')
  .action(() => {
    spawnSync('node', ['../../tooling/scripts/sbom.mjs'], { stdio: 'inherit' });
  });

program.parse(process.argv);
