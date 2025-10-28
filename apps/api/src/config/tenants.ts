export type ManifestMode = 'beta' | 'prod';

export type TenantManifest = {
  manifestUrl: string;
  embedSrc: string;
};

export type TenantDescriptor = {
  tenantId: string;
  apiBaseUrl: string;
  cdnOrigin: string;
  manifests: Record<ManifestMode, TenantManifest>;
};

const DEFAULT_CDN_ORIGIN = process.env.CONFIG_CDN_ORIGIN ?? 'https://cdn.townthink.com';
const DEFAULT_API_BASE = process.env.CONFIG_API_BASE ?? 'https://api.townthink.com';
const DEFAULT_PACKAGE_NAME = process.env.CONFIG_PACKAGE_NAME ?? 'hub-embed';
const DEFAULT_STABLE_ALIAS = `${DEFAULT_CDN_ORIGIN}/${DEFAULT_PACKAGE_NAME}@latest`;

const DEFAULT_BETA_MANIFEST =
  process.env.CONFIG_BETA_MANIFEST ?? `${DEFAULT_STABLE_ALIAS}/manifest.json`;
const DEFAULT_BETA_EMBED_SRC =
  process.env.CONFIG_BETA_EMBED_SRC ?? `${DEFAULT_STABLE_ALIAS}/${DEFAULT_PACKAGE_NAME}.umd.js`;

const DEFAULT_PROD_MANIFEST =
  process.env.CONFIG_PROD_MANIFEST ?? DEFAULT_BETA_MANIFEST;
const DEFAULT_PROD_EMBED_SRC =
  process.env.CONFIG_PROD_EMBED_SRC ?? DEFAULT_BETA_EMBED_SRC;

const tenants: Record<string, TenantDescriptor> = {
  demo: {
    tenantId: 'demo',
    apiBaseUrl: DEFAULT_API_BASE,
    cdnOrigin: DEFAULT_CDN_ORIGIN,
    manifests: {
      beta: {
        manifestUrl: DEFAULT_BETA_MANIFEST,
        embedSrc: DEFAULT_BETA_EMBED_SRC
      },
      prod: {
        manifestUrl: DEFAULT_PROD_MANIFEST,
        embedSrc: DEFAULT_PROD_EMBED_SRC
      }
    }
  }
};

export function getTenantDescriptor(tenantId: string): TenantDescriptor | null {
  return tenants[tenantId] ?? null;
}
