export type ManifestMode = 'beta' | 'prod';

export type TenantDescriptor = {
  tenantId: string;
  apiBaseUrl: string;
  manifests: Record<ManifestMode, string>;
  embed: Record<ManifestMode, { src: string }>;
  cdnOrigin: string;
};

function readEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function buildTenants(): Record<string, TenantDescriptor> {
  const defaultCdnOrigin = readEnv('CONFIG_CDN_ORIGIN', 'https://cdn.townthink.com');
  const defaultManifest = `${defaultCdnOrigin}/hub-embed@latest/manifest.json`;
  const defaultEmbedSrc = `${defaultCdnOrigin}/hub-embed@latest/hub-embed.umd.js`;
  const betaManifest = readEnv('CONFIG_BETA_MANIFEST', defaultManifest);
  const prodManifest = readEnv('CONFIG_PROD_MANIFEST', defaultManifest);
  const betaEmbedSrc = readEnv('CONFIG_BETA_EMBED_SRC', defaultEmbedSrc);
  const prodEmbedSrc = readEnv('CONFIG_PROD_EMBED_SRC', defaultEmbedSrc);
  const defaultApiBase = readEnv('CONFIG_API_BASE', 'https://api.townthink.com');

  return {
    demo: {
      tenantId: 'demo',
      apiBaseUrl: defaultApiBase,
      manifests: {
        beta: betaManifest,
        prod: prodManifest
      },
      embed: {
        beta: { src: betaEmbedSrc },
        prod: { src: prodEmbedSrc }
      },
      cdnOrigin: defaultCdnOrigin
    }
  } satisfies Record<string, TenantDescriptor>;
}

export function getTenant(tenantId: string): TenantDescriptor | undefined {
  const tenants = buildTenants();
  return tenants[tenantId];
}

export function getTenants(): Record<string, TenantDescriptor> {
  return buildTenants();
}
