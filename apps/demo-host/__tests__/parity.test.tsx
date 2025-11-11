import '@testing-library/jest-dom/vitest';
import React from 'react';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import Page from '../app/page';
import { compareJsonLd } from '../lib/seoParity';
import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';

if (typeof window === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'https://demo.localhost' });
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLDivElement = dom.window.HTMLDivElement;
  globalThis.Node = dom.window.Node;
}

if (!HTMLElement.prototype.attachShadow) {
  HTMLElement.prototype.attachShadow = function attachShadow(this: HTMLElement) {
    const root = document.createElement('div');
    root.setAttribute('data-shadow-root', '');
    Object.defineProperty(this, 'shadowRoot', {
      value: root,
      configurable: true
    });
    this.appendChild(root);
    return root as unknown as ShadowRoot;
  };
}

type MockHandle = EmbedHandle & { destroy: ReturnType<typeof vi.fn> };

const createMock = vi.fn((config: EmbedConfig): MockHandle => {
  const shadow = config.container.attachShadow({ mode: 'open' });
  if ('innerHTML' in shadow) {
    (shadow as unknown as { innerHTML: string }).innerHTML = '<section data-block="collection"></section>';
  }
  return {
    hydrateNext: vi.fn(async () => {}),
    destroy: vi.fn(() => {
      config.container.replaceChildren();
    }),
    on: vi.fn(),
    off: vi.fn(),
    navigate: vi.fn(),
    getRoute: vi.fn(() => ({ view: 'list', url: '/' })),
    getShadowRoot: () => shadow,
    refresh: vi.fn(async () => {})
  } as MockHandle;
});

vi.mock('@events-hub/embed-sdk/dist/index.esm.js', () => ({
  create: createMock
}));

function createPlan(): PageDoc {
  const now = new Date().toISOString();
  return {
    id: 'plan',
    title: 'Plan',
    path: '/',
    tenantId: 'demo',
    updatedAt: now,
    version: '1.6',
    blocks: [],
    planCursors: [],
    meta: { cacheTags: [], flags: {}, locale: 'en-US' }
  };
}

describe('SEO parity harness & host parity tests', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    createMock.mockClear();
    fetchMock.mockReset();
    (globalThis as unknown as { fetch?: unknown }).fetch = fetchMock as unknown as typeof fetch;
    process.env.NEXT_PUBLIC_EMBED_MODE = 'linked';
    process.env.NEXT_PUBLIC_CONFIG_URL = 'https://config.townthink.com/config/tenants/demo.json';
    process.env.NEXT_PUBLIC_API_BASE = 'https://api.townthink.com';
    process.env.NEXT_PUBLIC_PLAN_MODE = 'beta';
  });

  afterEach(() => {
    delete (globalThis as unknown as { fetch?: unknown }).fetch;
    cleanup();
  });

  it('computes JSON-LD diff percentages within tolerance', () => {
    const base = JSON.stringify({ '@id': '1', name: 'Event' });
    const mutated = JSON.stringify({ '@id': '1', name: 'Event ' });
    const tolerant = compareJsonLd(base, mutated, { tolerance: 0.05 });
    expect(tolerant.withinThreshold).toBe(true);
    expect(tolerant.idsMatch).toBe(true);

    const strict = compareJsonLd(base, mutated, { tolerance: 0.0001 });
    expect(strict.withinThreshold).toBe(false);

    const failure = compareJsonLd(base, JSON.stringify({ '@id': '2', name: 'Other' }), { tolerance: 0.01 });
    expect(failure.idsMatch).toBe(false);
  });

  it('keeps rendered blocks inside the Shadow DOM (overlay isolation)', async () => {
    const plan = createPlan();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        plan,
        encodedPlan: 'encoded-plan',
        planHash: 'hash',
        updatedAt: plan.updatedAt
      })
    } as Response);

    render(<Page />);
    await waitFor(() => {
      expect(createMock).toHaveBeenCalled();
    });

    const container = document.querySelector<HTMLDivElement>('[data-embed-container]');
    expect(container).toBeTruthy();
    expect(document.querySelectorAll('section[data-block]').length).toBe(0);
    expect(container?.shadowRoot?.querySelectorAll('section[data-block]').length).toBeGreaterThan(0);
  });

  it('waits for plan readiness before painting routed content', async () => {
    let resolvePlan: ((value: Response) => void) | null = null;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolvePlan = resolve;
      })
    );

    render(<Page />);

    const container = document.querySelector<HTMLDivElement>('[data-embed-container]');
    expect(container).toBeTruthy();
    expect(container?.shadowRoot?.querySelector('[data-root]')).toBeFalsy();

    const plan = createPlan();
    resolvePlan?.({
      ok: true,
      status: 200,
      json: async () => ({
        plan,
        encodedPlan: 'encoded-plan',
        planHash: 'hash',
        updatedAt: plan.updatedAt
      })
    } as Response);

    await waitFor(() => {
      expect(container?.shadowRoot?.querySelector('[data-root]')).not.toBeNull();
    });
  });
});
