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

export function getApiBase(): string | undefined {
  return process.env.NEXT_PUBLIC_API_BASE || undefined;
}

export function getPlanMode(): string {
  return process.env.NEXT_PUBLIC_PLAN_MODE ?? 'beta';
}
