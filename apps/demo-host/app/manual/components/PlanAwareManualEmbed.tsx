'use client';

import type { ComponentProps } from 'react';
import { useDemoPlanContext } from '../../../lib/useDemoPlan';
import { ManualEmbed } from './ManualEmbed';

type ManualEmbedProps = ComponentProps<typeof ManualEmbed>;
type PlanAwareManualEmbedProps = Omit<ManualEmbedProps, 'plan' | 'planHash' | 'tenantId'>;

export function PlanAwareManualEmbed(props: PlanAwareManualEmbedProps) {
  const { plan, planHash, tenantId } = useDemoPlanContext();
  return <ManualEmbed {...props} plan={plan} planHash={planHash} tenantId={tenantId} />;
}
