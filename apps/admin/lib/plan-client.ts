import { PageDoc } from '@events-hub/page-schema';

const rawClientEndpoint = process.env.NEXT_PUBLIC_DEFAULT_PLAN_ENDPOINT?.trim();
const CLIENT_PLAN_ENDPOINT =
  rawClientEndpoint && rawClientEndpoint.length ? rawClientEndpoint : '/api/default-plan';

const SERVER_API_BASE =
  process.env.ADMIN_API_BASE ??
  process.env.API_BASE ??
  process.env.PREVIEW_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000';

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

function buildServerUrl(path: string): string {
  const url = new URL(path, SERVER_API_BASE);
  url.searchParams.set('tenantId', 'demo');
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

export async function fetchDefaultPlan(init?: RequestInit): Promise<DefaultPlanResponse> {
  if (typeof window === 'undefined') {
    const response = await fetch(buildServerUrl('/v1/plan/default'), {
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

export async function saveDefaultPlan(plan: PageDoc): Promise<DefaultPlanResponse> {
  if (typeof window === 'undefined') {
    const response = await fetch(buildServerUrl('/v1/plan/default'), {
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
