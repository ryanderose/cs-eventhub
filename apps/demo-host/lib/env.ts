export type EmbedMode = 'linked' | 'external';

export function getEmbedMode(): EmbedMode {
  const mode = (process.env.NEXT_PUBLIC_EMBED_MODE ?? 'linked').toLowerCase();
  return mode === 'external' ? 'external' : 'linked';
}

export function getEmbedSrc(): string {
  return process.env.NEXT_PUBLIC_EMBED_SRC ?? '';
}

export function getConfigUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_CONFIG_URL || undefined;
}

const DEFAULT_API_BASE = 'http://localhost:4000';

export function getApiBase(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE?.trim() ||
    DEFAULT_API_BASE;
  return base.replace(/\/+$/, '');
}

export function getPlanMode(): string {
  return process.env.NEXT_PUBLIC_PLAN_MODE ?? 'beta';
}

export function getPreviewUrl(): string | undefined {
  return process.env.PREVIEW_URL?.trim() || process.env.NEXT_PUBLIC_PREVIEW_URL?.trim() || undefined;
}
