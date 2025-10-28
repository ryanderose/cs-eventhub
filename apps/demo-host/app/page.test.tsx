import { render, waitFor } from '@testing-library/react';
import type { PageDoc } from '@events-hub/page-schema';
import Page from './page';

const samplePlan: PageDoc = {
  id: 'demo-plan',
  title: 'Demo Host Plan',
  path: '/demo',
  description: 'Plan returned by the config API',
  updatedAt: new Date().toISOString(),
  version: '1.5' as const,
  tenantId: 'demo-tenant',
  blocks: [],
  planCursors: [],
  meta: {
    planHash: 'hash',
    composerVersion: 'test',
    generatedAt: new Date().toISOString(),
    locale: 'en-US',
    cacheTags: [],
    flags: {}
  }
};

describe('Page', () => {
  it('hydrates the embed into a shadow root when linked mode is active', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => samplePlan
    })) as unknown as typeof fetch;

    vi.stubGlobal('fetch', fetchMock);

    const view = render(await Page());

    await waitFor(() => {
      const host = view.container.querySelector('#events-hub-embed');
      expect(host).toBeInTheDocument();
      const shadowRoot = host?.shadowRoot;
      expect(shadowRoot).not.toBeNull();
      const region = shadowRoot?.querySelector('[data-root]');
      expect(region).toHaveAttribute('aria-label', 'Demo Host Plan');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('injects the external SDK script when external mode is requested', async () => {
    process.env.NEXT_PUBLIC_EMBED_MODE = 'external';
    process.env.NEXT_PUBLIC_EMBED_SRC = 'https://cdn.events-hub.dev/embed/sdk/latest/index.umd.js';

    const embedModule = await import('@events-hub/embed-sdk/dist/index.esm.js');
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => samplePlan
    })) as unknown as typeof fetch);

    const appendSpy = vi
      .spyOn(document.head, 'appendChild')
      .mockImplementation((element: Node) => {
        const script = element as HTMLScriptElement;
        queueMicrotask(() => {
          window.EventsHubEmbed = embedModule;
          script.onload?.(new Event('load'));
        });
        return element;
      });

    const view = render(await Page());

    await waitFor(() => {
      const host = view.container.querySelector('#events-hub-embed');
      expect(host?.shadowRoot).not.toBeNull();
    });

    expect(appendSpy).toHaveBeenCalled();

    appendSpy.mockRestore();
    window.EventsHubEmbed = undefined;
  });
});
