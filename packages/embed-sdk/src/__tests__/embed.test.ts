import type { PageDoc } from '@events-hub/page-schema';
import type { SdkEvent } from '@events-hub/telemetry';
import { afterEach, describe, expect, it } from 'vitest';
import { consent, create } from '../index';

const demoPlan: PageDoc = {
  id: 'demo-plan',
  title: 'Demo',
  path: '/events',
  tenantId: 'demo',
  updatedAt: new Date().toISOString(),
  version: '1.6',
  blocks: [
    {
      id: 'filter-1',
      key: 'filter-1',
      kind: 'filter-bar',
      version: '1.6',
      order: 0,
      layout: { fullWidth: true },
      data: {
        facets: [],
        active: {},
        sortOptions: []
      }
    }
  ],
  meta: {
    locale: 'en-US',
    cacheTags: [],
    flags: {}
  },
  planCursors: []
};

afterEach(() => {
  consent.revoke();
  document.body.innerHTML = '';
});

describe('embed SDK create', () => {
  it('mounts shadow root and flushes analytics after consent', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const received: SdkEvent[] = [];
    const handle = create({
      container,
      tenantId: 'demo',
      useShadowDom: false,
      initialPlan: demoPlan,
      onEvent: (event) => received.push(event)
    });
    const host = handle.getShadowRoot();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const button = host.querySelector('button');
    expect(button).not.toBeNull();
    button?.dispatchEvent(new Event('click', { bubbles: true }));
    expect(received).toHaveLength(0);
    consent.grant('user');
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('filters_reset');
    handle.destroy();
  });
});
