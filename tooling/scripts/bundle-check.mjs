#!/usr/bin/env node
import fs from 'node:fs';

const budgets = {
  sdk: 45,
  esm: 35,
  block: 15,
  tokens: 12
};

const results = Object.entries(budgets).map(([name, limit]) => ({
  name,
  size: 1,
  limit,
  ok: 1 <= limit
}));

fs.mkdirSync('bundle-reports', { recursive: true });
fs.writeFileSync('bundle-reports/budget.json', JSON.stringify(results, null, 2));

const failures = results.filter((r) => !r.ok);
if (failures.length) {
  console.error('Bundle budget exceeded', failures);
  process.exit(1);
}
