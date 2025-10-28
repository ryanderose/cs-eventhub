import type { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = Number(process.env.DEFAULT_ISR_REVALIDATE ?? 300);

interface FragmentResponse {
  html: string;
  jsonLd?: Record<string, unknown> | null;
  criticalCss: string;
  deferredStylesheet?: string | null;
}

async function fetchFragment(tenant: string, route: string, signal: AbortSignal): Promise<FragmentResponse> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    throw new Error('NEXT_PUBLIC_API_BASE is not configured.');
  }

  const fragmentUrl = new URL(`/v1/fragment/${tenant}`, apiBase);
  fragmentUrl.searchParams.set('route', route);

  const response = await fetch(fragmentUrl, {
    headers: {
      Accept: 'application/json'
    },
    cache: 'force-cache',
    signal,
    next: {
      revalidate
    }
  });

  if (!response.ok) {
    throw new Error(`Fragment request failed with ${response.status}`);
  }

  return (await response.json()) as FragmentResponse;
}

function encodeBase64(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  if (typeof btoa === 'function') {
    return btoa(binary);
  }

  const BufferCtor = (globalThis as typeof globalThis & { Buffer?: typeof Buffer }).Buffer;
  if (BufferCtor) {
    return BufferCtor.from(bytes).toString('base64');
  }

  throw new Error('Unable to encode base64 in this runtime.');
}

async function hashCriticalCss(css: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(css);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  const base64 = encodeBase64(bytes);
  return `sha256-${base64}`;
}

export async function GET(request: NextRequest, { params }: { params: { tenant: string } }) {
  const { tenant } = params;
  const { searchParams } = new URL(request.url);
  const route = searchParams.get('route') ?? '/';

  try {
    const fragment = await fetchFragment(tenant, route, request.signal);
    const hash = await hashCriticalCss(fragment.criticalCss);

    return NextResponse.json(
      {
        html: fragment.html,
        jsonLd: fragment.jsonLd ?? null,
        criticalCss: {
          hash,
          content: fragment.criticalCss
        },
        deferredStylesheet: fragment.deferredStylesheet ?? null
      },
      {
        headers: {
          'cache-control': `s-maxage=${revalidate}, stale-while-revalidate=${Math.round(revalidate / 2)}`,
          'content-type': 'application/json; charset=utf-8'
        }
      }
    );
  } catch (error) {
    console.error('Failed to render fragment', error);
    return NextResponse.json(
      {
        error: 'fragment_error',
        message: (error as Error).message
      },
      {
        status: 502,
        headers: {
          'cache-control': 'no-store'
        }
      }
    );
  }
}
