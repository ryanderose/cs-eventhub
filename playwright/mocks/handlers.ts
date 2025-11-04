import { rest } from 'msw';
import type { RestRequest } from 'msw';

export const DEFAULT_TENANT = 'demo';

type CollectionEvent = {
  id: string;
  canonicalId: string;
  name: string;
  startDate: string;
  categories: string[];
  source: { provider: string; id: string };
};

type PlanBlock = {
  id: string;
  key: string;
  kind: string;
  version: string;
  order: number;
  layout: { fullWidth: boolean };
  data: Record<string, unknown>;
};

type DefaultPlanResponse = {
  plan: {
    id: string;
    title: string;
    path: string;
    description: string;
    updatedAt: string;
    blocks: PlanBlock[];
  };
  planHash: string;
  encodedPlan: string;
  updatedAt: string;
};

const sampleEvents: CollectionEvent[] = [
  {
    id: 'evt-1',
    canonicalId: 'evt-1',
    name: 'Waterfront Concert Series',
    startDate: '2024-06-01T18:00:00.000Z',
    categories: ['music'],
    source: { provider: 'demo', id: 'evt-1' }
  },
  {
    id: 'evt-2',
    canonicalId: 'evt-2',
    name: 'Saturday Farmers Market',
    startDate: '2024-06-01T16:00:00.000Z',
    categories: ['community'],
    source: { provider: 'demo', id: 'evt-2' }
  }
];

const samplePlanBlocks: PlanBlock[] = [
  {
    id: 'filter-bar',
    key: 'filter-bar',
    kind: 'filter-bar',
    version: '1.5',
    order: 0,
    layout: { fullWidth: true },
    data: {
      facets: [
        {
          id: 'date',
          label: 'Date',
          type: 'date',
          multi: false,
          options: [
            { id: 'today', label: 'Today' },
            { id: 'weekend', label: 'This weekend' }
          ]
        },
        {
          id: 'category',
          label: 'Category',
          type: 'category',
          multi: false,
          options: [
            { id: 'music', label: 'Music' },
            { id: 'community', label: 'Community' }
          ]
        }
      ],
      active: { date: 'today', category: 'all' }
    }
  },
  {
    id: 'collection-rail',
    key: 'collection-rail',
    kind: 'collection-rail',
    version: '1.5',
    order: 1,
    layout: { fullWidth: true },
    data: {
      title: 'Top picks',
      events: sampleEvents,
      layout: 'rail'
    }
  }
];

export const defaultPlanResponse: DefaultPlanResponse = {
  plan: {
    id: DEFAULT_TENANT,
    title: 'Events Hub Sample Plan',
    path: '/demo',
    description: 'Sample plan rendered for local tests',
    updatedAt: '2024-06-01T00:00:00.000Z',
    blocks: samplePlanBlocks
  },
  planHash: 'demo-plan-hash',
  encodedPlan: 'encoded-demo-plan',
  updatedAt: '2024-06-01T00:00:00.000Z'
};

function normalizeTenant(request: RestRequest) {
  const url = new URL(request.url);
  return url.searchParams.get('tenantId') ?? DEFAULT_TENANT;
}

export const handlers = [
  rest.get('*/v1/plan/default', (req, res, ctx) =>
    res(
      ctx.json({
        ...defaultPlanResponse,
        plan: { ...defaultPlanResponse.plan, id: normalizeTenant(req) }
      })
    )
  ),
  rest.get('*/health', (_req, res, ctx) => res(ctx.text('OK')))
];

export type MswHandler = (typeof handlers)[number];
