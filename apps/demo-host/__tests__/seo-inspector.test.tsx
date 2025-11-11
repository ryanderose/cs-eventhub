import '@testing-library/jest-dom/vitest';
import React from 'react';
// Ensure legacy JSX transform finds React when tsconfig uses "jsx": "preserve"
(globalThis as typeof globalThis & { React?: typeof React }).React = React;
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { SeoInspector } from '../app/components/SeoInspector';

const originalFetch = global.fetch;
const originalClipboard = navigator.clipboard;

describe('SeoInspector', () => {
  afterEach(() => {
    cleanup();
    if (originalFetch) {
      global.fetch = originalFetch;
    }
    if (originalClipboard) {
      Object.assign(navigator, { clipboard: originalClipboard });
    } else {
      // @ts-expect-error cleanup clipboard stub
      delete navigator.clipboard;
    }
    vi.restoreAllMocks();
  });

  it('renders parity metrics for list and detail views and copies JSON-LD', async () => {
    const listPayload = {
      html: '',
      cssHash: 'aaa',
      jsonLd: '{"@id":"list"}',
      parity: { diffPercent: 0.4, withinThreshold: true, idsMatch: true }
    };
    const detailPayload = {
      html: '',
      cssHash: 'bbb',
      jsonLd: '{"@id":"detail"}',
      parity: { diffPercent: 0.6, withinThreshold: true, idsMatch: true }
    };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(listPayload), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(detailPayload), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<SeoInspector tenantId="demo" />);

    await waitFor(() => {
      expect(screen.getByText(/List Route/)).toBeVisible();
      expect(screen.getByText(/Detail Route/)).toBeVisible();
    });

    expect(screen.getByText('0.40%')).toBeInTheDocument();
    expect(screen.getByText('0.60%')).toBeInTheDocument();

    const copyButtons = screen.getAllByRole('button', { name: /Copy JSON-LD/i });
    fireEvent.click(copyButtons[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('{"@id":"list"}'));
  });

  it('surfaces upstream error details when the proxy responds with an error payload', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'Proxy failed for tenant demo' }), {
          status: 502,
          headers: { 'content-type': 'application/json' }
        })
      )
    ) as typeof fetch;

    render(<SeoInspector tenantId="demo" />);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts[0]).toHaveTextContent('Proxy failed for tenant demo');
    });
  });
});
