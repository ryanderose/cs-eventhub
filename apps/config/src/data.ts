export type ManifestMode = 'beta' | 'prod';

export type TenantDescriptor = {
  tenantId: string;
  apiBaseUrl: string;
  manifests: Record<ManifestMode, string>;
  cdnOrigin: string;
};

const localCdn = process.env.CONFIG_LOCAL_CDN ?? 'http://cdn.localhost:5050';
const betaManifest = process.env.CONFIG_BETA_MANIFEST ?? `${localCdn}/manifest/latest.json`;
const prodManifest = process.env.CONFIG_PROD_MANIFEST ?? 'https://cdn.events-hub.com/hub-embed/latest.json';
const apiBase = process.env.CONFIG_API_BASE ?? 'https://api.localhost:3000';

export const tenants: Record<string, TenantDescriptor> = {
  demo: {
    tenantId: 'demo',
    apiBaseUrl: apiBase,
    manifests: {
      beta: betaManifest,
      prod: prodManifest
    },
    cdnOrigin: localCdn
  }
};
