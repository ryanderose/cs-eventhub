'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import { getApiBase, getConfigUrl, getEmbedMode, getEmbedSrc, getPlanMode } from '../lib/env';

const DEFAULT_TENANT = 'demo';

type DefaultPlanResponse = {
  plan: PageDoc;
  encodedPlan: string;
  planHash: string;
  updatedAt: string;
};

type PlanSource = 'api' | 'fallback';

type PlanData = {
  plan: PageDoc;
  planHash: string;
  encodedPlan?: string;
  source: PlanSource;
};

const BACKOFF_DELAYS = [250, 500] as const;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
];

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
            multi: false,
            options: [
              { id: 'today', label: 'Today' },
              { id: 'weekend', label: 'This weekend' }
            ]
          },
          {
            id: 'category',
            label: 'Category',
            type: 'category',
            multi: false,
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
  tenantId: 'demo',
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

function ensurePlanHash(plan: PageDoc, planHash: string): PageDoc {
  if (plan.meta?.planHash === planHash) {
    return plan;
  }
  return {
    ...plan,
    meta: {
      ...plan.meta,
      planHash
    }
  };
}

function bootstrapEmbed(container: HTMLDivElement, embedModule: EmbedModule, plan: PageDoc) {
  return embedModule.create({
    container,
    tenantId: plan.tenantId ?? DEFAULT_TENANT,
    initialPlan: plan,
    theme: {
      '--eh-color-bg': '#020617',
      '--eh-color-text': '#e2e8f0'
    }
  });
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<EmbedHandle | null>(null);
  const planHashRef = useRef<string | null>(null);
  const [status, setStatus] = useState('Loading default blocks…');
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const embedMode = useMemo(() => getEmbedMode(), []);
  const embedSrc = useMemo(() => getEmbedSrc(), []);
  const configUrl = useMemo(() => getConfigUrl(), []);
  const apiBase = useMemo(() => getApiBase(), []);
  const planMode = useMemo(() => getPlanMode(), []);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlan() {
      setStatus('Loading default blocks…');
      setLoadError(null);

      for (let attempt = 0; attempt <= BACKOFF_DELAYS.length; attempt++) {
        try {
          const response = await fetch(`${apiBase}/v1/plan/default?tenantId=${DEFAULT_TENANT}`, { cache: 'no-store' });
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          const payload = (await response.json()) as DefaultPlanResponse;
          if (cancelled) return;
          const normalizedPlan = ensurePlanHash(payload.plan, payload.planHash);
          setPlanData({
            plan: normalizedPlan,
            planHash: payload.planHash,
            encodedPlan: payload.encodedPlan,
            source: 'api'
          });
          setStatus('Default plan loaded');
          return;
        } catch (error) {
          if (cancelled) return;
          if (attempt < BACKOFF_DELAYS.length) {
            await delay(BACKOFF_DELAYS[attempt]);
            continue;
          }
          const message = 'Unable to load default plan. Showing fallback blocks.';
          setLoadError(message);
          const fallbackPlan = ensurePlanHash(samplePage, samplePage.meta?.planHash ?? 'fallback');
          setPlanData({
            plan: fallbackPlan,
            planHash: fallbackPlan.meta?.planHash ?? 'fallback',
            source: 'fallback'
          });
          setStatus(message);
        }
      }
    }

    fetchPlan();

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateEmbed() {
      if (!containerRef.current || !planData) {
        return;
      }

      if (planHashRef.current === planData.planHash) {
        return;
      }

      const hydrationStatus = planData.source === 'api' ? 'Hydrating embed…' : 'Hydrating fallback plan…';
      setStatus(hydrationStatus);

      try {
        const embedModule = await loadEmbedModule(embedMode, embedSrc);
        if (cancelled || !containerRef.current) {
          return;
        }

        handleRef.current?.destroy();
        const normalized = ensurePlanHash(planData.plan, planData.planHash);
        handleRef.current = bootstrapEmbed(containerRef.current, embedModule, normalized);
        planHashRef.current = planData.planHash;
        setStatus(planData.source === 'api' ? 'Embed ready' : 'Embed ready (fallback)');
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setStatus(error instanceof Error ? error.message : 'Failed to load embed');
      }
    }

    hydrateEmbed();

    return () => {
      cancelled = true;
    };
  }, [planData, embedMode, embedSrc]);

  useEffect(() => {
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

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
      {loadError ? (
        <p className="status error" role="alert" aria-live="assertive" style={{ color: '#b91c1c' }}>
          {loadError}
        </p>
      ) : null}
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
