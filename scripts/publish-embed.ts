import { createHash } from 'node:crypto';
import { access, cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const distDir = path.join(root, 'packages/embed-sdk/dist');
const cdnRoot = path.join(root, 'apps/cdn/public');
type PublishOptions = {
  version?: string;
  cdnSubpath?: string;
  latestAlias?: string | null;
  manifestOnly?: boolean;
  skipLatest?: boolean;
};

type ParsedArgs = Record<string, string | boolean>;

function parseArgs(): ParsedArgs {
  const result: ParsedArgs = {};
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = args[index + 1];

    if (!next || next.startsWith('--')) {
      result[key] = true;
      continue;
    }

    result[key] = next;
    index += 1;
  }

  return result;
}

function sanitizeName(name: string): string {
  return name.replace(/[\\/]+/gu, '-');
}

function resolveOptions(): PublishOptions {
  const args = parseArgs();

  const options: PublishOptions = {};

  if (typeof args.version === 'string') options.version = args.version;
  if (typeof args['cdn-subpath'] === 'string') options.cdnSubpath = args['cdn-subpath'];
  if (typeof args['latest-alias'] === 'string') options.latestAlias = args['latest-alias'];
  if (args['manifest-only'] === true) options.manifestOnly = true;
  if (args['skip-latest'] === true) options.skipLatest = true;

  return options;
}

function readOptionalEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeLabel(label: string): string {
  return sanitizeName(label.replace(/[^a-zA-Z0-9@._-]/gu, '-'));
}

async function readPackageVersion(): Promise<string | null> {
  const pkgPath = path.join(root, 'packages/embed-sdk/package.json');
  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as { version: string };
  if (!pkg.version || pkg.version === '0.0.0') {
    return null;
  }
  return pkg.version;
}

function resolveDynamicVersion(): string {
  const explicit = readOptionalEnv('EMBED_VERSION') ?? readOptionalEnv('EMBED_SDK_VERSION');
  if (explicit) return sanitizeLabel(explicit);

  const commitSha = readOptionalEnv('VERCEL_GIT_COMMIT_SHA') ?? readOptionalEnv('GITHUB_SHA');
  if (commitSha) {
    return sanitizeLabel(`preview-${commitSha.slice(0, 12)}`);
  }

  const buildId = readOptionalEnv('VERCEL_BUILD_ID');
  if (buildId) {
    return sanitizeLabel(`build-${buildId}`);
  }

  return sanitizeLabel(`dev-${Date.now()}`);
}

async function ensureDistExists() {
  try {
    await access(distDir);
  } catch {
    throw new Error('Build artifacts not found. Run pnpm --filter @events-hub/embed-sdk build first.');
  }
}

async function ensureDirectoryExists(dir: string) {
  try {
    const stats = await stat(dir);
    if (!stats.isDirectory()) {
      throw new Error(`${dir} exists but is not a directory.`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Expected ${dir} to exist. Did you run the publish step first?`);
    }
    throw error;
  }
}

async function copyDistToCdn(cdnSubpath: string) {
  const targetDir = path.join(cdnRoot, cdnSubpath);
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await cp(distDir, targetDir, { recursive: true });
  return targetDir;
}

function computeIntegrity(buffer: Buffer): string {
  const hash = createHash('sha384');
  hash.update(buffer);
  return `sha384-${hash.digest('base64')}`;
}

async function collectAssets(dir: string) {
  const entries = await readdir(dir);
  const manifestEntries: Array<{ filename: string; integrity: string; size: number }> = [];

  for (const entry of entries) {
    const filePath = path.join(dir, entry);
    const stats = await stat(filePath);
    if (stats.isDirectory()) continue;
    if (!/\.(?:js|css)$/u.test(entry)) continue;
    const buffer = await readFile(filePath);
    manifestEntries.push({ filename: entry, integrity: computeIntegrity(buffer), size: stats.size });
  }

  return manifestEntries.sort((a, b) => a.filename.localeCompare(b.filename));
}

type ManifestEntry = {
  version: string;
  cdnBasePath: string;
  generatedAt: string;
  assets: Array<{
    path: string;
    filename: string;
    integrity: string;
    size: number;
  }>;
};

function buildManifest(version: string, cdnSubpath: string, assets: Array<{ filename: string; integrity: string; size: number }>): ManifestEntry {
  return {
    version,
    cdnBasePath: `/${cdnSubpath}`,
    generatedAt: new Date().toISOString(),
    assets: assets.map((asset) => ({
      path: `/${cdnSubpath}/${asset.filename}`,
      filename: asset.filename,
      integrity: asset.integrity,
      size: asset.size
    }))
  } satisfies ManifestEntry;
}

async function writeManifestFile(targetDir: string, manifest: ManifestEntry) {
  await mkdir(targetDir, { recursive: true });
  const manifestPath = path.join(targetDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}

async function main() {
  const options = resolveOptions();
  const packageVersion = await readPackageVersion();
  const fallbackVersion = resolveDynamicVersion();
  const rawVersion = options.version ?? packageVersion ?? fallbackVersion;
  const version = sanitizeLabel(rawVersion) || fallbackVersion;
  const cdnSubpath = options.cdnSubpath ?? `hub-embed@${version}`;
  const vercelEnv = readOptionalEnv('VERCEL_ENV');
  const skipLatestByEnv = vercelEnv ? vercelEnv.toLowerCase() !== 'production' : false;
  const shouldSkipLatest = options.skipLatest === true || skipLatestByEnv;
  const latestAlias = shouldSkipLatest ? null : options.latestAlias ?? 'hub-embed@latest';

  let targetDir: string;
  if (options.manifestOnly) {
    targetDir = path.join(cdnRoot, cdnSubpath);
    await ensureDirectoryExists(targetDir);
  } else {
    await ensureDistExists();
    targetDir = await copyDistToCdn(cdnSubpath);
  }

  const assets = await collectAssets(targetDir);
  const manifest = buildManifest(version, cdnSubpath, assets);
  const manifestPath = await writeManifestFile(targetDir, manifest);

  console.log(`Published embed assets for ${version}`);
  console.log(`CDN path: /${cdnSubpath}`);
  console.log(`Manifest written to ${manifestPath}`);

  if (latestAlias) {
    const aliasSubpath = sanitizeName(latestAlias);
    const aliasDir = path.join(cdnRoot, aliasSubpath);

    if (options.manifestOnly) {
      await ensureDirectoryExists(aliasDir);
    } else {
      await rm(aliasDir, { recursive: true, force: true });
      await mkdir(aliasDir, { recursive: true });
      await cp(targetDir, aliasDir, { recursive: true });
    }

    const aliasManifest = buildManifest(version, aliasSubpath, assets);
    await writeManifestFile(aliasDir, aliasManifest);
    console.log(`Updated latest alias at /${aliasSubpath}`);
  } else if (options.skipLatest === true) {
    console.log('Skipped latest alias update because --skip-latest was provided.');
  } else if (skipLatestByEnv) {
    console.log('Skipped latest alias update because VERCEL_ENV is not production.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
