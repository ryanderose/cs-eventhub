import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { clearEmbedManifestCacheForTests, getSnippetManifests, resolveCdnOrigin } from '../../lib/embed-manifest';

describe('embed manifest service', () => {
  it('returns manifest summaries with bundle metadata', async () => {
    const manifests = await getSnippetManifests({ cdnOrigin: resolveCdnOrigin() });
    expect(manifests.length).toBeGreaterThan(0);
    const manifest = manifests[0];
    expect(manifest.assets.length).toBeGreaterThan(0);
    expect(manifest.bundleReport).toBeDefined();
    if (manifest.bundleReport) {
      expect(manifest.bundleReport.phaseA.esm.limitBytes).toBeGreaterThan(0);
    }
    if (manifest.scripts && manifest.status === 'ready') {
      expect(manifest.scripts.module).toContain('crossorigin="anonymous"');
      expect(manifest.scripts.nomodule).toContain('nomodule');
    }
  });

  it('flags CDN drift as an error and blocks snippet generation', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'embed-manifest-'));
    const dir = path.join(tempRoot, 'hub-embed@tampered');
    await mkdir(dir, { recursive: true });
    const manifest = {
      version: '9.9.9',
      cdnBasePath: '/hub-embed@out-of-sync',
      assets: [
        {
          path: '/hub-embed@out-of-sync/index.esm.js',
          filename: 'index.esm.js',
          integrity: 'sha384-abc',
          size: 1,
          gzipSize: 1,
          kind: 'esm',
          entry: true
        },
        {
          path: '/hub-embed@out-of-sync/hub-embed.umd.js',
          filename: 'hub-embed.umd.js',
          integrity: 'sha384-def',
          size: 1,
          gzipSize: 1,
          kind: 'umd',
          entry: true
        }
      ]
    };
    await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    try {
      process.env.EMBED_MANIFEST_ROOT = tempRoot;
      clearEmbedManifestCacheForTests();
      const manifests = await getSnippetManifests({ cdnOrigin: '' });
      const tampered = manifests.find((entry) => entry.id === 'hub-embed@tampered');
      expect(tampered).toBeTruthy();
      expect(tampered?.status).toBe('invalid');
      expect(tampered?.errors.join('\n')).toMatch(/cdn drift/i);
    } finally {
      delete process.env.EMBED_MANIFEST_ROOT;
      clearEmbedManifestCacheForTests();
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
