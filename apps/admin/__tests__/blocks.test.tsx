import React from 'react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { PageDoc, BlockInstance } from '@events-hub/page-schema';
import { BlockList } from '../components/default-blocks/block-list';

const tenantId = 'demo';
const apiBase = 'http://localhost:3001';

async function click(element: HTMLElement) {
  await act(async () => {
    element.click();
  });
}

function buildBlock(id: string, order: number, overrides: Partial<BlockInstance> = {}): BlockInstance {
  return {
    id,
    key: id,
    kind: 'collection-rail',
    version: '1.5',
    order,
    data: {
      title: id.replace(/-/g, ' '),
      layout: 'rail',
      events: []
    },
    layout: { fullWidth: true },
    ...overrides
  };
}

function buildPlan(): PageDoc {
  const now = new Date().toISOString();
  return {
    id: 'plan-demo',
    title: 'Default Blocks',
    path: '/',
    description: 'Demo plan',
    tenantId,
    updatedAt: now,
    version: '1.5',
    blocks: [buildBlock('block-one', 0), buildBlock('block-two', 1), buildBlock('block-three', 2)],
    meta: {
      cacheTags: [tenantId],
      flags: {},
      locale: 'en-US'
    },
    planCursors: []
  };
}

describe('<BlockList />', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (global as typeof globalThis).fetch = vi.fn();
  });

  it('renders block rows with instructions', () => {
    render(
      <BlockList initialPlan={buildPlan()} planHash="hash-123" tenantId={tenantId} apiBase={apiBase} />
    );

    expect(screen.getByRole('heading', { name: /default blocks/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Move down/)).toHaveLength(3);
    expect(screen.getByText(/Drag to reorder blocks/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
  });

  it('enables save after reordering and posts updates', async () => {
    const plan = buildPlan();
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        plan: {
          ...plan,
          blocks: [plan.blocks[1], { ...plan.blocks[0], order: 1 }, plan.blocks[2]]
        },
        encodedPlan: 'encoded',
        planHash: 'hash-456',
        updatedAt: new Date(Date.now() + 1000).toISOString()
      })
    } as Response);

    render(<BlockList initialPlan={plan} planHash="hash-123" tenantId={tenantId} apiBase={apiBase} />);

    const moveDownButtons = screen.getAllByRole('button', { name: /^Move down$/ });
    expect(moveDownButtons[0]).not.toBeDisabled();
    await click(moveDownButtons[0]);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    await click(saveButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toContain('/v1/plan/default');
    expect(request?.[1]).toMatchObject({ method: 'PUT', headers: expect.objectContaining({ 'if-match': 'hash-123' }) });

    await waitFor(() => expect(screen.getByText(/Plan updated/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('handles 412 conflicts by refetching latest plan', async () => {
    const plan = buildPlan();
    const fetchMock = vi.mocked(global.fetch);
    const refreshedPlan = {
      plan: {
        ...plan,
        blocks: [plan.blocks[2], plan.blocks[1], plan.blocks[0]].map((block, index) => ({
          ...block,
          order: index
        }))
      },
      encodedPlan: 'encoded',
      planHash: 'hash-latest',
      updatedAt: new Date(Date.now() + 2000).toISOString()
    };

    fetchMock.mockImplementation(async (input, init) => {
      if (init?.method === 'PUT') {
        return {
          ok: false,
          status: 412,
          json: async () => ({ error: 'Plan hash mismatch', planHash: 'hash-current' })
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => refreshedPlan
      } as Response;
    });

    render(<BlockList initialPlan={plan} planHash="hash-123" tenantId={tenantId} apiBase={apiBase} />);

    const moveDownButtons = screen.getAllByRole('button', { name: /^Move down$/ });
    expect(moveDownButtons[0]).not.toBeDisabled();
    await click(moveDownButtons[0]);
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    await click(saveButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('alert')).toHaveTextContent(/stale/i);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    const moveDownAfter = screen.getAllByRole('button', { name: /^Move down$/ });
    expect(moveDownAfter[0]).toBeEnabled();
  });
});
