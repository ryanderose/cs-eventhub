import { createHash } from 'node:crypto';
import { access, cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const distDir = path.join(root, 'packages/embed-sdk/dist');
const cdnRoot = path.join(root, 'apps/cdn/public');
const manifestRoot = path.join(cdnRoot, 'manifest');

type PublishOptions = {
  version?: string;
  cdnSubpath?: string;
  manifestPrefix?: string;
  manifestName?: string;
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
  if (typeof args['manifest-prefix'] === 'string') options.manifestPrefix = args['manifest-prefix'];
  if (typeof args['manifest-name'] === 'string') options.manifestName = sanitizeName(args['manifest-name']);
  if (typeof args['latest-alias'] === 'string') options.latestAlias = args['latest-alias'];
  if (args['manifest-only'] === true) options.manifestOnly = true;
  if (args['skip-latest'] === true) options.skipLatest = true;

  return options;
}

async function readPackageVersion(): Promise<string> {
  const pkgPath = path.join(root, 'packages/embed-sdk/package.json');
  const raw = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as { version: string };
  if (!pkg.version || pkg.version === '0.0.0') {
    throw new Error('Embed SDK package.json must specify a release version.');
  }
  return pkg.version;
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

async function writeManifest({
  version,
  assets,
  manifestDir,
  manifestName,
  cdnSubpath,
  latestAlias
}: {
  version: string;
  assets: Array<{ filename: string; integrity: string; size: number }>;
  manifestDir: string;
  manifestName: string;
  cdnSubpath: string;
  latestAlias: string | null;
}) {
  await mkdir(manifestDir, { recursive: true });
  const manifest = {
    version,
    cdnBasePath: `/${cdnSubpath}`,
    generatedAt: new Date().toISOString(),
    assets: assets.map((asset) => ({
      path: `/${cdnSubpath}/${asset.filename}`,
      filename: asset.filename,
      integrity: asset.integrity,
      size: asset.size
    }))
  };

  const manifestPath = path.join(manifestDir, `${manifestName}.json`);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  if (latestAlias) {
    await writeFile(path.join(manifestDir, `${latestAlias}.json`), JSON.stringify(manifest, null, 2));
  }
  return manifestPath;
}

async function main() {
  const options = resolveOptions();
  const packageVersion = await readPackageVersion();
  const version = options.version ?? packageVersion;
  const cdnSubpath = options.cdnSubpath ?? `hub-embed@${version}`;
  const manifestPrefix = options.manifestPrefix ? sanitizeName(options.manifestPrefix) : undefined;
  const manifestDir = manifestPrefix ? path.join(manifestRoot, manifestPrefix) : manifestRoot;
  const manifestName = options.manifestName ?? sanitizeName(version);
  const latestAlias = options.skipLatest === true ? null : options.latestAlias ?? 'latest';

  let targetDir: string;
  if (options.manifestOnly) {
    targetDir = path.join(cdnRoot, cdnSubpath);
    await ensureDirectoryExists(targetDir);
  } else {
    await ensureDistExists();
    targetDir = await copyDistToCdn(cdnSubpath);
  }

  const assets = await collectAssets(targetDir);
  const manifestPath = await writeManifest({
    version,
    assets,
    manifestDir,
    manifestName,
    cdnSubpath,
    latestAlias
  });

  console.log(`Published embed assets for ${version}`);
  console.log(`CDN path: /${cdnSubpath}`);
  console.log(`Manifest written to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
