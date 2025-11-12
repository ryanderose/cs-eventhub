import '@testing-library/jest-dom/vitest';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { SnippetManifestSummary } from '../lib/snippet-types';
import SnippetGenerator from '../app/snippets/SnippetGenerator';
import validManifest from './__fixtures__/manifest-valid.json';
import tamperedManifest from './__fixtures__/manifest-tampered.json';
import * as planClient from '../lib/plan-client';

vi.mock('../lib/plan-client', async () => {
  const actual = await vi.importActual<typeof import('../lib/plan-client')>('../lib/plan-client');
  return {
    ...actual,
    fetchSnippetList: vi.fn()
  };
});

const { fetchSnippetList } = vi.mocked(planClient);

const defaults = { tenantId: 'demo', basePath: '/events', cdnOrigin: undefined };

function mockSnippetResponse(manifests: SnippetManifestSummary[]) {
  fetchSnippetList.mockResolvedValue({
    manifests,
    defaults
  });
}

describe('SnippetGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses to copy when manifest drift or SRI issues exist', async () => {
    mockSnippetResponse([tamperedManifest as SnippetManifestSummary]);

    render(<SnippetGenerator defaultTenant="demo" defaultBasePath="/events" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/cdn drift/i);
    expect(alert).toHaveTextContent(/missing integrity metadata/i);

    const copyButton = await screen.findByRole('button', { name: 'Copy snippet' });
    expect(copyButton).toBeDisabled();
  });

  it('renders snippet with crossorigin + integrity attributes for valid manifest', async () => {
    mockSnippetResponse([validManifest as SnippetManifestSummary]);

    render(<SnippetGenerator defaultTenant="demo" defaultBasePath="/events" />);

    await waitFor(() => {
      expect(fetchSnippetList).toHaveBeenCalled();
    });

    const textarea = await screen.findByLabelText('Copy/paste snippet');
    const snippetValue = textarea instanceof HTMLTextAreaElement ? textarea.value : textarea.textContent ?? '';
    expect(snippetValue).toContain('crossorigin="anonymous"');
    expect(snippetValue).toContain('sha384-CZjlZd4Fk4Lz2e1bbG4sgFYhJ70dWM953mc5XEfUJrHDIusvTkyvtAJH4k0Vp4ef');

    const copyButton = await screen.findByRole('button', { name: 'Copy snippet' });
    expect(copyButton).toBeEnabled();
  });
});
