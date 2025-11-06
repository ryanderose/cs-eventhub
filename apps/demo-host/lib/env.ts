export type EmbedMode = 'linked' | 'external';

const DEFAULT_TENANT = (process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? 'demo').trim() || 'demo';
const DEMO_HOST_PREFIX = 'demo-host';

type HostOptions = {
  host?: string | null;
};

type ConfigOptions = HostOptions & { tenantId?: string };

function sanitizeHost(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const [hostname] = withoutProtocol.split(/[/:]/);
  if (!hostname) return null;
  return hostname.toLowerCase();
}

function isLocalHost(host?: string | null): boolean {
  const normalized = sanitizeHost(host);
  if (!normalized) return false;
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.startsWith('127.') ||
    normalized.startsWith('0.0.0.0')
  );
}

function isLocalUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return isLocalHost(parsed.hostname);
  } catch {
    return url.includes('localhost');
  }
}

function windowHost(): string | null {
  if (typeof window === 'undefined' || !window.location) {
    return null;
  }
  return window.location.host ?? null;
}

function findRemoteHost(explicitHost?: string | null): string | null {
  const candidates = [
    explicitHost,
    windowHost(),
    process.env.NEXT_PUBLIC_DEMO_HOSTNAME,
    process.env.VERCEL_URL
  ];
  for (const candidate of candidates) {
    const normalized = sanitizeHost(candidate);
    if (normalized && !isLocalHost(normalized)) {
      return normalized;
    }
  }
  return null;
}

function hostLooksLocal(explicitHost?: string | null): boolean {
  if (explicitHost) {
    return isLocalHost(explicitHost);
  }
  return isLocalHost(windowHost());
}

function deriveHost(host: string | null, targetPrefix: 'api' | 'config'): string | null {
  if (!host) return null;
  if (!host.startsWith(DEMO_HOST_PREFIX)) {
    return null;
  }
  const remainder = host.slice(DEMO_HOST_PREFIX.length);
  if (!remainder) {
    return targetPrefix;
  }
  if (remainder.startsWith('.')) {
    return `${targetPrefix}.${remainder.slice(1)}`;
  }
  return `${targetPrefix}${remainder}`;
}

function buildHttpsUrl(hostname: string | null): string | null {
  if (!hostname) return null;
  if (/^https?:\/\//i.test(hostname)) {
    return hostname;
  }
  return `https://${hostname}`;
}

export function getEmbedMode(): EmbedMode {
  const mode = (process.env.NEXT_PUBLIC_EMBED_MODE ?? 'linked').toLowerCase();
  return mode === 'external' ? 'external' : 'linked';
}

export function getEmbedSrc(): string {
  return process.env.NEXT_PUBLIC_EMBED_SRC ?? '';
}

export function getConfigUrl(options?: ConfigOptions): string | undefined {
  const envValue = process.env.NEXT_PUBLIC_CONFIG_URL?.trim();
  const hostIsLocal = hostLooksLocal(options?.host);
  if (envValue) {
    if (!isLocalUrl(envValue) || hostIsLocal) {
      return envValue;
    }
  }

  const tenantId = options?.tenantId?.trim() || DEFAULT_TENANT;
  const remoteHost = findRemoteHost(options?.host);
  const derivedHost = remoteHost ? deriveHost(remoteHost, 'config') : null;
  if (derivedHost) {
    const base = buildHttpsUrl(derivedHost);
    if (base) {
      return `${base}/config/tenants/${tenantId}.json`;
    }
  }
  return envValue || undefined;
}

export function getApiBase(options?: HostOptions): string | undefined {
  const envValue = process.env.NEXT_PUBLIC_API_BASE?.trim();
  const hostIsLocal = hostLooksLocal(options?.host);
  if (envValue) {
    if (!isLocalUrl(envValue) || hostIsLocal) {
      return envValue;
    }
  }

  const remoteHost = findRemoteHost(options?.host);
  const derivedHost = remoteHost ? deriveHost(remoteHost, 'api') : null;
  if (derivedHost) {
    const base = buildHttpsUrl(derivedHost);
    if (base) {
      return base;
    }
  }
  return envValue || undefined;
}

export function getPlanMode(): string {
  return process.env.NEXT_PUBLIC_PLAN_MODE ?? 'beta';
}

export { DEFAULT_TENANT };
