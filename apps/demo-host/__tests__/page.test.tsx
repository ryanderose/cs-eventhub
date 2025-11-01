import React from 'react';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import Page from '../app/page';
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
    (shadow as unknown as { innerHTML: string }).innerHTML = '<div data-shadow-host=""></div>';
  }
  return {
    hydrateNext: vi.fn(),
    destroy: vi.fn(() => {
      config.container.replaceChildren();
    }),
    on: vi.fn(),
    off: vi.fn(),
    getShadowRoot: () => shadow
  } as MockHandle;
});

vi.mock('@events-hub/embed-sdk/dist/index.esm.js', () => ({
  create: createMock
}));

function buildPlan(planHash: string): PageDoc {
  const now = new Date().toISOString();
  return {
    id: 'plan',
    title: 'Plan',
    path: '/',
    tenantId: 'demo',
    updatedAt: now,
    version: '1.5',
    blocks: [],
    meta: {
      cacheTags: [],
      flags: {},
      locale: 'en-US',
      planHash
    },
    planCursors: []
  };
}

describe('Next.js embed host page', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    createMock.mockClear();
    document.head.querySelectorAll('script[data-events-hub-embed]').forEach((script) => script.remove());
    delete (window as unknown as { EventsHubEmbed?: unknown }).EventsHubEmbed;
    process.env.NEXT_PUBLIC_EMBED_SRC = '';
    process.env.NEXT_PUBLIC_EMBED_MODE = 'linked';
    process.env.NEXT_PUBLIC_CONFIG_URL = 'https://config.townthink.com/config/tenants/demo.json';
    process.env.NEXT_PUBLIC_API_BASE = 'https://api.townthink.com';
    process.env.NEXT_PUBLIC_PLAN_MODE = 'beta';
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    delete (window as unknown as { EventsHubEmbed?: unknown }).EventsHubEmbed;
    vi.unstubAllGlobals();
    cleanup();
  });

  it('hydrates the embed in linked mode and attaches a shadow root', async () => {
    const apiPlan = buildPlan('api-hash');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        plan: apiPlan,
        encodedPlan: 'encoded',
        planHash: apiPlan.meta?.planHash ?? 'api-hash',
        updatedAt: new Date().toISOString()
      })
    } as unknown as Response);

    render(<Page />);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    const container = document.querySelector('[data-embed-container]') as HTMLDivElement;
    expect(container).toBeTruthy();
    expect(container.shadowRoot ?? container.querySelector('[data-shadow-root]')).toBeTruthy();
    expect(container.dataset.planMode).toBe('beta');

    const initialPlan = createMock.mock.calls[0][0].initialPlan as PageDoc;
    expect(initialPlan.meta?.planHash).toBe('api-hash');
    expect(screen.getByText(/Embed ready/)).toBeInTheDocument();
  });

  it('loads the external script when NEXT_PUBLIC_EMBED_MODE=external', async () => {
    process.env.NEXT_PUBLIC_EMBED_MODE = 'external';
    process.env.NEXT_PUBLIC_EMBED_SRC = 'https://cdn.townthink.com/hub-embed@latest/hub-embed.umd.js';
    const apiPlan = buildPlan('external-hash');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        plan: apiPlan,
        encodedPlan: 'encoded',
        planHash: apiPlan.meta?.planHash ?? 'external-hash',
        updatedAt: new Date().toISOString()
      })
    } as unknown as Response);

    const originalAppendChild = document.head.appendChild;
    const appendSpy = vi
      .spyOn(document.head, 'appendChild')
      .mockImplementation(function append(this: HTMLElement, element: Node) {
        const result = originalAppendChild.call(this, element);
        if ((element as Element).tagName === 'SCRIPT') {
          setTimeout(() => {
            (window as unknown as { EventsHubEmbed?: unknown }).EventsHubEmbed = { create: createMock };
            element.dispatchEvent(new window.Event('load'));
          }, 0);
        }
        return result;
      });

    render(<Page />);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    expect(appendSpy).toHaveBeenCalled();
    const script = document.querySelector('script[data-events-hub-embed]') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.src).toContain('https://cdn.townthink.com/hub-embed@latest/hub-embed.umd.js');
    appendSpy.mockRestore();
  });

  it('falls back to the local sample plan after repeated fetch failures', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({})
    } as unknown as Response);
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    render(<Page />);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    const initialPlan = createMock.mock.calls[0][0].initialPlan as PageDoc;
    expect(initialPlan.meta?.planHash).toBe('stub');
    expect(screen.getByRole('alert')).toHaveTextContent(/Unable to load default plan/i);
    expect(screen.getByText(/fallback/i)).toBeInTheDocument();
  });
});
