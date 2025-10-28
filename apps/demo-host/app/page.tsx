'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import { getApiBase, getConfigUrl, getEmbedMode, getEmbedSrc, getPlanMode } from '../lib/env';

type EmbedModule = { create(config: EmbedConfig): EmbedHandle };

declare global {
  interface Window {
    EventsHubEmbed?: EmbedModule;
  }
}

const samplePage: PageDoc = {
  id: 'demo',
  title: 'Demo Page',
  path: '/demo',
  description: 'Sample plan rendered by the embed SDK',
  blocks: [],
  updatedAt: new Date().toISOString(),
  version: '1.5' as const,
  tenantId: 'demo-tenant',
  meta: {
    planHash: 'stub',
    composerVersion: 'demo',
    generatedAt: new Date().toISOString(),
    locale: 'en-US',
    cacheTags: [],
    flags: {}
  },
  planCursors: []
};

function resolveGlobalModule(): EmbedModule | undefined {
  if (typeof window === 'undefined') return undefined;
  const module = window.EventsHubEmbed;
  if (module && typeof module.create === 'function') {
    return module;
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
      const module = resolveGlobalModule();
      if (module) {
        resolve(module);
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

function bootstrapEmbed(container: HTMLDivElement, module: EmbedModule) {
  return module.create({
    container,
    tenantId: samplePage.tenantId,
    initialPlan: samplePage,
    theme: {
      '--eh-color-bg': '#020617',
      '--eh-color-text': '#e2e8f0'
    }
  });
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Loading embed…');
  const embedMode = useMemo(() => getEmbedMode(), []);
  const embedSrc = useMemo(() => getEmbedSrc(), []);
  const configUrl = useMemo(() => getConfigUrl(), []);
  const apiBase = useMemo(() => getApiBase(), []);
  const planMode = useMemo(() => getPlanMode(), []);

  useEffect(() => {
    let destroyed = false;
    let handle: EmbedHandle | undefined;

    async function boot() {
      if (!containerRef.current) {
        return;
      }
      try {
        const module = await loadEmbedModule(embedMode, embedSrc);
        if (destroyed || !containerRef.current) {
          return;
        }
        handle = bootstrapEmbed(containerRef.current, module);
        setStatus('Embed ready');
      } catch (error) {
        console.error(error);
        setStatus(error instanceof Error ? error.message : 'Failed to load embed');
      }
    }

    boot();

    return () => {
      destroyed = true;
      handle?.destroy();
    };
  }, [embedMode, embedSrc]);

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
      />
      <p className="status" role="status" aria-live="polite">
        {status}
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
      </dl>
    </main>
  );
}
