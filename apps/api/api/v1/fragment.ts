export const config = { runtime: 'edge' };

type FragmentCspOptions = {
  scriptSrc?: string[];
  styleSrc?: string[];
  connectSrc?: string[];
  styleHashes?: string[];
  fontSrc?: string[];
};

function buildFragmentCsp({
  scriptSrc = [],
  styleSrc = [],
  connectSrc = [],
  styleHashes = [],
  fontSrc = []
}: FragmentCspOptions): string {
  const directives: string[] = [];
  directives.push("default-src 'self'");
  directives.push(["script-src 'self'", ...scriptSrc].join(' '));
  const styleParts = ["style-src 'self'"].concat(styleHashes.map((hash) => `'${hash}'`)).concat(styleSrc);
  directives.push(styleParts.join(' '));
  directives.push(["connect-src 'self'", ...connectSrc].join(' '));
  directives.push(["font-src 'self'", ...fontSrc].join(' '));
  directives.push("img-src 'self' data:");
  directives.push("frame-ancestors 'none'");
  directives.push("object-src 'none'");
  directives.push("base-uri 'none'");
  return directives.join('; ');
}

function fragmentResponse(html: string, options: FragmentCspOptions) {
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': buildFragmentCsp(options)
  });
  return new Response(html, { status: 200, headers });
}

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

  // Support JSON responses when explicitly requested via Accept header.
  // This allows hosts (apps/demo-host) to proxy fragments for SEO easily
  // without changing the default HTML fragment behaviour.
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (accept.includes('application/json')) {
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
    headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
    headers.set('X-Fragment-Tenant', tenantId);
    return new Response(JSON.stringify({ html, styles: { css: '' } }), {
      status: 200,
      headers
    });
  }

  const response = fragmentResponse(html, { scriptSrc: [], styleSrc: [] });
  response.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
  response.headers.set('X-Fragment-Tenant', tenantId);
  return response;
}
