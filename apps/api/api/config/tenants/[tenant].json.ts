import { createHmac } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTenantDescriptor,
  type ManifestMode,
  type TenantManifest
} from '../../../src/config/tenants';

export const config = {
  runtime: 'nodejs20.x'
};

function readMode(request: VercelRequest): ManifestMode {
  const value = typeof request.query.mode === 'string' ? request.query.mode : undefined;
  return value === 'prod' ? 'prod' : 'beta';
}

function buildPayload(tenantId: string, manifest: TenantManifest, apiBaseUrl: string) {
  return {
    tenant: tenantId,
    apiBase: apiBaseUrl,
    manifestUrl: manifest.manifestUrl,
    embed: {
      src: manifest.embedSrc
    }
  };
}

function maybeSignPayload(payload: unknown): string | null {
  const secret = process.env.CONFIG_SIGNING_SECRET;
  if (!secret) return null;
  const body = JSON.stringify(payload);
  return createHmac('sha256', secret).update(body).digest('base64');
}

function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Timing-Allow-Origin', '*');
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'OPTIONS') {
    applyCors(response);
    response.status(204).end();
    return;
  }

  if (request.method !== 'GET') {
    response.status(405).setHeader('Allow', 'GET,OPTIONS').end();
    return;
  }

  const tenantId = typeof request.query.tenant === 'string' ? request.query.tenant : '';
  const descriptor = getTenantDescriptor(tenantId);

  if (!descriptor) {
    applyCors(response);
    response.status(404).json({ error: 'unknown_tenant', tenant: tenantId });
    return;
  }

  const mode = readMode(request);
  const manifest = descriptor.manifests[mode] ?? descriptor.manifests.beta;
  const payload = buildPayload(descriptor.tenantId, manifest, descriptor.apiBaseUrl);
  const signature = maybeSignPayload(payload);

  applyCors(response);
  response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
  if (signature) {
    response.json({ ...payload, signature });
  } else {
    response.json(payload);
  }
}
