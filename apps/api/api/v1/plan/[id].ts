import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePlanById } from '../../../src/http/plan-by-id';

export const config = { runtime: 'nodejs' };

export default function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  return handlePlanById(req, res);
}
