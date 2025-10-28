import React from 'react';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import Page from '../app/page';
import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';

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

describe('Next.js embed host page', () => {
  beforeEach(() => {
    createMock.mockClear();
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
    cleanup();
  });

  it('hydrates the embed in linked mode and attaches a shadow root', async () => {
    render(<Page />);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    const container = document.querySelector('[data-embed-container]') as HTMLDivElement;
    expect(container).toBeTruthy();
    expect(container.shadowRoot ?? container.querySelector('[data-shadow-root]')).toBeTruthy();
    expect(container.dataset.planMode).toBe('beta');
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
});
