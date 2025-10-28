import http from 'node:http';
import { createHmac } from 'node:crypto';
import { tenants, type ManifestMode, type TenantDescriptor } from './data.js';

const port = Number.parseInt(process.env.CONFIG_PORT ?? '4001', 10);
const host = process.env.CONFIG_HOST ?? 'config.localhost';
const signingSecret = process.env.CONFIG_SIGNING_SECRET ?? 'insecure-development-secret';

function buildSignature(payload: string): string {
  return createHmac('sha256', signingSecret).update(payload).digest('base64');
}

function formatResponse(tenant: TenantDescriptor, mode: ManifestMode) {
  const config = {
    tenantId: tenant.tenantId,
    apiBaseUrl: tenant.apiBaseUrl,
    manifests: tenant.manifests,
    activeMode: mode,
    embed: {
      manifestUrl: tenant.manifests[mode],
      cdnOrigin: tenant.cdnOrigin
    }
  };
  const body = JSON.stringify({ config, signature: buildSignature(JSON.stringify(config)) });
  return body;
}

function sendJson(res: http.ServerResponse, status: number, body: string) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Timing-Allow-Origin': '*'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const method = req.method ?? 'GET';
  if (method === 'OPTIONS') {
    sendJson(res, 204, '');
    return;
  }

  if (method !== 'GET') {
    res.writeHead(405, { Allow: 'GET,OPTIONS' });
    res.end();
    return;
  }

  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? `${host}:${port}`}`);
  if (requestUrl.pathname === '/healthz') {
    sendJson(res, 200, JSON.stringify({ status: 'ok' }));
    return;
  }

  const match = requestUrl.pathname.match(/^\/tenants\/([\w-]+)\.json$/u);
  if (!match) {
    sendJson(res, 404, JSON.stringify({ error: 'Not found' }));
    return;
  }

  const tenantId = match[1];
  const tenant = tenants[tenantId];
  if (!tenant) {
    sendJson(res, 404, JSON.stringify({ error: `Unknown tenant: ${tenantId}` }));
    return;
  }

  const mode = (requestUrl.searchParams.get('mode') as ManifestMode | null) ?? 'beta';
  const resolvedMode: ManifestMode = mode === 'prod' ? 'prod' : 'beta';
  const body = formatResponse(tenant, resolvedMode);
  sendJson(res, 200, body);
});

server.listen(port, host, () => {
  console.log(`Config service listening on http://${host}:${port}`);
});
