export type ManifestMode = 'beta' | 'prod';

export type TenantDescriptor = {
  tenantId: string;
  apiBaseUrl: string;
  manifests: Record<ManifestMode, string>;
  cdnOrigin: string;
  embed: Record<ManifestMode, string>;
};

const localCdn = process.env.CONFIG_LOCAL_CDN ?? 'http://cdn.localhost:5050';
const cdnOrigin = process.env.CONFIG_CDN_ORIGIN ?? 'https://cdn.townthink.com';
const packageName = process.env.CONFIG_PACKAGE_NAME ?? 'hub-embed';
const betaManifest =
  process.env.CONFIG_BETA_MANIFEST ?? `${localCdn}/${packageName}@latest/manifest.json`;
const prodManifest =
  process.env.CONFIG_PROD_MANIFEST ?? `${cdnOrigin}/${packageName}@latest/manifest.json`;
const betaEmbedSrc =
  process.env.CONFIG_BETA_EMBED_SRC ?? `${localCdn}/${packageName}@latest/${packageName}.umd.js`;
const prodEmbedSrc =
  process.env.CONFIG_PROD_EMBED_SRC ?? `${cdnOrigin}/${packageName}@latest/${packageName}.umd.js`;
const apiBase = process.env.CONFIG_API_BASE ?? 'https://api.townthink.com';

export const tenants: Record<string, TenantDescriptor> = {
  demo: {
    tenantId: 'demo',
    apiBaseUrl: apiBase,
    manifests: {
      beta: betaManifest,
      prod: prodManifest
    },
    cdnOrigin,
    embed: {
      beta: betaEmbedSrc,
      prod: prodEmbedSrc
    }
  }
};
