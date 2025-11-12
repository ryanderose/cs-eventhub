'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { fetchSnippetList } from '../../lib/plan-client';
import type { BundlePhaseReport, SnippetManifestSummary } from '../../lib/snippet-types';

type SnippetGeneratorProps = {
  defaultTenant: string;
  defaultBasePath: string;
};

type HistoryMode = 'query' | 'hash' | 'path' | 'none';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) {
    return '0 kB';
  }
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function BudgetPhase({ label, phase }: { label: string; phase?: BundlePhaseReport }) {
  if (!phase) {
    return (
      <div>
        <h4>{label}</h4>
        <p className="muted">Bundle report unavailable.</p>
      </div>
    );
  }
  return (
    <div>
      <h4>{label}</h4>
      <ul>
        {Object.entries(phase).map(([kind, stat]) => (
          <li key={kind}>
            <strong>{kind.toUpperCase()}</strong>: {formatBytes(stat.gzipBytes)} / {formatBytes(stat.limitBytes)}{' '}
            {stat.ok ? '✅' : '⚠️'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SnippetGenerator({ defaultTenant, defaultBasePath }: SnippetGeneratorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manifests, setManifests] = useState<SnippetManifestSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [embedId, setEmbedId] = useState(`${defaultTenant}-embed`);
  const [basePath, setBasePath] = useState(defaultBasePath);
  const [historyMode, setHistoryMode] = useState<HistoryMode>('query');
  const [lazy, setLazy] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [cdnOrigin, setCdnOrigin] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const payload = await fetchSnippetList();
        if (cancelled) return;
        setManifests(payload.manifests);
        if (payload.manifests.length) {
          setSelectedId(payload.manifests[0].id);
        }
        setCdnOrigin(payload.defaults.cdnOrigin);
        setTenantId(payload.defaults.tenantId || defaultTenant);
        setBasePath(payload.defaults.basePath || defaultBasePath);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load embed manifests.';
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [defaultBasePath, defaultTenant]);

  const selectedManifest = useMemo(() => {
    if (!selectedId) {
      return manifests[0] ?? null;
    }
    return manifests.find((manifest) => manifest.id === selectedId) ?? manifests[0] ?? null;
  }, [manifests, selectedId]);

  const snippetText = useMemo(() => {
    if (!selectedManifest || selectedManifest.status !== 'ready' || !selectedManifest.scripts) {
      return 'Select a valid manifest to generate the snippet.';
    }
    const attrs: string[] = ['data-hub-embed', `data-tenant-id="${tenantId}"`];
    if (embedId.trim()) {
      attrs.push(`data-embed-id="${embedId.trim()}"`);
    }
    if (basePath.trim()) {
      attrs.push(`data-base-path="${basePath.trim()}"`);
    }
    if (historyMode !== 'query') {
      attrs.push(`data-history-mode="${historyMode}"`);
    }
    if (lazy) {
      attrs.push('data-lazy="true"');
    }
    const container = `<div\n  ${attrs.join('\n  ')}\n></div>`;
    const styles = selectedManifest.scripts.styles ?? [];
    return [container, ...styles, selectedManifest.scripts.module, selectedManifest.scripts.nomodule]
      .filter(Boolean)
      .join('\n');
  }, [selectedManifest, tenantId, embedId, basePath, historyMode, lazy]);

  async function handleCopy() {
    if (!selectedManifest || selectedManifest.status !== 'ready' || !selectedManifest.scripts) {
      return;
    }
    try {
      await navigator.clipboard.writeText(snippetText);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
    }
  }

  if (loading) {
    return <p>Loading embed manifests…</p>;
  }

  if (error) {
    return (
      <p className="callout error" role="alert">
        {error}
      </p>
    );
  }

  if (!selectedManifest) {
    return <p>No embed manifests were found under apps/cdn/public.</p>;
  }

  const manifestIsReady = selectedManifest.status === 'ready' && Boolean(selectedManifest.scripts);

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedId(event.target.value || null);
    setCopyStatus('idle');
  }

  return (
    <section className="snippet-generator">
      <div className="form-grid">
        <label>
          <span>Bundle</span>
          <select value={selectedManifest.id} onChange={handleSelectChange}>
            {manifests.map((manifest) => (
              <option key={manifest.id} value={manifest.id}>
                {manifest.label} — v{manifest.version}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tenant ID</span>
          <input value={tenantId} onChange={(event) => setTenantId(event.target.value)} />
        </label>
        <label>
          <span>Embed ID</span>
          <input value={embedId} onChange={(event) => setEmbedId(event.target.value)} />
        </label>
        <label>
          <span>Base path</span>
          <input value={basePath} onChange={(event) => setBasePath(event.target.value)} placeholder="/events" />
        </label>
        <label>
          <span>History mode</span>
          <select value={historyMode} onChange={(event) => setHistoryMode(event.target.value as HistoryMode)}>
            <option value="query">query</option>
            <option value="hash">hash</option>
            <option value="path">path</option>
            <option value="none">none</option>
          </select>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={lazy} onChange={(event) => setLazy(event.target.checked)} /> Lazy mount
        </label>
      </div>

      {!manifestIsReady ? (
        <div className="callout error" role="alert">
          <p>This manifest cannot be used until the following issues are resolved:</p>
          <ul>
            {selectedManifest.errors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <label>
        <span>Copy/paste snippet</span>
        <textarea value={snippetText} readOnly rows={12} />
      </label>
      <button type="button" onClick={handleCopy} disabled={!manifestIsReady}>
        Copy snippet
      </button>
      {copyStatus === 'copied' ? <span className="muted">Copied!</span> : null}
      {copyStatus === 'error' ? (
        <span className="callout error" role="alert">
          Clipboard unavailable — select the snippet above and copy manually.
        </span>
      ) : null}

      <section>
        <h2>Bundle Budgets</h2>
        <BudgetPhase label="Phase A (hard gate)" phase={selectedManifest.bundleReport?.phaseA} />
        <BudgetPhase label="Phase B (target)" phase={selectedManifest.bundleReport?.phaseB} />
      </section>

      <section>
        <h2>Manifest Details</h2>
        <dl>
          <dt>Version</dt>
          <dd>{selectedManifest.version}</dd>
          <dt>CDN path</dt>
          <dd>
            {cdnOrigin ? `${cdnOrigin}${selectedManifest.cdnBasePath}` : selectedManifest.cdnBasePath}{' '}
            {selectedManifest.status !== 'ready' ? '(invalid)' : null}
          </dd>
          <dt>Generated at</dt>
          <dd>{selectedManifest.generatedAt}</dd>
        </dl>
        <h3>Assets</h3>
        <ul>
          {selectedManifest.assets.map((asset) => (
            <li key={asset.filename}>
              <code>{asset.filename}</code> · {asset.kind} · {formatBytes(asset.gzipSize ?? asset.size)} gzip
              <br />
              <small>SRI: {asset.integrity}</small>
            </li>
          ))}
        </ul>
        {selectedManifest.warnings.length ? (
          <div className="callout warning">
            <p>Warnings:</p>
            <ul>
              {selectedManifest.warnings.map((warn) => (
                <li key={warn}>{warn}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </section>
  );
}
