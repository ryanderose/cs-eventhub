import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

const DEFAULT_TENANT = process.env.DEMO_DEFAULT_TENANT ?? process.env.ADMIN_DEFAULT_TENANT ?? 'demo';
const CONFIGURED_API_BASE =
  process.env.DEMO_API_BASE ??
  process.env.ADMIN_API_BASE ??
  process.env.API_BASE ??
  process.env.PREVIEW_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  null;

function sanitizeHost(host?: string | null): string | null {
  if (!host) return null;
  const trimmed = host.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^https?:\/\//i, '').split(':')[0] ?? null;
}

function deriveApiBaseFromHost(host?: string | null): string | null {
  const sanitized = sanitizeHost(host);
  if (!sanitized) return null;
  const lower = sanitized.toLowerCase();
  if (!lower.startsWith('demo-host')) {
    return null;
  }
  return `https://${sanitized.replace(/^demo-host/i, 'api')}`;
}

function resolveApiBase(request: NextRequest): string {
  if (CONFIGURED_API_BASE) {
    return CONFIGURED_API_BASE;
  }
  const derived = deriveApiBaseFromHost(request.headers.get('host'));
  if (derived) {
    return derived;
  }
  const fallbackFromVercel = deriveApiBaseFromHost(process.env.VERCEL_URL);
  if (fallbackFromVercel) {
    return fallbackFromVercel;
  }
  return 'http://localhost:4000';
}

function buildApiUrl(request: NextRequest): URL {
  const url = new URL('/v1/plan/default', resolveApiBase(request));
  const tenantId = request.nextUrl.searchParams.get('tenantId') ?? DEFAULT_TENANT;
  url.searchParams.set('tenantId', tenantId);
  return url;
}

function resolveBypassToken() {
  return (
    process.env.DEMO_API_BYPASS_TOKEN ??
    process.env.ADMIN_API_BYPASS_TOKEN ??
    process.env.VERCEL_PROTECTION_BYPASS_DEMO ??
    process.env.VERCEL_PROTECTION_BYPASS_API ??
    process.env.VERCEL_PROTECTION_BYPASS ??
    null
  );
}

function resolveBypassSignature() {
  return (
    process.env.DEMO_API_BYPASS_SIGNATURE ??
    process.env.ADMIN_API_BYPASS_SIGNATURE ??
    process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE_DEMO ??
    process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE_API ??
    process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE ??
    null
  );
}

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }

  const bypassToken = resolveBypassToken();
  if (bypassToken) {
    headers.set('x-vercel-protection-bypass', bypassToken);
  }

  const bypassSignature = resolveBypassSignature();
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
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('transfer-encoding');

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
