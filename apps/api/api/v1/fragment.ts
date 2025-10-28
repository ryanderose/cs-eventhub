import { fragmentResponse } from '../../src/lib/csp';

export const config = { runtime: 'edge' };

function extractTenantId(url: URL): string {
  return (
    url.searchParams.get('tenantId') ??
    url.pathname.split('/').filter(Boolean).pop() ??
    'demo'
  );
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const tenantId = extractTenantId(new URL(request.url));
  const html = `<div data-tenant="${tenantId}">Fragment placeholder</div>`;
  const response = fragmentResponse(html, { scriptSrc: [], styleSrc: [] });
  response.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
  response.headers.set('X-Fragment-Tenant', tenantId);
  return response;
}
