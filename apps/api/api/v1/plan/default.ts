import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleDefaultPlan } from '../../../src/http/plan-default';

export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  return handleDefaultPlan(req, res);
}
