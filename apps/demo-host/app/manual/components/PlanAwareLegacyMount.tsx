'use client';

import type { ComponentProps } from 'react';
import { useDemoPlanContext } from '../../../lib/useDemoPlan';
import { LegacyMountExample } from './LegacyMountExample';

type LegacyMountProps = ComponentProps<typeof LegacyMountExample>;
type PlanAwareLegacyMountProps = Omit<LegacyMountProps, 'plan' | 'planHash' | 'tenantId'>;

export function PlanAwareLegacyMount(props: PlanAwareLegacyMountProps) {
  const { plan, planHash, tenantId } = useDemoPlanContext();
  return <LegacyMountExample {...props} plan={plan} planHash={planHash} tenantId={tenantId} />;
}
