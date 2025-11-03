import { PageDoc } from '@events-hub/page-schema';

const DEFAULT_API_BASE = 'http://localhost:4000';

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

function getApiBase(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_BASE
  ];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return DEFAULT_API_BASE;
}

function buildUrl(path: string, searchParams?: Record<string, string | undefined>): string {
  const url = new URL(path, getApiBase());
  url.searchParams.set('tenantId', 'demo');
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
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
  const response = await fetch(buildUrl('/v1/plan/default'), requestInit);
  return handleResponse(response);
}

export async function saveDefaultPlan(plan: PageDoc): Promise<DefaultPlanResponse> {
  const response = await fetch(buildUrl('/v1/plan/default'), {
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
