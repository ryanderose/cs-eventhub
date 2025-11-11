import { describe, expect, it } from 'vitest';
import { getSnippetManifests, resolveCdnOrigin } from '../../lib/embed-manifest';

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
});
