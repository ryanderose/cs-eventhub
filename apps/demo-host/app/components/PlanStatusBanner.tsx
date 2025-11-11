'use client';

import { useMemo } from 'react';
import { useDemoPlanContext } from '../../lib/useDemoPlan';

export function PlanStatusBanner() {
  const { planStatus, planSource, planOrigin, planError } = useDemoPlanContext();

  const message = useMemo(() => {
    if (planStatus === 'loading') {
      return 'Loading stored default plan…';
    }
    if (planStatus === 'fallback') {
      const detail = planError ? ` — ${planError}` : '';
      return `Unable to load stored default plan${detail}. Showing fallback data.`;
    }
    if (planStatus === 'disabled') {
      return 'Sample plan mode enabled (default plan fetch disabled).';
    }
    if (planSource === 'api' && planOrigin === 'seeded') {
      return 'Viewing seeded default plan (save a change in admin to persist).';
    }
    return null;
  }, [planStatus, planSource, planOrigin, planError]);

  if (!message) {
    return null;
  }

  return (
    <p className="status plan-status-banner" role="status" data-plan-status={planStatus}>
      {message}
    </p>
  );
}
