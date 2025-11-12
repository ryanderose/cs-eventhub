import '@testing-library/jest-dom/vitest';
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

const { createMock, consentMock } = vi.hoisted(() => {
  const mock = vi.fn((config: EmbedConfig): MockHandle => {
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
  const consent = {
    grant: vi.fn(),
    revoke: vi.fn(),
    status: vi.fn(() => 'pending')
  };
  return { createMock: mock, consentMock: consent };
});

vi.mock('@events-hub/embed-sdk/dist/index.esm.js', () => ({
  create: createMock,
  consent: consentMock
}));

vi.mock('@events-hub/embed-sdk', () => ({
  create: createMock,
  consent: consentMock
}));

describe('Next.js embed host page', () => {
  const fetchMock = vi.fn();
  type ResponseFactory = () => Promise<Response>;
  const planResponses: ResponseFactory[] = [];
  const fragmentResponses: ResponseFactory[] = [];

  function resolveRequestUrl(target: Parameters<typeof fetch>[0]): string {
    if (typeof target === 'string') {
      return target;
    }
    if (target instanceof URL) {
      return target.toString();
    }
    if (typeof Request !== 'undefined' && target instanceof Request) {
      return target.url;
    }
    if (target && typeof target === 'object' && 'url' in target) {
      return (target as Request).url;
    }
    return '';
  }

  function queuePlanSuccess(plan: PageDoc) {
    planResponses.push(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          plan,
          encodedPlan: 'encoded-api',
          planHash: plan.meta?.planHash,
          updatedAt: plan.updatedAt
        })
      } as Response)
    );
  }

  function queuePlanFailure(error: unknown) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    planResponses.push(() => Promise.reject(normalized));
  }

  function queueFragmentSuccesses(times = 2) {
    for (let index = 0; index < times; index += 1) {
      fragmentResponses.push(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            html: '<div>fragment</div>',
            css: '',
            cssHash: 'fragment-hash',
            jsonLd: '{"@id":"fragment"}',
            parity: { diffPercent: 0, withinThreshold: true, idsMatch: true },
            noindex: false
          })
        } as Response)
      );
    }
  }

  function expectPlanRequests(count: number) {
    const planCalls = fetchMock.mock.calls.filter(([url]) => {
      if (typeof url === 'string') {
        return url.includes('/api/default-plan');
      }
      if (url && typeof url === 'object' && 'url' in url) {
        return (url as Request).url.includes('/api/default-plan');
      }
      return false;
    });
    expect(planCalls).toHaveLength(count);
  }

  function createPlan(overrides?: Partial<PageDoc>): PageDoc {
    const now = new Date().toISOString();
    return {
      id: 'default-page',
      title: 'Default Blocks',
      path: '/default',
      tenantId: 'demo',
      updatedAt: now,
      version: '1.6',
      description: 'Seed plan',
      blocks: [
        {
          id: 'block-one',
          key: 'block-one',
          kind: 'promo-slot',
          version: '1.6',
          order: 0,
          layout: { fullWidth: true },
          analytics: {
            viewKey: 'default:block-one',
            surface: 'default-plan',
            attributes: { label: 'Block One' }
          },
          data: {
            slotId: 'block-one',
            advertiser: 'Block One',
            disclosure: 'Sponsored',
            measurement: {},
            safety: { blockedCategories: [], brandSuitability: 'moderate' as const }
          }
        },
        {
          id: 'block-who',
          key: 'block-who',
          kind: 'promo-slot',
          version: '1.6',
          order: 1,
          layout: { fullWidth: true },
          analytics: {
            viewKey: 'default:block-who',
            surface: 'default-plan',
            attributes: { label: 'Block Who' }
          },
          data: {
            slotId: 'block-who',
            advertiser: 'Block Who',
            disclosure: 'Sponsored',
            measurement: {},
            safety: { blockedCategories: [], brandSuitability: 'moderate' as const }
          }
        },
        {
          id: 'block-three',
          key: 'block-three',
          kind: 'promo-slot',
          version: '1.6',
          order: 2,
          layout: { fullWidth: true },
          analytics: {
            viewKey: 'default:block-three',
            surface: 'default-plan',
            attributes: { label: 'Block Three' }
          },
          data: {
            slotId: 'block-three',
            advertiser: 'Block Three',
            disclosure: 'Sponsored',
            measurement: {},
            safety: { blockedCategories: [], brandSuitability: 'moderate' as const }
          }
        }
      ],
      meta: {
        planHash: 'hash-seed',
        cacheTags: [],
        flags: {},
        locale: 'en-US',
        generatedAt: now,
        composerVersion: 'default'
      },
      planCursors: [],
      ...overrides
    };
  }

  function getEmbedStatusElement() {
    return document.querySelector<HTMLElement>('[data-embed-status]');
  }

  beforeEach(() => {
    createMock.mockClear();
    consentMock.grant.mockReset();
    consentMock.revoke.mockReset();
    consentMock.status.mockReset();
    consentMock.status.mockReturnValue('pending');
    planResponses.length = 0;
    fragmentResponses.length = 0;
    fetchMock.mockReset();
    fetchMock.mockImplementation((request: Parameters<typeof fetch>[0]) => {
      const url = resolveRequestUrl(request);
      if (url.includes('/api/default-plan') || url.includes('/v1/plan/default')) {
        const nextPlan = planResponses.shift();
        if (!nextPlan) {
          return Promise.reject(new Error(`No plan response queued for ${url}`));
        }
        return nextPlan();
      }
      if (url.includes('/app/(seo)/fragment') || url.includes('/v1/fragment/')) {
        const nextFragment = fragmentResponses.shift();
        if (!nextFragment) {
          return Promise.reject(new Error(`No fragment response queued for ${url}`));
        }
        return nextFragment();
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url || 'unknown request'}`));
    });
    (globalThis as unknown as { fetch?: unknown }).fetch = fetchMock as unknown as typeof fetch;
    document.head.querySelectorAll('script[data-events-hub-embed]').forEach((script) => script.remove());
    delete (window as unknown as { EventsHubEmbed?: unknown }).EventsHubEmbed;
    process.env.NEXT_PUBLIC_EMBED_SRC = '';
    process.env.NEXT_PUBLIC_EMBED_MODE = 'linked';
    process.env.NEXT_PUBLIC_CONFIG_URL = 'https://config.townthink.com/config/tenants/demo.json';
    process.env.NEXT_PUBLIC_API_BASE = 'https://api.townthink.com';
    process.env.NEXT_PUBLIC_PLAN_MODE = 'beta';
  });

  afterEach(() => {
    delete (window as unknown as { EventsHubEmbed?: unknown }).EventsHubEmbed;
    delete (globalThis as unknown as { fetch?: unknown }).fetch;
    cleanup();
  });

  it('hydrates the embed in linked mode and attaches a shadow root', async () => {
    const apiPlan = createPlan();
    apiPlan.meta = { ...apiPlan.meta, planHash: 'hash-api' };
    queuePlanSuccess(apiPlan);

    queueFragmentSuccesses();

    render(<Page />);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    const container = document.querySelector('[data-embed-container]') as HTMLDivElement;
    expect(container).toBeTruthy();
    expect(container.shadowRoot ?? container.querySelector('[data-shadow-root]')).toBeTruthy();
    expect(container.dataset.planMode).toBe('beta');
    await waitFor(() => {
      const handle = createMock.mock.results[0]?.value as MockHandle | undefined;
      expect(handle?.hydrateNext).toHaveBeenCalledWith({
        plan: expect.objectContaining({ meta: expect.objectContaining({ planHash: 'hash-api' }) })
      });
    });
    expect(getEmbedStatusElement()?.textContent ?? '').toContain('Embed ready (stored default plan).');
    expect(container.dataset.planSource).toBe('api');
    expect(container.dataset.planOrigin).toBe('stored');
    expect(container.dataset.planHash).toBe('hash-api');
    expect(container.dataset.planKeys?.split(',')).toEqual(['block-one', 'block-who', 'block-three']);
  });

  it('loads the external script when NEXT_PUBLIC_EMBED_MODE=external', async () => {
    process.env.NEXT_PUBLIC_EMBED_MODE = 'external';
    process.env.NEXT_PUBLIC_EMBED_SRC = 'https://cdn.townthink.com/hub-embed@latest/hub-embed.umd.js';

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

    const apiPlan = createPlan();
    apiPlan.meta = { ...apiPlan.meta, planHash: 'hash-external' };
    queuePlanSuccess(apiPlan);

    queueFragmentSuccesses();

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

  it('falls back to the sample plan when the API fails twice', async () => {
    queuePlanFailure(new Error('network down'));
    queuePlanFailure(new Error('still down'));

    queueFragmentSuccesses();

    render(<Page />);

    await waitFor(() => {
      expectPlanRequests(2);
    });

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    const handle = createMock.mock.results[0]?.value as MockHandle | undefined;
    expect(handle?.hydrateNext).not.toHaveBeenCalled();

    const statusMessage = getEmbedStatusElement()?.textContent ?? '';
    expect(statusMessage).toContain('Unable to load default plan');
    expect(statusMessage).toContain('fallback data');

    const container = document.querySelector('[data-embed-container]') as HTMLDivElement;
    expect(container.dataset.planSource).toBe('fallback');
    expect(container.dataset.planOrigin).toBe('fallback');
  });
});
