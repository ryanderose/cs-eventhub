import type { PageDoc } from '@events-hub/page-schema';
import { createDefaultDemoPlan, type CreateDefaultDemoPlanOptions } from '@events-hub/default-plan';

export type SamplePlanOptions = CreateDefaultDemoPlanOptions;

/**
 * @deprecated Prefer importing `createDefaultDemoPlan` directly from `@events-hub/default-plan`.
 */
export function createSamplePlan(options?: SamplePlanOptions): PageDoc {
  return createDefaultDemoPlan(options);
}
