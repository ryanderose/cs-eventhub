import type { ReactNode } from 'react';
import { DemoPlanProvider } from '../../lib/useDemoPlan';
import { DEFAULT_TENANT } from '../../lib/env';
import { PlanStatusBanner } from '../components/PlanStatusBanner';
import { ManualHarnessControls } from './components/ManualHarnessControls';

export default function ManualLayout({ children }: { children: ReactNode }) {
  return (
    <DemoPlanProvider tenantId={DEFAULT_TENANT}>
      <PlanStatusBanner />
      <ManualHarnessControls />
      {children}
    </DemoPlanProvider>
  );
}
