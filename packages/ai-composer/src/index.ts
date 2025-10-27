import type { PageDoc } from '@events-hub/page-schema';

export type ComposeInput = {
  intent: 'search' | 'qa' | 'navigate';
  filters: Record<string, unknown>;
  planHash?: string;
};

export type ComposeResult = {
  page: PageDoc;
  composerVersion: string;
  budgetMs: number;
  fallbackTriggered: boolean;
};

export function compose(input: ComposeInput): ComposeResult {
  const now = new Date().toISOString();
  const page: PageDoc = {
    id: 'stub-page',
    title: 'Events Hub Plan',
    path: '/plan',
    blocks: [],
    updatedAt: now,
    version: '1.5',
    tenantId: 'demo-tenant',
    meta: {
      planHash: input.planHash,
      composerVersion: 'stub-1'
    }
  } as PageDoc;

  return {
    page,
    composerVersion: 'stub-1',
    budgetMs: 10,
    fallbackTriggered: false
  };
}
