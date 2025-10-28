import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllowedManifestMode, resolveTenantResponse } from '../../../src/config/tenants.js';

export const config = { runtime: 'nodejs20.x' };

function applyCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Timing-Allow-Origin', '*');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  applyCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET,OPTIONS');
    res.status(405).end();
    return;
  }

  const rawTenant = Array.isArray(req.query.tenant) ? req.query.tenant[0] : req.query.tenant;
  const tenantId = (rawTenant ?? '').replace(/\.json$/u, '');
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant id is required.' });
    return;
  }

  const modeParam = Array.isArray(req.query.mode) ? req.query.mode[0] : req.query.mode;
  const mode = getAllowedManifestMode(modeParam);
  const tenantResponse = resolveTenantResponse(tenantId, mode);

  if (!tenantResponse) {
    res.status(404).json({ error: `Unknown tenant: ${tenantId}` });
    return;
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.status(200).json(tenantResponse);
}
