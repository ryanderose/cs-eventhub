'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { DEFAULT_TENANT, getApiBase, getConfigUrl, getEmbedMode, getEmbedSrc, getPlanMode } from '../lib/env';
import { useDefaultPlan } from '../lib/useDefaultPlan';
import { DEMO_EMBED_THEME } from '../lib/embed-theme';
import { createEmbedHandle, loadEmbedModule, type EmbedModule } from '../lib/embed-loader';

const DEFAULT_TENANT_ID = DEFAULT_TENANT;

function bootstrapEmbed(container: HTMLDivElement, embedModule: EmbedModule, plan: PageDoc) {
  return createEmbedHandle({
    container,
    embedModule,
    tenantId: plan.tenantId ?? DEFAULT_TENANT_ID,
    plan,
    config: { theme: { ...DEMO_EMBED_THEME } }
  });
}

export default function Page() {
  const [host, setHost] = useState<string | null>(
    typeof window === 'undefined' ? process.env.NEXT_PUBLIC_DEMO_HOSTNAME ?? null : window.location.host ?? null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackPlan = useMemo(() => createDefaultDemoPlan({ tenantId: DEFAULT_TENANT_ID }), []);
  const embedMode = useMemo(() => getEmbedMode(), []);
  const embedSrc = useMemo(() => getEmbedSrc(), []);
  const configUrl = useMemo(() => getConfigUrl({ tenantId: DEFAULT_TENANT_ID, host }), [host]);
  const apiBase = useMemo(() => getApiBase({ host }), [host]);
  const planEndpoint = useMemo(
    () => process.env.NEXT_PUBLIC_DEFAULT_PLAN_ENDPOINT?.trim() ?? '/api/default-plan',
    []
  );
  const planMode = useMemo(() => getPlanMode(), []);
  const { plan, planHash, status: planStatus, source: planSource, origin: planOrigin, error: planError } = useDefaultPlan({
    apiBase,
    planEndpoint,
    tenantId: DEFAULT_TENANT_ID,
    planMode,
    fallbackPlan
  });
  const [embedStatus, setEmbedStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [embedError, setEmbedError] = useState<string | null>(null);
  const handleRef = useRef<EmbedHandle | null>(null);
  const currentHashRef = useRef<string | null>(null);
  const initialPlanRef = useRef<PageDoc | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setHost((current) => {
      const nextHost = window.location.host ?? null;
      return current === nextHost ? current : nextHost;
    });
  }, []);

  const orderedPlanKeys = useMemo(() => {
    return [...plan.blocks].sort((a, b) => a.order - b.order).map((block) => block.key);
  }, [plan]);

  useEffect(() => {
    if (!planHash) return;
    console.info('[demoHost.defaultPlan]', {
      planHash,
      planOrigin,
      planSource,
      planStatus
    });
  }, [planHash, planOrigin, planSource, planStatus]);

  if (!initialPlanRef.current) {
    initialPlanRef.current = plan;
  }

  useEffect(() => {
    let disposed = false;

    async function boot() {
      if (handleRef.current || !containerRef.current) {
        return;
      }
      try {
        const embedModule = await loadEmbedModule(embedMode, embedSrc);
        if (disposed || !containerRef.current) {
          return;
        }
        const initialPlan = initialPlanRef.current ?? plan;
        const handle = bootstrapEmbed(containerRef.current, embedModule, initialPlan);
        handleRef.current = handle;
        currentHashRef.current = initialPlan.meta?.planHash ?? null;
        initialPlanRef.current = initialPlan;
        setEmbedStatus('ready');
        setEmbedError(null);
      } catch (error) {
        console.error(error);
        if (!disposed) {
          setEmbedStatus('error');
          setEmbedError(error instanceof Error ? error.message : 'Failed to load embed');
        }
      }
    }

    if (!handleRef.current) {
      setEmbedStatus('initializing');
      setEmbedError(null);
    }
    boot();

    return () => {
      disposed = true;
      handleRef.current?.destroy();
      handleRef.current = null;
      currentHashRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedMode, embedSrc]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) {
      return;
    }
    if (!planHash || planHash === currentHashRef.current) {
      if (planHash === currentHashRef.current) {
        initialPlanRef.current = plan;
      }
      return;
    }
    handle.hydrateNext({ plan });
    currentHashRef.current = planHash;
    initialPlanRef.current = plan;
  }, [plan, planHash]);

  const statusMessage = useMemo(() => {
    if (embedStatus === 'error') {
      return embedError ?? 'Failed to load embed';
    }
    if (planStatus === 'loading') {
      return 'Loading default blocks…';
    }
    if (planStatus === 'fallback') {
      const detail = planError ? ` — ${planError}` : '';
      return `Unable to load default plan${detail}. Showing fallback data.`;
    }
    if (planStatus === 'disabled') {
      return 'Sample plan mode enabled (API fetch disabled).';
    }
    if (embedStatus === 'ready') {
      if (planSource === 'api') {
        const descriptor = planOrigin === 'seeded' ? 'seeded default plan' : 'stored default plan';
        return `Embed ready (${descriptor}).`;
      }
      return 'Embed ready (fallback data).';
    }
    return 'Loading embed…';
  }, [embedStatus, embedError, planStatus, planSource, planOrigin, planError]);

  const planOriginLabel = useMemo(() => {
    switch (planOrigin) {
      case 'seeded':
        return 'Seeded default plan (save a change to persist)';
      case 'stored':
        return 'Stored default plan (persisted order)';
      default:
        return 'Fallback sample data';
    }
  }, [planOrigin]);

  return (
    <main>
      <h1>Events Hub Demo Host</h1>
      <p>
        This host demonstrates how to bootstrap the Events Hub embed SDK from a Next.js App Router application.
        Switch between linked and external embed modes by toggling <code>NEXT_PUBLIC_EMBED_MODE</code>.
      </p>
      <div
        ref={containerRef}
        data-embed-container=""
        data-config-url={configUrl}
        data-api-base={apiBase}
        data-plan-mode={planMode}
        data-plan-status={planStatus}
        data-plan-source={planSource}
        data-plan-origin={planOrigin}
        data-plan-hash={planHash ?? ''}
        data-plan-keys={orderedPlanKeys.join(',')}
        data-plan-endpoint={planEndpoint}
      />
      <p className="status" role="status" aria-live="polite">
        {statusMessage}
      </p>
      <dl className="status">
        <dt>Embed mode</dt>
        <dd>{embedMode}</dd>
        {embedMode === 'external' ? (
          <>
            <dt>Embed source</dt>
            <dd>{embedSrc || 'Not configured'}</dd>
          </>
        ) : null}
        {configUrl ? (
          <>
            <dt>Config URL</dt>
            <dd>{configUrl}</dd>
          </>
        ) : null}
        {apiBase ? (
          <>
            <dt>API base</dt>
            <dd>{apiBase}</dd>
          </>
        ) : null}
        <dt>Plan mode</dt>
        <dd>{planMode}</dd>
        <dt>Plan status</dt>
        <dd>{planStatus}</dd>
        <dt>Plan origin</dt>
        <dd>{planOriginLabel}</dd>
        <dt>Plan hash</dt>
        <dd>{planHash}</dd>
      </dl>
    </main>
  );
}
