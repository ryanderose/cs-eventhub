import { createHash } from 'node:crypto';
import { access, cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const distDir = path.join(root, 'packages/embed-sdk/dist');
const cdnRoot = path.join(root, 'apps/cdn/public');
const manifestRoot = path.join(cdnRoot, 'manifest');

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

async function copyDistToCdn(version: string) {
  const targetDir = path.join(cdnRoot, `hub-embed@${version}`);
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

async function writeManifest(version: string, assets: Array<{ filename: string; integrity: string; size: number }>) {
  await mkdir(manifestRoot, { recursive: true });
  const manifest = {
    version,
    cdnBasePath: `/hub-embed@${version}`,
    generatedAt: new Date().toISOString(),
    assets: assets.map((asset) => ({
      path: `/hub-embed@${version}/${asset.filename}`,
      filename: asset.filename,
      integrity: asset.integrity,
      size: asset.size
    }))
  };

  const manifestPath = path.join(manifestRoot, `${version}.json`);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  await writeFile(path.join(manifestRoot, 'latest.json'), JSON.stringify(manifest, null, 2));
  return manifestPath;
}

async function main() {
  const version = await readPackageVersion();
  await ensureDistExists();
  const targetDir = await copyDistToCdn(version);
  const assets = await collectAssets(targetDir);
  const manifestPath = await writeManifest(version, assets);
  console.log(`Published embed assets for v${version}`);
  console.log(`Manifest written to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
