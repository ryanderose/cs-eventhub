import { cache } from 'react';
import type { PageDoc } from '@events-hub/page-schema';
import { BlockList } from '../../components/default-blocks/block-list';
import { getApiBase, getDefaultTenant } from '../../lib/env';

export const dynamic = 'force-dynamic';

type DefaultPlanResponse = {
  plan: PageDoc;
  encodedPlan: string;
  planHash: string;
  updatedAt: string;
};

const resolveApiBase = cache(() => getApiBase());
const resolveTenantId = cache(() => getDefaultTenant());

async function fetchDefaultPlan(tenantId: string): Promise<DefaultPlanResponse> {
  const apiBase = resolveApiBase();
  const response = await fetch(`${apiBase}/v1/plan/default?tenantId=${tenantId}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to load default plan (${response.status})`);
  }

  const payload = (await response.json()) as DefaultPlanResponse;
  return payload;
}

export default async function BlocksPage() {
  const tenantId = resolveTenantId();
  const apiBase = resolveApiBase();
  const payload = await fetchDefaultPlan(tenantId);

  return (
    <main>
      <BlockList initialPlan={payload.plan} planHash={payload.planHash} apiBase={apiBase} tenantId={tenantId} />
    </main>
  );
}
