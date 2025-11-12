import { PageDoc } from '@events-hub/page-schema';
import type { SnippetListResponse } from './snippet-types';

const rawClientEndpoint = process.env.NEXT_PUBLIC_DEFAULT_PLAN_ENDPOINT?.trim();
const CLIENT_PLAN_ENDPOINT =
  rawClientEndpoint && rawClientEndpoint.length ? rawClientEndpoint : '/api/default-plan';
const CLIENT_SNIPPET_ENDPOINT = '/api/snippet';

const ENV_SERVER_API_BASE =
  process.env.ADMIN_API_BASE ??
  process.env.API_BASE ??
  process.env.PREVIEW_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  null;

const DEFAULT_LOCAL_API_BASE = 'http://localhost:4000';
const DEFAULT_TENANT = process.env.ADMIN_DEFAULT_TENANT ?? 'demo';

const SERVER_BYPASS_TOKEN =
  process.env.ADMIN_API_BYPASS_TOKEN ??
  process.env.VERCEL_PROTECTION_BYPASS_API ??
  process.env.VERCEL_PROTECTION_BYPASS ??
  '';

const SERVER_BYPASS_SIGNATURE =
  process.env.ADMIN_API_BYPASS_SIGNATURE ??
  process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE_API ??
  process.env.VERCEL_PROTECTION_BYPASS_SIGNATURE ??
  '';

export type DefaultPlanResponse = {
  plan: PageDoc;
  encodedPlan: string;
  planHash: string;
  updatedAt: string;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type ServerRequestContext = {
  serverHost?: string | null;
  tenantId?: string;
};

function sanitizeHost(host?: string | null): string | null {
  if (!host) return null;
  const trimmed = host.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^https?:\/\//i, '');
}

function deriveApiBaseFromHost(host?: string | null): string | null {
  const sanitized = sanitizeHost(host);
  if (!sanitized) return null;
  const [hostname] = sanitized.split(':');
  if (!hostname) return null;

  if (/^admin\./i.test(hostname)) {
    return `https://${hostname.replace(/^admin\./i, 'api.')}`;
  }
  if (/^admin-/i.test(hostname)) {
    return `https://${hostname.replace(/^admin-/i, 'api-')}`;
  }
  return null;
}

function resolveServerApiBase(serverHost?: string | null): string {
  if (ENV_SERVER_API_BASE) {
    return ENV_SERVER_API_BASE;
  }
  const derivedFromHost = deriveApiBaseFromHost(serverHost);
  if (derivedFromHost) {
    return derivedFromHost;
  }
  const derivedFromVercel = deriveApiBaseFromHost(process.env.VERCEL_URL);
  if (derivedFromVercel) {
    return derivedFromVercel;
  }
  return DEFAULT_LOCAL_API_BASE;
}

function buildServerUrl(path: string, context?: ServerRequestContext): string {
  const url = new URL(path, resolveServerApiBase(context?.serverHost));
  url.searchParams.set('tenantId', context?.tenantId ?? DEFAULT_TENANT);
  return url.toString();
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function handleResponse(response: Response) {
  if (response.ok) {
    return (await readJson(response)) as DefaultPlanResponse;
  }
  const payload = await readJson(response);
  throw new ApiError(response.status, response.statusText, payload);
}

function serverHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set('accept', 'application/json');
  if (SERVER_BYPASS_TOKEN) {
    headers.set('x-vercel-protection-bypass', SERVER_BYPASS_TOKEN);
  }
  if (SERVER_BYPASS_SIGNATURE) {
    headers.set('x-vercel-protection-bypass-signature', SERVER_BYPASS_SIGNATURE);
  }
  return headers;
}

export async function fetchDefaultPlan(
  init?: RequestInit,
  context?: ServerRequestContext
): Promise<DefaultPlanResponse> {
  if (typeof window === 'undefined') {
    const response = await fetch(buildServerUrl('/v1/plan/default', context), {
      ...init,
      cache: 'no-store',
      headers: serverHeaders(init?.headers)
    });
    return handleResponse(response);
  }

  const response = await fetch(CLIENT_PLAN_ENDPOINT, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {})
    }
  });
  return handleResponse(response);
}

export async function saveDefaultPlan(
  plan: PageDoc,
  context?: ServerRequestContext
): Promise<DefaultPlanResponse> {
  if (typeof window === 'undefined') {
    const response = await fetch(buildServerUrl('/v1/plan/default', context), {
      method: 'PUT',
      cache: 'no-store',
      headers: serverHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({ plan })
    });
    return handleResponse(response);
  }

  const response = await fetch(CLIENT_PLAN_ENDPOINT, {
    method: 'PUT',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ plan })
  });
  return handleResponse(response);
}

async function handleSnippetResponse(response: Response) {
  if (response.ok) {
    return (await response.json()) as SnippetListResponse;
  }
  const payload = await readJson(response);
  throw new ApiError(response.status, response.statusText, payload);
}

export async function fetchSnippetList(init?: RequestInit): Promise<SnippetListResponse> {
  const response = await fetch(CLIENT_SNIPPET_ENDPOINT, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {})
    }
  });
  return handleSnippetResponse(response);
}
