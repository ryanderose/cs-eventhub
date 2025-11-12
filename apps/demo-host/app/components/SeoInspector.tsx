'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type InspectorView = 'list' | 'detail';

type FragmentParity = {
  diffPercent: number;
  withinThreshold: boolean;
  idsMatch: boolean;
  mismatchedIds?: string[];
  errors?: string[];
};

type FragmentResponse = {
  parity?: FragmentParity | null;
  jsonLd?: string;
  cssHash?: string;
  noindex?: boolean;
  view?: 'list' | 'detail';
  slug?: string;
};

type InspectorState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  parity?: FragmentParity | null;
  jsonLd?: string;
  cssHash?: string;
  noindex?: boolean;
  error?: string;
};

const DEFAULT_STATE: Record<InspectorView, InspectorState> = {
  list: { status: 'idle' },
  detail: { status: 'idle' }
};

const VIEW_CONFIG: Record<InspectorView, { label: string; description: string; params: URLSearchParams }> = {
  list: {
    label: 'List Route',
    description: 'Light-DOM fragment for /events',
    params: new URLSearchParams({ view: 'list' })
  },
  detail: {
    label: 'Detail Route',
    description: 'Light-DOM fragment for /events/sample-slug',
    params: new URLSearchParams({ view: 'detail', slug: 'sample-slug' })
  }
};

function formatPercent(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/a';
  }
  return `${value.toFixed(2)}%`;
}

async function readFragmentError(response: Response): Promise<string> {
  const fallback = `Fragment request failed (${response.status}).`;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) {
        return payload.error;
      }
    } catch {
      // fall through
    }
  }
  try {
    const text = await response.text();
    if (text.trim()) {
      return text.trim();
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function SeoInspector({ tenantId }: { tenantId: string }) {
  const [state, setState] = useState<Record<InspectorView, InspectorState>>(DEFAULT_STATE);
  const [copiedView, setCopiedView] = useState<InspectorView | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateState = useCallback((view: InspectorView, updates: Partial<InspectorState>) => {
    setState((previous) => ({
      ...previous,
      [view]: {
        ...previous[view],
        ...updates
      }
    }));
  }, []);

  const fetchView = useCallback(
    async (view: InspectorView) => {
      updateState(view, { status: 'loading', error: undefined });
      const params = new URLSearchParams(VIEW_CONFIG[view].params);
      try {
        const response = await fetch(`/fragment/${tenantId}?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            Accept: 'application/json'
          }
        });
        if (!response.ok) {
          const errorMessage = await readFragmentError(response);
          throw new Error(errorMessage);
        }
        const payload = (await response.json()) as FragmentResponse;
        updateState(view, {
          status: 'ready',
          parity: payload.parity ?? null,
          jsonLd: payload.jsonLd ?? '',
          cssHash: payload.cssHash ?? '',
          noindex: payload.noindex === true,
          error: undefined
        });
      } catch (error) {
        updateState(view, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to fetch fragment parity.'
        });
      }
    },
    [tenantId, updateState]
  );

  useEffect(() => {
    fetchView('list');
    fetchView('detail');
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, [fetchView]);

  const handleRefresh = useCallback(
    (view: InspectorView) => {
      fetchView(view);
    },
    [fetchView]
  );

  const handleCopy = useCallback(
    async (view: InspectorView) => {
      const payload = state[view];
      if (!payload?.jsonLd) {
        return;
      }
      try {
        if (!navigator?.clipboard?.writeText) {
          throw new Error('Clipboard unavailable in this browser.');
        }
        await navigator.clipboard.writeText(payload.jsonLd);
        setCopyError(null);
        setCopiedView(view);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedView((current) => (current === view ? null : current));
        }, 2000);
      } catch (error) {
        setCopyError(error instanceof Error ? error.message : 'Clipboard unavailable.');
      }
    },
    [state]
  );

  const cards = useMemo(() => (Object.keys(VIEW_CONFIG) as InspectorView[]), []);

  return (
    <section className="seo-inspector" aria-labelledby="seo-inspector-heading">
      <h2 id="seo-inspector-heading">SEO Parity Inspector</h2>
      <p>
        Fetch Light-DOM fragments via the local proxy (<code>/fragment/{tenantId}</code>) and confirm the JSON-LD diff budget is ≤1% for both list and detail routes.
        Use Refresh after tweaking the upstream API response or rerunning <code>pnpm publish:embed</code>.
      </p>
      <div className="inspector-grid">
        {cards.map((view) => {
          const viewState = state[view];
          const parity = viewState.parity;
          const mismatched = parity?.mismatchedIds ?? [];
          return (
            <article key={view} className="inspector-card">
              <header className="inspector-card__header">
                <div>
                  <h3>{VIEW_CONFIG[view].label}</h3>
                  <p className="muted">{VIEW_CONFIG[view].description}</p>
                </div>
                <button type="button" onClick={() => handleRefresh(view)} disabled={viewState.status === 'loading'}>
                  Refresh
                </button>
              </header>

              {viewState.status === 'loading' && (
                <p className="status" role="status">
                  Fetching fragment…
                </p>
              )}

              {viewState.status === 'error' && (
                <p className="callout error" role="alert">
                  {viewState.error ?? 'Fragment request failed.'}
                </p>
              )}

              {viewState.status === 'ready' && (
                <div className="inspector-card__body">
                  <dl className="inspector-metrics">
                    <div>
                      <dt>Diff percent</dt>
                      <dd>{formatPercent(parity?.diffPercent)}</dd>
                    </div>
                    <div>
                      <dt>Within threshold (≤1%)</dt>
                      <dd>{parity?.withinThreshold ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                      <dt>ID parity</dt>
                      <dd>{parity?.idsMatch ? 'IDs match' : `Mismatch (${mismatched.length})`}</dd>
                    </div>
                    <div>
                      <dt>Noindex header</dt>
                      <dd>{viewState.noindex ? 'Enabled' : 'Disabled'}</dd>
                    </div>
                    <div>
                      <dt>CSS hash</dt>
                      <dd>{viewState.cssHash ? <code>{viewState.cssHash}</code> : 'n/a'}</dd>
                    </div>
                  </dl>

                  {parity?.errors?.length ? (
                    <div className="callout warning">
                      <p>Parity warnings:</p>
                      <ul>
                        {parity.errors.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {!parity?.idsMatch && mismatched.length ? (
                    <div className="callout warning">
                      <p>Mismatched @id values:</p>
                      <ul>
                        {mismatched.map((id) => (
                          <li key={id}>{id}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <label>
                    <span>JSON-LD payload</span>
                    <textarea rows={6} readOnly value={viewState.jsonLd ?? ''} />
                  </label>
                  <div className="inspector-card__actions">
                    <button type="button" onClick={() => handleCopy(view)} disabled={!viewState.jsonLd}>
                      Copy JSON-LD
                    </button>
                    {copiedView === view ? <span className="muted">Copied!</span> : null}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {copyError ? (
        <p className="callout warning" role="status">
          {copyError}
        </p>
      ) : null}
    </section>
  );
}
