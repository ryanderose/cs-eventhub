import type { PageDoc } from '@events-hub/page-schema';

function toBase64Url(input: string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '==='.slice((normalized.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function encodePlan(page: PageDoc): string {
  const json = JSON.stringify(page);
  return toBase64Url(json);
}

export function decodePlan(plan: string): PageDoc {
  const json = fromBase64Url(plan);
  return JSON.parse(json);
}

export function resolvePlanFromUrl(searchParams: URLSearchParams): string | undefined {
  return searchParams.get('plan') ?? searchParams.get('p') ?? undefined;
}

export function canonicalizePath(path: string): string {
  return path.replace(/\/+/, '/');
}
