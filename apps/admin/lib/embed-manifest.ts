import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SnippetManifestSummary, SnippetAsset, SnippetScripts, BundleReport, BundlePhaseReport } from './snippet-types';

type RawManifestAsset = {
  path: string;
  filename: string;
  integrity: string;
  size: number;
  gzipSize?: number;
  kind?: string;
  entry?: boolean;
};

type RawManifest = {
  version?: string;
  cdnBasePath?: string;
  generatedAt?: string;
  assets?: RawManifestAsset[];
  bundleReport?: BundleReport;
};

const EMBED_DIR_PATTERN = /^hub-embed@[A-Za-z0-9._-]+$/;
const DEFAULT_BASE_PATHS = [
  process.env.EMBED_MANIFEST_ROOT,
  process.env.CDN_MANIFEST_ROOT,
  path.resolve(process.cwd(), 'apps/cdn/public'),
  path.resolve(process.cwd(), '../cdn/public'),
  path.resolve(process.cwd(), '../../apps/cdn/public')
].filter(Boolean) as string[];

let cachedRoot: string | null = null;

function isValidDirname(name: string): boolean {
  return EMBED_DIR_PATTERN.test(name);
}

async function pathExists(target: string): Promise<boolean> {
  try {
    const stats = await fs.stat(target);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function resolveManifestRoot(): Promise<string> {
  if (cachedRoot) {
    return cachedRoot;
  }
  for (const candidate of DEFAULT_BASE_PATHS) {
    const resolved = path.resolve(candidate);
    if (await pathExists(resolved)) {
      cachedRoot = resolved;
      return resolved;
    }
  }
  throw new Error('Embed manifest root not found. Set EMBED_MANIFEST_ROOT or run pnpm publish:embed.');
}

function fromEnv(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function deriveOriginFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export function resolveCdnOrigin(): string {
  return (
    fromEnv(process.env.ADMIN_EMBED_CDN_ORIGIN) ??
    fromEnv(process.env.NEXT_PUBLIC_EMBED_CDN_ORIGIN) ??
    deriveOriginFromUrl(fromEnv(process.env.NEXT_PUBLIC_EMBED_MANIFEST)) ??
    ''
  );
}

function buildAssetUrl(origin: string, assetPath: string): string {
  if (!assetPath.startsWith('/')) {
    return assetPath;
  }
  if (!origin) {
    return assetPath;
  }
  return `${origin}${assetPath}`;
}

function normalizeAssetKind(asset: RawManifestAsset): SnippetAsset['kind'] {
  if (asset.kind === 'esm' || asset.kind === 'umd' || asset.kind === 'css') {
    return asset.kind;
  }
  if (asset.filename.endsWith('.esm.js')) return 'esm';
  if (asset.filename.endsWith('.umd.js')) return 'umd';
  if (asset.filename.endsWith('.css')) return 'css';
  return 'asset';
}

function toSnippetAsset(asset: RawManifestAsset, origin: string, cdnBasePath: string): SnippetAsset {
  const normalizedKind = normalizeAssetKind(asset);
  const assetUrl = asset.path?.startsWith('/') ? buildAssetUrl(origin, asset.path) : asset.path ?? '';
  return {
    filename: asset.filename,
    path: asset.path ?? `${cdnBasePath}/${asset.filename}`,
    url: assetUrl,
    integrity: asset.integrity,
    size: asset.size,
    gzipSize: asset.gzipSize,
    entry: asset.entry,
    kind: normalizedKind
  };
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function collectPhaseWarnings(phase: BundlePhaseReport, label: string): string[] {
  const warnings: string[] = [];
  for (const [key, stat] of Object.entries(phase)) {
    if (!stat.ok) {
      warnings.push(
        `${label} target exceeded for ${key}: ${formatBytes(stat.gzipBytes)} vs limit ${formatBytes(stat.limitBytes)}`
      );
    }
  }
  return warnings;
}

function collectPhaseFailures(phase: BundlePhaseReport, label: string): string[] {
  const errors: string[] = [];
  for (const [key, stat] of Object.entries(phase)) {
    if (!stat.ok) {
      errors.push(
        `${label} budget exceeded for ${key}: ${formatBytes(stat.gzipBytes)} vs limit ${formatBytes(stat.limitBytes)}`
      );
    }
  }
  return errors;
}

function buildScriptsFromAssets(
  assets: SnippetAsset[],
  cdnBasePath: string,
  cdnOrigin: string
): { scripts?: SnippetScripts; errors: string[] } {
  const errors: string[] = [];
  const moduleAsset =
    assets.find((asset) => asset.kind === 'esm') ??
    assets.find((asset) => asset.filename.endsWith('.esm.js'));
  const nomoduleAsset =
    assets.find((asset) => asset.kind === 'umd') ??
    assets.find((asset) => asset.filename.endsWith('.umd.js'));
  if (!moduleAsset) {
    errors.push('Manifest missing ESM entry (index.esm.js).');
  }
  if (!nomoduleAsset) {
    errors.push('Manifest missing UMD fallback (hub-embed.umd.js).');
  }
  if (!moduleAsset || !nomoduleAsset) {
    return { errors };
  }

  const moduleSrc = moduleAsset.path.startsWith('/')
    ? buildAssetUrl(cdnOrigin, moduleAsset.path)
    : `${cdnBasePath}/${moduleAsset.filename}`;
  const nomoduleSrc = nomoduleAsset.path.startsWith('/')
    ? buildAssetUrl(cdnOrigin, nomoduleAsset.path)
    : `${cdnBasePath}/${nomoduleAsset.filename}`;

  const moduleIntegrity = moduleAsset.integrity ?? '';
  const nomoduleIntegrity = nomoduleAsset.integrity ?? '';
  if (!moduleIntegrity) {
    errors.push('Module asset missing integrity hash.');
  }
  if (!nomoduleIntegrity) {
    errors.push('Nomodule asset missing integrity hash.');
  }
  if (errors.length) {
    return { errors };
  }

  const scripts: SnippetScripts = {
    module: `<script type="module" crossorigin="anonymous" integrity="${moduleIntegrity}" src="${moduleSrc}"></script>`,
    nomodule: `<script nomodule crossorigin="anonymous" integrity="${nomoduleIntegrity}" src="${nomoduleSrc}"></script>`,
    styles: assets
      .filter((asset) => asset.kind === 'css')
      .map((asset) => {
        const href = asset.path.startsWith('/') ? buildAssetUrl(cdnOrigin, asset.path) : `${cdnBasePath}/${asset.filename}`;
        const integrity = asset.integrity ? ` integrity="${asset.integrity}"` : '';
        return `<link rel="stylesheet" crossorigin="anonymous"${integrity} href="${href}" />`;
      })
  };
  return { scripts, errors };
}

function summarizeManifest(
  dirName: string,
  manifest: RawManifest,
  cdnOrigin: string
): SnippetManifestSummary {
  const errors: string[] = [];
  const warnings: string[] = [];

  const derivedVersion = dirName.replace(/^hub-embed@/i, '') || dirName;
  const version = manifest.version ?? derivedVersion;
  const cdnBasePath = manifest.cdnBasePath ?? `/${dirName}`;
  if (!manifest.cdnBasePath) {
    warnings.push('Manifest missing cdnBasePath — falling back to inferred path.');
  }
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
  if (!manifest.assets) {
    errors.push('Manifest missing assets array.');
  }
  const snippetAssets = assets.map((asset) => toSnippetAsset(asset, cdnOrigin, cdnBasePath));

  for (const asset of snippetAssets) {
    if (!asset.integrity) {
      errors.push(`Asset ${asset.filename} is missing integrity metadata.`);
    } else if (!asset.integrity.startsWith('sha384-')) {
      warnings.push(`Asset ${asset.filename} should use sha384 integrity hashes.`);
    }
    if (!asset.path.startsWith(cdnBasePath)) {
      warnings.push(`Asset ${asset.filename} path does not include ${cdnBasePath}.`);
    }
  }

  let scripts: SnippetScripts | undefined;
  const scriptResult = buildScriptsFromAssets(snippetAssets, cdnBasePath, cdnOrigin);
  errors.push(...scriptResult.errors);
  scripts = scriptResult.scripts;

  if (!manifest.generatedAt) {
    warnings.push('Manifest missing generatedAt timestamp.');
  }

  if (manifest.bundleReport) {
    const { phaseA, phaseB } = manifest.bundleReport;
    errors.push(...collectPhaseFailures(phaseA, 'Phase A'));
    warnings.push(...collectPhaseWarnings(phaseB, 'Phase B'));
  } else {
    warnings.push('Bundle report missing from manifest; budgets cannot be displayed.');
  }

  const status: SnippetManifestSummary['status'] = errors.length ? 'invalid' : 'ready';

  return {
    id: dirName,
    version,
    label: dirName,
    cdnBasePath,
    generatedAt: manifest.generatedAt ?? 'unknown',
    status,
    errors,
    warnings,
    assets: snippetAssets,
    bundleReport: manifest.bundleReport,
    scripts: status === 'ready' ? scripts : undefined
  };
}

function sortManifests(manifests: SnippetManifestSummary[]): SnippetManifestSummary[] {
  const priority = new Map(
    ['hub-embed@latest', 'hub-embed@lts'].map((id, index) => [id, index])
  );
  return manifests.sort((a, b) => {
    const aPriority = priority.has(a.id) ? priority.get(a.id)! : Number.POSITIVE_INFINITY;
    const bPriority = priority.has(b.id) ? priority.get(b.id)! : Number.POSITIVE_INFINITY;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return b.id.localeCompare(a.id);
  });
}

export async function getSnippetManifests(options?: { cdnOrigin?: string }): Promise<SnippetManifestSummary[]> {
  const root = await resolveManifestRoot();
  const entries = await fs.readdir(root, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory() && isValidDirname(entry.name));
  const cdnOrigin = options?.cdnOrigin ?? resolveCdnOrigin();
  const summaries: SnippetManifestSummary[] = [];

  for (const dir of dirs) {
    const manifestPath = path.join(root, dir.name, 'manifest.json');
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8');
      const parsed = JSON.parse(raw) as RawManifest;
      summaries.push(summarizeManifest(dir.name, parsed, cdnOrigin));
    } catch (error) {
      summaries.push({
        id: dir.name,
        version: dir.name.replace(/^hub-embed@/i, '') || dir.name,
        label: dir.name,
        cdnBasePath: `/${dir.name}`,
        generatedAt: 'unknown',
        status: 'invalid',
        errors: [`Failed to read manifest: ${(error as Error).message}`],
        warnings: [],
        assets: [],
        bundleReport: undefined,
        scripts: undefined
      });
    }
  }

  return sortManifests(summaries);
}
