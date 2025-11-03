import { createHmac } from 'node:crypto';
import { getTenant, type ManifestMode } from '../config/tenants';
import type { ApiRequest, ApiResponse } from './types';

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

function setCorsHeaders(res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Timing-Allow-Origin', '*');
}

function lookupQuery(req: ApiRequest, key: string): unknown {
  const query = (req as any).query ?? {};
  if (Object.prototype.hasOwnProperty.call(query, key)) {
    return query[key];
  }
  const params = (req as any).params ?? {};
  if (Object.prototype.hasOwnProperty.call(params, key)) {
    return params[key];
  }
  return undefined;
}

export function handleTenantConfig(req: ApiRequest, res: ApiResponse): void {
  setCorsHeaders(res);

  const method = (req.method ?? 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    res.status(204);
    if (typeof (res as any).end === 'function') {
      (res as any).end();
    }
    return;
  }

  if (method !== 'GET') {
    res.setHeader('Allow', 'GET,OPTIONS');
    res.status(405);
    if (typeof (res as any).end === 'function') {
      (res as any).end();
    }
    return;
  }

  const tenantIdRaw = lookupQuery(req, 'tenant');
  const tenantId = Array.isArray(tenantIdRaw)
    ? tenantIdRaw[0]
    : tenantIdRaw != null
      ? String(tenantIdRaw)
      : undefined;
  if (!tenantId) {
    res.status(404).json({ error: 'tenant_not_found' });
    return;
  }

  const modeParam = lookupQuery(req, 'mode');
  const mode = resolveMode(Array.isArray(modeParam) ? modeParam[0] : modeParam);

  const payload = buildPayload(tenantId, mode);
  if (!payload) {
    res.status(404).json({ error: `Unknown tenant: ${tenantId}` });
    return;
  }

  const signature = signPayload(payload);
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.status(200).json({ config: payload, signature });
}
