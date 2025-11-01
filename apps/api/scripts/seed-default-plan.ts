import { buildDefaultStaticPlan } from '@events-hub/ai-composer';
import { persistDefaultPlan } from '../src/lib/plan';

type SeedArgs = {
  tenant?: string;
  locale?: string;
};

function parseArgs(argv: string[]): SeedArgs {
  const args: SeedArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      args[key as keyof SeedArgs] = next;
      index += 1;
      continue;
    }
    args[key as keyof SeedArgs] = 'true';
  }
  return args;
}

async function main() {
  const { tenant, locale } = parseArgs(process.argv.slice(2));
  const tenantId = typeof tenant === 'string' && tenant !== 'true' ? tenant : 'demo';
  const resolvedLocale = typeof locale === 'string' && locale !== 'true' ? locale : 'en-US';

  const plan = buildDefaultStaticPlan(tenantId, resolvedLocale);
  const persisted = await persistDefaultPlan(plan, tenantId);

  console.info('Seeded default plan pointer', {
    tenantId,
    planHash: persisted.planHash,
    updatedAt: persisted.updatedAt
  });
}

main().catch((error) => {
  console.error('Failed to seed default plan', error);
  process.exit(1);
});
