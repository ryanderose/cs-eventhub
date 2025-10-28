import type { VercelRequest, VercelResponse } from '@vercel/node';
import { decodePlan, resolveEncodedPlan } from '../../../src/lib/plan';

export const config = { runtime: 'nodejs20.x' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    res.status(400).json({ error: 'Missing plan id' });
    return;
  }

  const encoded = await resolveEncodedPlan(id);
  if (!encoded) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }

  const plan = decodePlan(encoded);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ plan, encoded });
}
