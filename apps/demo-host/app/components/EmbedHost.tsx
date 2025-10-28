'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PageDoc } from '@events-hub/page-schema';

type EmbedHandle = ReturnType<typeof import('@events-hub/embed-sdk').create>;

type EmbedModule = {
  create: typeof import('@events-hub/embed-sdk').create;
};

const EMBED_CONTAINER_ID = 'events-hub-embed';

const PLAN_THEMES: Record<string, Record<string, string>> = {
  beta: {
    '--eh-color-bg': '#020617',
    '--eh-color-text': '#e2e8f0'
  },
  prod: {
    '--eh-color-bg': '#ffffff',
    '--eh-color-text': '#0f172a'
  }
};

function createFallbackPlan(): PageDoc {
  const generatedAt = new Date().toISOString();
  return {
    id: 'demo',
    tenantId: 'demo-tenant',
    title: 'Demo Plan',
    description: 'Fallback plan rendered by the embed SDK',
    path: '/demo',
    version: '1.5',
    updatedAt: generatedAt,
    blocks: [],
    planCursors: [],
    meta: {
      planHash: 'fallback',
      composerVersion: 'demo',
      generatedAt,
      locale: 'en-US',
      cacheTags: [],
      flags: {}
    }
  };
}

async function loadLinkedModule(): Promise<EmbedModule> {
  return import('@events-hub/embed-sdk/dist/index.esm.js');
}

async function loadExternalModule(src: string): Promise<EmbedModule> {
  if (typeof window === 'undefined') {
    throw new Error('External SDK loading is only supported in the browser.');
  }

  if (window.EventsHubEmbed) {
    return window.EventsHubEmbed;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.EventsHubEmbed) {
        resolve();
      } else {
        reject(new Error('Embed SDK loaded without exposing a global.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load external embed SDK.'));
    document.head.appendChild(script);
  });

  if (!window.EventsHubEmbed) {
    throw new Error('Embed SDK failed to initialize.');
  }

  return window.EventsHubEmbed;
}

async function fetchInitialPlan(configUrl?: string): Promise<PageDoc | undefined> {
  if (!configUrl) {
    return undefined;
  }

  const response = await fetch(configUrl, {
    headers: {
      Accept: 'application/json'
    },
    next: {
      revalidate: 0
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load plan config: ${response.statusText}`);
  }

  return (await response.json()) as PageDoc;
}

export function EmbedHost() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

  const planMode = process.env.NEXT_PUBLIC_PLAN_MODE ?? 'beta';

  const options = useMemo(() => {
    const theme = PLAN_THEMES[planMode] ?? PLAN_THEMES.beta;
    const embedMode = (process.env.NEXT_PUBLIC_EMBED_MODE ?? 'linked') as 'linked' | 'external';

    return {
      mode: embedMode,
      src: process.env.NEXT_PUBLIC_EMBED_SRC,
      configUrl: process.env.NEXT_PUBLIC_CONFIG_URL,
      planMode,
      theme
    } satisfies {
      mode: 'linked' | 'external';
      src: string | undefined;
      configUrl: string | undefined;
      planMode: string;
      theme: Record<string, string>;
    };
  }, [planMode]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let destroyed = false;
    let handle: EmbedHandle | undefined;

    async function boot() {
      try {
        setStatus('loading');
        const plan = await fetchInitialPlan(options.configUrl);
        if (destroyed) {
          return;
        }

        const moduleLoader = (() => {
          if (options.mode === 'external') {
            const externalSrc = options.src;
            if (!externalSrc) {
              throw new Error('NEXT_PUBLIC_EMBED_SRC must be defined when using external mode.');
            }

            return loadExternalModule(externalSrc);
          }

          return loadLinkedModule();
        })();

        const sdk = await moduleLoader;
        if (destroyed) {
          return;
        }

        handle = sdk.create({
          container: containerRef.current!,
          tenantId: plan?.tenantId ?? 'demo-tenant',
          initialPlan: plan ?? createFallbackPlan(),
          theme: options.theme
        });

        setStatus('ready');
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      }
    }

    void boot();

    return () => {
      destroyed = true;
      handle?.destroy();
    };
  }, [options.configUrl, options.mode, options.planMode, options.src, options.theme]);

  if (error) {
    return (
      <section aria-live="polite" role="alert">
        <h1>Events Hub Demo Host</h1>
        <p>Unable to load the embed: {error}</p>
      </section>
    );
  }

  return (
    <section aria-busy={status !== 'ready'}>
      <h1>Events Hub Demo Host</h1>
      <p className="plan-mode">Plan mode: {options.planMode}</p>
      <div id={EMBED_CONTAINER_ID} ref={containerRef} />
    </section>
  );
}
