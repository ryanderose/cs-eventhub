import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

const DEFAULT_TENANT = process.env.ADMIN_DEFAULT_TENANT ?? 'demo';
const CONFIGURED_API_BASE =
  process.env.ADMIN_API_BASE ??
  process.env.API_BASE ??
  process.env.PREVIEW_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  null;

function deriveApiBaseFromHost(host?: string | null): string | null {
  if (!host) return null;
  if (!host.toLowerCase().startsWith('admin')) return null;
  return `https://${host.replace(/^admin/i, 'api')}`;
}

function resolveApiBase(request: NextRequest): string {
  if (CONFIGURED_API_BASE) {
    return CONFIGURED_API_BASE;
  }
  const derived = deriveApiBaseFromHost(request.headers.get('host'));
  if (derived) {
    return derived;
  }
  return 'http://localhost:4000';
}

function buildApiUrl(request: NextRequest): URL {
  const url = new URL('/v1/plan/default', resolveApiBase(request));
  const tenantId = request.nextUrl.searchParams.get('tenantId') ?? DEFAULT_TENANT;
  url.searchParams.set('tenantId', tenantId);
  return url;
}

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }

  const bypassToken =
    process.env.ADMIN_API_BYPASS_TOKEN ??
    process.env.VERCEL_PROTECTION_BYPASS_API ??
    process.env.VERCEL_PROTECTION_BYPASS;

  if (bypassToken) {
    headers.set('x-vercel-protection-bypass', bypassToken);
  }

  const bypassSignature =
    process.env.ADMIN_API_BYPASS_SIGNATURE ??
    process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE_API ??
    process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE;

  if (bypassSignature) {
    headers.set('x-vercel-protection-bypass-signature', bypassSignature);
  }

  return headers;
}

async function proxyToApi(request: NextRequest, init: RequestInit): Promise<NextResponse> {
  const apiUrl = buildApiUrl(request);
  const response = await fetch(apiUrl, {
    ...init,
    headers: buildHeaders(init.headers),
    cache: 'no-store'
  });

  const bufferedBody = Buffer.from(await response.arrayBuffer());
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    headers.set(key, value);
  });

  return new NextResponse(bufferedBody, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export async function GET(request: NextRequest) {
  return proxyToApi(request, { method: 'GET' });
}

export async function PUT(request: NextRequest) {
  const body = await request.text();
  return proxyToApi(request, {
    method: 'PUT',
    body,
    headers: {
      'content-type': request.headers.get('content-type') ?? 'application/json'
    }
  });
}
