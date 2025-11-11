'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PageDoc } from '@events-hub/page-schema';
import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { DEFAULT_TENANT, getApiBase, getPlanMode } from './env';
import { useDefaultPlan, type DefaultPlanOrigin, type DefaultPlanStatus } from './useDefaultPlan';

type DemoPlanProviderProps = {
  tenantId?: string;
  children: ReactNode;
};

export type DemoPlanContextValue = {
  tenantId: string;
  plan: PageDoc;
  planHash: string | null;
  planStatus: DefaultPlanStatus;
  planSource: 'api' | 'fallback';
  planOrigin: DefaultPlanOrigin;
  planError?: string;
  isFallback: boolean;
  isLoading: boolean;
};

const DemoPlanContext = createContext<DemoPlanContextValue | null>(null);

function resolvePlanEndpoint(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_PLAN_ENDPOINT?.trim() ?? '/api/default-plan';
}

export function DemoPlanProvider({ tenantId = DEFAULT_TENANT, children }: DemoPlanProviderProps) {
  const fallbackPlan = useMemo(() => createDefaultDemoPlan({ tenantId }), [tenantId]);
  const [host, setHost] = useState<string | null>(
    typeof window === 'undefined' ? process.env.NEXT_PUBLIC_DEMO_HOSTNAME ?? null : window.location.host ?? null
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setHost((current) => {
      const nextHost = window.location.host ?? null;
      return current === nextHost ? current : nextHost;
    });
  }, []);

  const apiBase = useMemo(() => getApiBase({ host }), [host]);
  const planEndpoint = useMemo(() => resolvePlanEndpoint(), []);
  const planMode = useMemo(() => getPlanMode(), []);
  const planState = useDefaultPlan({
    apiBase,
    planEndpoint,
    tenantId,
    planMode,
    fallbackPlan
  });

  const planHash = planState.planHash ?? planState.plan.meta?.planHash ?? null;
  const contextValue = useMemo<DemoPlanContextValue>(
    () => ({
      tenantId,
      plan: planState.plan,
      planHash,
      planStatus: planState.status,
      planSource: planState.source,
      planOrigin: planState.origin,
      planError: planState.error,
      isFallback: planState.status === 'fallback' || planState.source === 'fallback',
      isLoading: planState.status === 'loading'
    }),
    [tenantId, planState.plan, planHash, planState.status, planState.source, planState.origin, planState.error]
  );

  return <DemoPlanContext.Provider value={contextValue}>{children}</DemoPlanContext.Provider>;
}

export function useDemoPlanContext(): DemoPlanContextValue {
  const context = useContext(DemoPlanContext);
  if (!context) {
    throw new Error('useDemoPlanContext must be used within a DemoPlanProvider');
  }
  return context;
}
