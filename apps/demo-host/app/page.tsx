'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import { getApiBase, getConfigUrl, getEmbedMode, getEmbedSrc, getPlanMode } from '../lib/env';

type EmbedModule = { create(config: EmbedConfig): EmbedHandle };

declare global {
  interface Window {
    EventsHubEmbed?: EmbedModule;
  }
}

const nowIso = new Date().toISOString();

const sampleEvents = [
  {
    id: 'evt-1',
    canonicalId: 'evt-1',
    name: 'Waterfront Concert Series',
    venue: { id: 'venue-1', name: 'Pier Theater' },
    startDate: nowIso,
    categories: ['music'],
    source: { provider: 'demo', id: 'evt-1' },
    locale: 'en-US',
    timezone: 'UTC'
  },
  {
    id: 'evt-2',
    canonicalId: 'evt-2',
    name: 'Saturday Farmers Market',
    venue: { id: 'venue-2', name: 'Town Square' },
    startDate: nowIso,
    categories: ['community'],
    source: { provider: 'demo', id: 'evt-2' },
    locale: 'en-US',
    timezone: 'UTC'
  }
] as const;

const samplePage: PageDoc = {
  id: 'demo',
  title: 'Demo Page',
  path: '/demo',
  description: 'Sample plan rendered by the embed SDK',
  blocks: [
    {
      id: 'filter-bar',
      key: 'filter-bar',
      kind: 'filter-bar',
      version: '1.5',
      order: 0,
      layout: { fullWidth: true },
      data: {
        facets: [
          {
            id: 'date',
            label: 'Date',
            type: 'date',
            options: [
              { id: 'today', label: 'Today' },
              { id: 'weekend', label: 'This weekend' }
            ]
          },
          {
            id: 'category',
            label: 'Category',
            type: 'category',
            options: [
              { id: 'music', label: 'Music' },
              { id: 'community', label: 'Community' }
            ]
          }
        ],
        active: { date: 'today', category: 'all' },
        sortOptions: [
          { id: 'rank', label: 'Recommended', default: true },
          { id: 'startTimeAsc', label: 'Soonest' }
        ],
        flags: { showReset: true, floating: false }
      }
    },
    {
      id: 'hero-carousel',
      key: 'hero',
      kind: 'hero-carousel',
      version: '1.5',
      order: 1,
      layout: { fullWidth: true },
      data: {
        items: [
          {
            id: 'hero-1',
            headline: 'Weekend highlights',
            subhead: 'Top picks around town',
            image: { url: 'https://picsum.photos/seed/hero1/800/400', alt: 'Weekend highlights' },
            cta: { label: 'See more', href: '#' }
          }
        ],
        autoplayMs: 8000
      }
    },
    {
      id: 'rail-1',
      key: 'rail-1',
      kind: 'collection-rail',
      version: '1.5',
      order: 2,
      layout: { fullWidth: true },
      data: {
        title: 'Top picks',
        events: sampleEvents as any,
        layout: 'rail',
        streaming: { mode: 'initial' }
      }
    },
    {
      id: 'map',
      key: 'map',
      kind: 'map-grid',
      version: '1.5',
      order: 3,
      layout: { fullWidth: true },
      data: {
        events: [
          { ...sampleEvents[0], map: { lat: 47.607, lng: -122.335 }, listIndex: 0 },
          { ...sampleEvents[1], map: { lat: 47.61, lng: -122.33 }, listIndex: 1 }
        ] as any,
        viewport: { center: { lat: 47.608, lng: -122.335 }, zoom: 12 },
        parityChecksum: 'demo'
      }
    },
    {
      id: 'promo',
      key: 'promo',
      kind: 'promo-slot',
      version: '1.5',
      order: 4,
      layout: { fullWidth: true },
      data: {
        slotId: 'demo-home',
        advertiser: 'House Promo',
        disclosure: 'Sponsored',
        measurement: {},
        safety: { blockedCategories: [], brandSuitability: 'strict' }
      }
    },
    {
      id: 'detail',
      key: 'detail',
      kind: 'event-detail',
      version: '1.5',
      order: 5,
      layout: { fullWidth: true },
      data: {
        event: { ...sampleEvents[0], description: 'Outdoor concert by the waterfront.' },
        layout: 'modal'
      }
    },
    {
      id: 'mini-chat',
      key: 'mini-chat',
      kind: 'event-mini-chat',
      version: '1.5',
      order: 6,
      layout: { fullWidth: true },
      data: {
        eventId: 'evt-1',
        conversationId: 'demo-convo',
        starterQuestions: ['What makes this event special?'],
        availability: { requiresConsent: true, personalization: true }
      }
    }
  ],
  updatedAt: nowIso,
  version: '1.5' as const,
  tenantId: 'demo-tenant',
  meta: {
    planHash: 'stub',
    composerVersion: 'demo',
    generatedAt: nowIso,
    locale: 'en-US',
    cacheTags: [],
    flags: {}
  },
  planCursors: []
};

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

function bootstrapEmbed(container: HTMLDivElement, embedModule: EmbedModule) {
  return embedModule.create({
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
        const embedModule = await loadEmbedModule(embedMode, embedSrc);
        if (destroyed || !containerRef.current) {
          return;
        }
        handle = bootstrapEmbed(containerRef.current, embedModule);
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
