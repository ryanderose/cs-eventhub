import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageDoc } from '@events-hub/page-schema';

export type DefaultPlanResponse = {
  plan: PageDoc;
  encodedPlan: string;
  planHash: string;
  updatedAt: string;
};

type UseDefaultPlanOptions = {
  apiBase?: string;
  tenantId: string;
  planMode: string;
  fallbackPlan: PageDoc;
};

type DefaultPlanStatus = 'loading' | 'ready' | 'fallback' | 'disabled';

type UseDefaultPlanState = {
  plan: PageDoc;
  planHash: string;
  encodedPlan?: string;
  status: DefaultPlanStatus;
  source: 'api' | 'fallback';
  error?: string;
};

const DISABLED_PLAN_MODES = new Set(['legacy', 'sample']);
const MAX_ATTEMPTS = 2;
const MAX_STALE_RETRIES = 2;

class FetchPlanError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'FetchPlanError';
    this.status = status;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPlanUrl(apiBase: string, tenantId: string): string {
  const url = new URL('/v1/plan/default', apiBase);
  url.searchParams.set('tenantId', tenantId);
  return url.toString();
}

function normalizePlanResponse(payload: DefaultPlanResponse): DefaultPlanResponse {
  const planHash = payload.planHash || payload.plan.meta?.planHash;
  const plan: PageDoc = {
    ...payload.plan,
    meta: {
      ...(payload.plan.meta ?? {}),
      planHash: planHash ?? payload.plan.meta?.planHash ?? 'default-plan'
    }
  };
  return {
    plan,
    encodedPlan: payload.encodedPlan,
    planHash: plan.meta!.planHash!,
    updatedAt: payload.updatedAt
  };
}

export function useDefaultPlan({ apiBase, tenantId, planMode, fallbackPlan }: UseDefaultPlanOptions): UseDefaultPlanState {
  const fallbackHash = useMemo(() => fallbackPlan.meta?.planHash ?? 'sample-plan', [fallbackPlan]);
  const [state, setState] = useState<UseDefaultPlanState>({
    plan: fallbackPlan,
    planHash: fallbackHash,
    encodedPlan: undefined,
    status: DISABLED_PLAN_MODES.has(planMode) ? 'disabled' : 'loading',
    source: 'fallback'
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (DISABLED_PLAN_MODES.has(planMode)) {
      setState({
        plan: fallbackPlan,
        planHash: fallbackHash,
        encodedPlan: undefined,
        status: 'disabled',
        source: 'fallback',
        error: undefined
      });
      return;
    }

    const resolvedApiBase = apiBase?.trim();
    if (!resolvedApiBase) {
      setState({
        plan: fallbackPlan,
        planHash: fallbackHash,
        encodedPlan: undefined,
        status: 'fallback',
        source: 'fallback',
        error: 'API base not configured'
      });
      return;
    }
    const baseApiUrl = resolvedApiBase;

    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function fetchWithRetries() {
      setState((prev) => ({
        ...prev,
        status: 'loading',
        error: undefined
      }));

      const url = buildPlanUrl(baseApiUrl, tenantId);
      let staleRetries = 0;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        if (controller.signal.aborted) {
          return;
        }
        if (attempt > 1) {
          await delay(250 * 2 ** (attempt - 2));
        }
        try {
          const response = await fetch(url, {
            cache: 'no-store',
            headers: { Accept: 'application/json' },
            signal: controller.signal
          });

          if (response.status === 412) {
            staleRetries += 1;
            if (staleRetries > MAX_STALE_RETRIES) {
              throw new FetchPlanError(412, 'Stale default plan pointer');
            }
            continue;
          }

          if (!response.ok) {
            const text = await response.text();
            throw new FetchPlanError(response.status, text || response.statusText);
          }

          const payload = normalizePlanResponse((await response.json()) as DefaultPlanResponse);
          if (cancelled) {
            return;
          }

          setState({
            plan: payload.plan,
            encodedPlan: payload.encodedPlan,
            planHash: payload.planHash,
            status: 'ready',
            source: 'api',
            error: undefined
          });
          return;
        } catch (error) {
          if (controller.signal.aborted || cancelled) {
            return;
          }
          if (error instanceof FetchPlanError && error.status === 412) {
            continue;
          }
          if (attempt === MAX_ATTEMPTS) {
            const message =
              error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
            setState({
              plan: fallbackPlan,
              planHash: fallbackHash,
              encodedPlan: undefined,
              status: 'fallback',
              source: 'fallback',
              error: message
            });
          }
        }
      }
    }

    fetchWithRetries();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiBase, tenantId, planMode, fallbackPlan, fallbackHash]);

  return state;
}
