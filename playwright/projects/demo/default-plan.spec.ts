import { expect, test, type APIRequestContext, type TestInfo } from '@playwright/test';

const PLAN_ENDPOINT = '/api/v1/plan/default';

type BlockInstance = { key: string; order: number };
type DefaultPlanResponse = {
  plan: { blocks: BlockInstance[]; meta: { planHash?: string } };
  planHash: string;
  updatedAt: string;
};

function resolveUrl(base: string | undefined, path: string): string {
  const resolvedBase = base ?? 'http://localhost:4000';
  return new URL(path, resolvedBase).toString();
}

function orderedKeys(blocks: BlockInstance[]): string[] {
  return [...blocks]
    .sort((a, b) => a.order - b.order)
    .map((block) => block.key);
}

async function fetchPlan(request: APIRequestContext, url: string, testInfo: TestInfo): Promise<DefaultPlanResponse | null> {
  try {
    const response = await request.get(url, { headers: { Accept: 'application/json' } });
    if (!response.ok()) {
      await testInfo.attach('default-plan-fetch', { body: `GET ${url} → ${response.status()}` });
      return null;
    }
    return (await response.json()) as DefaultPlanResponse;
  } catch (error) {
    await testInfo.attach('default-plan-fetch-error', {
      body: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

async function persistOrder(
  request: APIRequestContext,
  url: string,
  baseline: DefaultPlanResponse,
  desiredOrder: string[]
): Promise<DefaultPlanResponse> {
  const blockMap = new Map(baseline.plan.blocks.map((block) => [block.key, block]));
  const reorderedBlocks = desiredOrder.map((key, index) => {
    const block = blockMap.get(key);
    if (!block) {
      throw new Error(`Unknown block key: ${key}`);
    }
    return { ...block, order: index };
  });

  const payload = {
    ...baseline.plan,
    blocks: reorderedBlocks
  };

  const response = await request.put(url, {
    data: { plan: payload },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });

  expect(response.status(), `PUT ${url}`).toBe(200);
  return (await response.json()) as DefaultPlanResponse;
}

test.describe('demo host default plan', () => {
  test('embed reflects admin reorders @default-plan', async ({ page, request, baseURL }, testInfo) => {
    test.skip(!baseURL, 'demo host baseURL is not configured');

    const apiBase = process.env.PLAYWRIGHT_DEFAULT_PLAN_API ?? process.env.LOCAL_API_URL ?? 'http://localhost:4000';
    const planUrl = resolveUrl(apiBase, PLAN_ENDPOINT);

    const initial = await fetchPlan(request, planUrl, testInfo);
    test.skip(!initial, 'Default plan API unavailable – start the API server or set PLAYWRIGHT_DEFAULT_PLAN_API.');

    const baselinePlan = initial!;
    const baselineKeys = orderedKeys(baselinePlan.plan.blocks);
    const reversedKeys = [...baselineKeys].reverse();

    let latestPlan: DefaultPlanResponse = baselinePlan;

    try {
      latestPlan = await persistOrder(request, planUrl, baselinePlan, reversedKeys);

      await page.goto('/');
      const expected = reversedKeys.join(',');
      await page.waitForFunction(
        (keyString) => {
          const el = document.querySelector('[data-embed-container]') as HTMLElement | null;
          return el?.dataset.planSource === 'api' && el?.dataset.planKeys === keyString;
        },
        expected,
        { timeout: 15_000 }
      );
    } finally {
      if (baselineKeys.length && latestPlan) {
        try {
          await persistOrder(request, planUrl, latestPlan, baselineKeys);
        } catch (error) {
          console.warn('Failed to restore default plan order after test', error);
        }
      }
    }
  });
});
