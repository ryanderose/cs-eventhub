const DEFAULT_API_BASE = 'http://localhost:4000';
const DEFAULT_TENANT = 'demo';

export function getApiBase(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE?.trim() ||
    DEFAULT_API_BASE;
  return base.replace(/\/+$/, '');
}

export function getDefaultTenant(): string {
  return process.env.NEXT_PUBLIC_TENANT?.trim() || DEFAULT_TENANT;
}

export function getPreviewUrl(): string | undefined {
  return process.env.PREVIEW_URL?.trim() || process.env.NEXT_PUBLIC_PREVIEW_URL?.trim() || undefined;
}
