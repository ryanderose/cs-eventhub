import { Buffer } from 'node:buffer';
import { http, HttpResponse } from 'msw';
import type { PageDoc } from '@events-hub/page-schema';
import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { server } from '../../../playwright/mocks/node';

const DEFAULT_TENANT = 'demo';
const DEFAULT_PLAN_ENDPOINT = /\/v1\/plan\/default/;
const DEFAULT_PLAN_PROXY = /\/api\/default-plan/;

export type MockPlanOptions = {
  plan?: PageDoc;
  status?: number;
  response?: Partial<DefaultPlanResponse>;
};

type DefaultPlanResponse = {
  plan: PageDoc;
  encodedPlan: string;
  planHash: string;
  updatedAt: string;
};

function buildDefaultPlanPayload(plan: PageDoc, overrides?: Partial<DefaultPlanResponse>): DefaultPlanResponse {
  const planHash = overrides?.planHash ?? plan.meta?.planHash ?? 'default-plan';
  return {
    plan,
    encodedPlan: overrides?.encodedPlan ?? Buffer.from(JSON.stringify(plan)).toString('base64'),
    planHash,
    updatedAt: overrides?.updatedAt ?? plan.updatedAt ?? new Date().toISOString()
  };
}

export function mockDefaultPlanResponse(options: MockPlanOptions = {}): void {
  const plan = options.plan ?? createDefaultDemoPlan({ tenantId: DEFAULT_TENANT });
  const payload = buildDefaultPlanPayload(plan, options.response);
  const status = options.status ?? 200;

  server.use(
    http.get(DEFAULT_PLAN_ENDPOINT, () => {
      return HttpResponse.json(payload, { status });
    }),
    http.get(DEFAULT_PLAN_PROXY, ({ request }) => {
      const url = new URL(request.url);
      const tenantId = url.searchParams.get('tenantId') ?? DEFAULT_TENANT;
      const responsePlan = tenantId === plan.tenantId ? plan : createDefaultDemoPlan({ tenantId });
      const responsePayload = buildDefaultPlanPayload(responsePlan);
      return HttpResponse.json(responsePayload, { status: 200 });
    })
  );
}

export function resetMswHandlers(): void {
  try {
    server.resetHandlers();
  } catch (error) {
    console.warn('Unable to reset MSW handlers', error);
  }
}

export { server as mswServer };
