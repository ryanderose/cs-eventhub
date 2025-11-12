import { NextResponse } from 'next/server';
import { defaultRevalidateSeconds, defaultStaleWhileRevalidateSeconds } from '../../../../lib/cache';
import { getApiBase } from '../../../../lib/env';
import type { JsonLdParityResult } from '../../../../lib/seoParity';

export const runtime = 'edge';
export const revalidate = defaultRevalidateSeconds;

type FragmentPayload = {
  html: string;
  css?: string;
  styles?: { css?: string };
  cssHash?: string;
  jsonLd?: string;
  parity?: JsonLdParityResult;
  noindex?: boolean;
  view?: 'list' | 'detail';
  slug?: string;
};

async function hashCss(css: string): Promise<string> {
  const encoded = new TextEncoder().encode(css);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(digest);
  let result = '';
  for (const byte of bytes) {
    result += byte.toString(16).padStart(2, '0');
  }
  return result;
}

function normalizeApiBase(base: string): string {
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function normalizeTenantId(value?: string | null): string {
  if (!value) {
    return 'demo';
  }
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || 'demo';
}

async function readUpstreamError(response: Response): Promise<string> {
  const baseMessage = `Fragment request failed with status ${response.status}`;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) {
        return `${baseMessage}: ${payload.error}`;
      }
    } catch {
      // fall through to text handling
    }
  }
  try {
    const text = await response.text();
    if (text.trim()) {
      return `${baseMessage}: ${text.trim()}`;
    }
  } catch {
    // ignore
  }
  return `${baseMessage}.`;
}

export async function GET(request: Request, { params }: { params: { tenant: string } }) {
  const apiBase = getApiBase({ host: request.headers.get('host') });
  if (!apiBase) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_API_BASE is not configured.' }, { status: 500 });
  }

  const currentUrl = new URL(request.url);
  const tenantParam = params?.tenant ?? currentUrl.searchParams.get('tenantId') ?? 'demo';
  const tenant = normalizeTenantId(tenantParam);
  const upstreamUrl = new URL(`${normalizeApiBase(apiBase)}/v1/fragment/${tenant}`);
  upstreamUrl.searchParams.set('tenantId', tenant);
  ['view', 'slug'].forEach((param) => {
    const value = currentUrl.searchParams.get(param);
    if (value) {
      upstreamUrl.searchParams.set(param, value);
    }
  });

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: {
      accept: 'application/json',
      'x-embed-config': request.headers.get('x-embed-config') ?? '',
      'x-forwarded-host': request.headers.get('host') ?? 'demo.localhost'
    },
    next: { revalidate: defaultRevalidateSeconds }
  });

  if (!upstream.ok) {
    const errorMessage = await readUpstreamError(upstream);
    return NextResponse.json({ error: errorMessage }, { status: upstream.status });
  }

  const payload = (await upstream.json()) as FragmentPayload;
  const css = payload.css ?? payload.styles?.css ?? '';
  const cssHash = css ? await hashCss(css) : '';
  const parity = payload.parity ?? null;
  const jsonLd = payload.jsonLd ?? '';
  const shouldNoIndex = payload.noindex === true || upstream.headers.get('x-robots-tag') === 'noindex';

  const response = NextResponse.json(
    {
      html: payload.html,
      css,
      cssHash,
      jsonLd,
      parity,
      noindex: shouldNoIndex
    },
    {
      status: 200
    }
  );

  const cacheControl = `s-maxage=${defaultRevalidateSeconds}, stale-while-revalidate=${defaultStaleWhileRevalidateSeconds}`;
  response.headers.set('Cache-Control', cacheControl);
  response.headers.set('Vary', 'Accept, Accept-Encoding');
  if (cssHash) {
    response.headers.set('X-Events-Hub-CSS-Hash', cssHash);
  }
  if (shouldNoIndex) {
    response.headers.set('X-Robots-Tag', 'noindex');
  }

  return response;
}
