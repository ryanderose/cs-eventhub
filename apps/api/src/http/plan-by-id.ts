import { decodePlan, resolveEncodedPlan } from '../lib/plan';
import type { ApiRequest, ApiResponse } from './types';

export async function handlePlanById(req: ApiRequest, res: ApiResponse): Promise<void> {
  if ((req.method ?? 'GET').toUpperCase() !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const query = (req as any).query ?? {};
  let idCandidate = query.id ?? (req as any).params?.id;
  if (Array.isArray(idCandidate)) {
    idCandidate = idCandidate[0];
  }
  const id = typeof idCandidate === 'string' ? idCandidate : idCandidate != null ? String(idCandidate) : undefined;
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
