import { cache } from 'react';
import type { PageDoc } from '@events-hub/page-schema';
import { BlockList } from '../../components/default-blocks/block-list';

export const dynamic = 'force-dynamic';

const DEFAULT_API_BASE = 'http://localhost:3001';
const DEFAULT_TENANT = 'demo';

type DefaultPlanResponse = {
  plan: PageDoc;
  encodedPlan: string;
  planHash: string;
  updatedAt: string;
};

const getApiBase = cache(() => process.env.NEXT_PUBLIC_API_BASE?.trim() || DEFAULT_API_BASE);

async function fetchDefaultPlan(tenantId: string): Promise<DefaultPlanResponse> {
  const apiBase = getApiBase();
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
  const tenantId = DEFAULT_TENANT;
  const apiBase = getApiBase();
  const payload = await fetchDefaultPlan(tenantId);

  return (
    <main>
      <BlockList initialPlan={payload.plan} planHash={payload.planHash} apiBase={apiBase} tenantId={tenantId} />
    </main>
  );
}
