import { PageDoc } from '@events-hub/page-schema';

const rawEndpoint = process.env.NEXT_PUBLIC_DEFAULT_PLAN_ENDPOINT?.trim();
const DEFAULT_PLAN_ENDPOINT = rawEndpoint && rawEndpoint.length ? rawEndpoint : '/api/default-plan';
const DEFAULT_SERVER_ORIGIN =
  process.env.ADMIN_SELF_ORIGIN ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

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

const ABSOLUTE_ENDPOINT_PATTERN = /^https?:\/\//i;

function withSearchParams(url: URL, searchParams?: Record<string, string | undefined>): string {
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function buildUrl(searchParams?: Record<string, string | undefined>): string {
  if (typeof window !== 'undefined') {
    const url = ABSOLUTE_ENDPOINT_PATTERN.test(DEFAULT_PLAN_ENDPOINT)
      ? new URL(DEFAULT_PLAN_ENDPOINT)
      : new URL(DEFAULT_PLAN_ENDPOINT, window.location.origin);
    return withSearchParams(url, searchParams);
  }

  if (ABSOLUTE_ENDPOINT_PATTERN.test(DEFAULT_PLAN_ENDPOINT)) {
    return withSearchParams(new URL(DEFAULT_PLAN_ENDPOINT), searchParams);
  }

  return withSearchParams(new URL(DEFAULT_PLAN_ENDPOINT, DEFAULT_SERVER_ORIGIN), searchParams);
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

export async function fetchDefaultPlan(init?: RequestInit): Promise<DefaultPlanResponse> {
  const requestInit: RequestInit = {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {})
    }
  };
  if (typeof window === 'undefined') {
    (requestInit as RequestInit & { next?: { revalidate: number } }).next = { revalidate: 0 };
  }
  const response = await fetch(buildUrl(), requestInit);
  return handleResponse(response);
}

export async function saveDefaultPlan(plan: PageDoc): Promise<DefaultPlanResponse> {
  const response = await fetch(buildUrl(), {
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
