import { NextResponse } from 'next/server';
import { defaultRevalidateSeconds, defaultStaleWhileRevalidateSeconds } from '../../../../lib/cache';
import { getApiBase } from '../../../../lib/env';

export const runtime = 'edge';
export const revalidate = defaultRevalidateSeconds;

type FragmentPayload = {
  html: string;
  css?: string;
  styles?: { css?: string };
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

export async function GET(request: Request, { params }: { params: { tenant: string } }) {
  const apiBase = getApiBase({ host: request.headers.get('host') });
  if (!apiBase) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_API_BASE is not configured.' }, { status: 500 });
  }

  const tenant = params?.tenant ?? 'demo';
  const url = `${normalizeApiBase(apiBase)}/v1/fragment/${tenant}`;

  const upstream = await fetch(url, {
    headers: {
      accept: 'application/json',
      'x-embed-config': request.headers.get('x-embed-config') ?? '',
      'x-forwarded-host': request.headers.get('host') ?? 'demo.localhost'
    },
    next: { revalidate: defaultRevalidateSeconds }
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: `Fragment request failed with status ${upstream.status}.` }, { status: upstream.status });
  }

  const payload = (await upstream.json()) as FragmentPayload;
  const css = payload.css ?? payload.styles?.css ?? '';
  const cssHash = css ? await hashCss(css) : '';

  const response = NextResponse.json(
    {
      html: payload.html,
      css,
      cssHash
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

  return response;
}
