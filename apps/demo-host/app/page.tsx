'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { getApiBase, getConfigUrl, getEmbedMode, getEmbedSrc, getPlanMode } from '../lib/env';
import { useDefaultPlan } from '../lib/useDefaultPlan';

type EmbedModule = { create(config: EmbedConfig): EmbedHandle };

declare global {
  interface Window {
    EventsHubEmbed?: EmbedModule;
  }
}

const DEFAULT_TENANT_ID = 'demo';
const EMBED_THEME = {
  '--eh-color-bg': '#020617',
  '--eh-color-text': '#e2e8f0'
} satisfies Record<string, string>;

function resolveGlobalModule(): EmbedModule | undefined {
  if (typeof window === 'undefined') return undefined;
  const embedModule = window.EventsHubEmbed;
  if (embedModule && typeof embedModule.create === 'function') {
    return embedModule;
  }
  return undefined;
}

async function loadExternalModule(src: string): Promise<EmbedModule> {
  if (typeof document === 'undefined') {
    throw new Error('External embed mode requires a browser environment.');
  }
  const existing = resolveGlobalModule();
  if (existing) {
    return existing;
  }
  if (!src) {
    throw new Error('NEXT_PUBLIC_EMBED_SRC must be defined for external embed mode.');
  }

  return new Promise<EmbedModule>((resolve, reject) => {
    const onReady = () => {
      const embedModule = resolveGlobalModule();
      if (embedModule) {
        resolve(embedModule);
      } else {
        reject(new Error('The embed SDK failed to register the expected global.'));
      }
    };
    const onError = () => {
      reject(new Error(`Failed to load the embed SDK from ${src}.`));
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-events-hub-embed]');
    if (existingScript) {
      if (existingScript.dataset.loaded === 'true' && resolveGlobalModule()) {
        resolve(resolveGlobalModule()!);
        return;
      }
      existingScript.addEventListener('load', onReady, { once: true });
      existingScript.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.eventsHubEmbed = 'true';
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        onReady();
      },
      { once: true }
    );
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  });
}

async function loadEmbedModule(mode: ReturnType<typeof getEmbedMode>, src: string): Promise<EmbedModule> {
  if (mode === 'external') {
    return loadExternalModule(src);
  }
  return import('@events-hub/embed-sdk/dist/index.esm.js');
}

function bootstrapEmbed(container: HTMLDivElement, embedModule: EmbedModule, plan: PageDoc) {
  return embedModule.create({
    container,
    tenantId: plan.tenantId ?? DEFAULT_TENANT_ID,
    initialPlan: plan,
    theme: EMBED_THEME
  });
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackPlan = useMemo(() => createDefaultDemoPlan(), []);
  const embedMode = useMemo(() => getEmbedMode(), []);
  const embedSrc = useMemo(() => getEmbedSrc(), []);
  const configUrl = useMemo(() => getConfigUrl(), []);
  const apiBase = useMemo(() => getApiBase(), []);
  const planMode = useMemo(() => getPlanMode(), []);
  const { plan, planHash, status: planStatus, source: planSource, origin: planOrigin, error: planError } = useDefaultPlan({
    apiBase,
    tenantId: DEFAULT_TENANT_ID,
    planMode,
    fallbackPlan
  });
  const [embedStatus, setEmbedStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [embedError, setEmbedError] = useState<string | null>(null);
  const handleRef = useRef<EmbedHandle | null>(null);
  const currentHashRef = useRef<string | null>(null);
  const initialPlanRef = useRef<PageDoc | null>(null);

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
