import { createHmac } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTenant, type ManifestMode } from '../../../src/config/tenants';

type ConfigPayload = {
  tenant: string;
  mode: ManifestMode;
  apiBase: string;
  manifestUrl: string;
  embed: { src: string };
  cdnOrigin: string;
  manifests: Record<ManifestMode, string>;
};

function resolveMode(modeParam: unknown): ManifestMode {
  if (modeParam === 'prod') return 'prod';
  return 'beta';
}

function buildPayload(tenantId: string, mode: ManifestMode): ConfigPayload | null {
  const tenant = getTenant(tenantId);
  if (!tenant) return null;

  const manifestUrl = tenant.manifests[mode];
  const embed = tenant.embed[mode];

  return {
    tenant: tenant.tenantId,
    mode,
    apiBase: tenant.apiBaseUrl,
    manifestUrl,
    embed: {
      src: embed.src
    },
    cdnOrigin: tenant.cdnOrigin,
    manifests: tenant.manifests
  } satisfies ConfigPayload;
}

function getSigningSecret(): string | null {
  const secret = process.env.CONFIG_SIGNING_SECRET;
  if (typeof secret !== 'string' || secret.trim().length === 0) {
    return null;
  }
  return secret;
}

function signPayload(payload: ConfigPayload): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;
  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', secret).update(body).digest('base64');
  return signature;
}

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Timing-Allow-Origin', '*');
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET,OPTIONS');
    res.status(405).end();
    return;
  }

  const tenantIdParam = req.query.tenant;
  const tenantId = Array.isArray(tenantIdParam) ? tenantIdParam[0] : tenantIdParam;
  if (!tenantId) {
    res.status(404).json({ error: 'tenant_not_found' });
    return;
  }

  const modeParam = Array.isArray(req.query.mode) ? req.query.mode[0] : req.query.mode;
  const mode = resolveMode(modeParam);

  const payload = buildPayload(tenantId, mode);
  if (!payload) {
    res.status(404).json({ error: `Unknown tenant: ${tenantId}` });
    return;
  }

  const signature = signPayload(payload);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.status(200).json({ config: payload, signature });
}
