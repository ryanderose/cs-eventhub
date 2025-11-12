export type BundleLimitStat = {
  gzipBytes: number;
  limitBytes: number;
  ok: boolean;
};

export type BundlePhaseReport = {
  esm: BundleLimitStat;
  umd: BundleLimitStat;
  block: BundleLimitStat;
};

export type BundleReport = {
  phaseA: BundlePhaseReport;
  phaseB: BundlePhaseReport;
};

export type SnippetAsset = {
  filename: string;
  path: string;
  url: string;
  kind: 'esm' | 'umd' | 'css' | 'asset';
  entry?: boolean;
  integrity: string;
  size: number;
  gzipSize?: number;
};

export type SnippetScripts = {
  module: string;
  nomodule: string;
  styles: string[];
};

export type SnippetManifestSummary = {
  id: string;
  version: string;
  label: string;
  cdnBasePath: string;
  generatedAt: string;
  status: 'ready' | 'invalid';
  errors: string[];
  warnings: string[];
  assets: SnippetAsset[];
  bundleReport?: BundleReport;
  scripts?: SnippetScripts;
};

export type SnippetListResponse = {
  manifests: SnippetManifestSummary[];
  defaults: {
    tenantId: string;
    basePath: string;
    cdnOrigin?: string;
  };
};
