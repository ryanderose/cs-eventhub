import { NextRequest, NextResponse } from 'next/server';
import { getSnippetManifests, resolveCdnOrigin } from '../../../lib/embed-manifest';
import type { SnippetListResponse } from '../../../lib/snippet-types';

export const runtime = 'nodejs';
export const revalidate = 0;

const DEFAULT_TENANT = process.env.ADMIN_DEFAULT_TENANT ?? 'demo';
const DEFAULT_BASE_PATH = process.env.ADMIN_DEFAULT_BASE_PATH ?? '/events';

export async function GET(_request: NextRequest) {
  try {
    const cdnOrigin = resolveCdnOrigin();
    const manifests = await getSnippetManifests({ cdnOrigin });
    const payload: SnippetListResponse = {
      manifests,
      defaults: {
        tenantId: DEFAULT_TENANT,
        basePath: DEFAULT_BASE_PATH,
        cdnOrigin: cdnOrigin || undefined
      }
    };
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('[snippet.manifests] Failed to read embed manifests', error);
    return NextResponse.json(
      { error: 'embed_manifest_unavailable' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405 });
}
