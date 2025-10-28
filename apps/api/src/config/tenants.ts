import { createHmac } from 'node:crypto';

export type ManifestMode = 'beta' | 'prod';

export type TenantDescriptor = {
  tenantId: string;
  apiBaseUrl: string;
  manifests: Record<ManifestMode, string>;
  embed: Record<ManifestMode, string>;
};

type TenantResponse = {
  config: {
    tenant: string;
    apiBase: string;
    manifestUrl: string;
    embed: {
      src: string;
    };
  };
  signature?: string;
};

const defaultApiBase = process.env.CONFIG_API_BASE ?? 'https://api.townthink.com';
const defaultEmbedManifest = process.env.CONFIG_EMBED_MANIFEST ??
  'https://cdn.townthink.com/hub-embed@latest/manifest.json';
const defaultEmbedSrc = process.env.CONFIG_EMBED_SRC ??
  'https://cdn.townthink.com/hub-embed@latest/hub-embed.umd.js';

const betaManifest = process.env.CONFIG_BETA_MANIFEST ?? defaultEmbedManifest;
const prodManifest = process.env.CONFIG_PROD_MANIFEST ?? defaultEmbedManifest;
const betaEmbed = process.env.CONFIG_BETA_EMBED ?? defaultEmbedSrc;
const prodEmbed = process.env.CONFIG_PROD_EMBED ?? defaultEmbedSrc;

const tenants: Record<string, TenantDescriptor> = {
  demo: {
    tenantId: 'demo',
    apiBaseUrl: defaultApiBase,
    manifests: {
      beta: betaManifest,
      prod: prodManifest
    },
    embed: {
      beta: betaEmbed,
      prod: prodEmbed
    }
  }
};

function buildSignature(payload: string): string | undefined {
  const secret = process.env.CONFIG_SIGNING_SECRET;
  if (!secret) return undefined;
  return createHmac('sha256', secret).update(payload).digest('base64');
}

export function resolveTenantResponse(tenantId: string, mode: ManifestMode): TenantResponse | undefined {
  const tenant = tenants[tenantId];
  if (!tenant) return undefined;

  const manifestUrl = tenant.manifests[mode] ?? tenant.manifests.beta;
  const embedSrc = tenant.embed[mode] ?? tenant.embed.beta;

  const config = {
    tenant: tenant.tenantId,
    apiBase: tenant.apiBaseUrl,
    manifestUrl,
    embed: {
      src: embedSrc
    }
  } as const;

  const payload = JSON.stringify(config);
  const signature = buildSignature(payload);

  return signature ? { config, signature } : { config };
}

export function getAllowedManifestMode(value: string | undefined | null): ManifestMode {
  if (value === 'prod') return 'prod';
  return 'beta';
}
