import '@testing-library/jest-dom/vitest';
import React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { PageDoc } from '@events-hub/page-schema';
import BlocksClient from '../app/blocks/BlocksClient';
import * as planClient from '../lib/plan-client';
import { ApiError } from '../lib/plan-client';

vi.mock('../lib/plan-client', async () => {
  const actual = await vi.importActual<typeof import('../lib/plan-client')>('../lib/plan-client');
  return {
    ...actual,
    saveDefaultPlan: vi.fn(),
    fetchDefaultPlan: vi.fn()
  };
});

const { saveDefaultPlan, fetchDefaultPlan } = vi.mocked(planClient);

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as any).ResizeObserver = ResizeObserverMock;
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).plausible = vi.fn();
});

function createPlan(overrides?: Partial<PageDoc>): PageDoc {
  const base = createDefaultDemoPlan({ planHash: overrides?.meta?.planHash ?? 'hash-1' });
  return {
    ...base,
    ...overrides,
    blocks: overrides?.blocks ?? base.blocks,
    meta: {
      ...base.meta,
      ...(overrides?.meta ?? {})
    }
  };
}

function reorderBlocks(blocks: PageDoc['blocks'], fromKey: string, targetIndex: number) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order).map((block) => ({ ...block }));
  const fromIndex = sorted.findIndex((block) => block.key === fromKey);
  if (fromIndex === -1) {
    return sorted;
  }
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(targetIndex, 0, moved);
  return sorted.map((block, index) => ({ ...block, order: index }));
}

describe('BlocksClient', () => {
  it('renders summaries for the seeded plan and disables save until changes occur', () => {
    const plan = createPlan();
    render(<BlocksClient initialPlan={{ plan, encodedPlan: 'encoded', planHash: 'hash-1', updatedAt: plan.updatedAt }} />);

    expect(screen.getByText(/Using the seeded default block order/i)).toBeInTheDocument();
    expect(screen.getByText(/Slides: 1/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('reorders blocks via control buttons and persists changes', async () => {
    const plan = createPlan();
    const updatedPlan = createPlan({
      blocks: reorderBlocks(plan.blocks, 'hero', 2),
      meta: { ...plan.meta, planHash: 'hash-2', flags: { ...plan.meta.flags, seeded: false } },
      updatedAt: '2025-03-01T00:00:00.000Z'
    });

    saveDefaultPlan.mockResolvedValue({
      plan: updatedPlan,
      encodedPlan: 'encoded',
      planHash: 'hash-2',
      updatedAt: updatedPlan.updatedAt
    });

    render(<BlocksClient initialPlan={{ plan, encodedPlan: 'encoded', planHash: 'hash-1', updatedAt: plan.updatedAt }} />);

    fireEvent.click(screen.getByRole('button', { name: /move weekend highlights down/i }));

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveDefaultPlan).toHaveBeenCalledTimes(1);
      expect(saveButton).toBeDisabled();
    });

    const payloadPlan = saveDefaultPlan.mock.calls[0][0] as PageDoc;
    const heroOrder = payloadPlan.blocks.find((block) => block.key === 'hero')?.order;
    expect(heroOrder).toBe(2);
    expect(screen.getByText('Plan updated')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Using the seeded default block order/i)).not.toBeInTheDocument();
    });
    const plausibleCalls = (window as any).plausible.mock.calls;
    expect(plausibleCalls.some(([, args]: any) => args?.props?.blockCount === plan.blocks.length)).toBe(true);
  });

  it('handles optimistic concurrency conflicts by refetching', async () => {
    const plan = createPlan();
    const refreshedPlan = createPlan({
      blocks: reorderBlocks(plan.blocks, 'map', 0),
      meta: { ...plan.meta, planHash: 'hash-3', flags: { ...plan.meta.flags, seeded: false } }
    });

    saveDefaultPlan.mockRejectedValue(new ApiError(412, 'Precondition Failed', { planHash: 'hash-2' }));
    fetchDefaultPlan.mockResolvedValue({
      plan: refreshedPlan,
      encodedPlan: 'encoded',
      planHash: 'hash-3',
      updatedAt: refreshedPlan.updatedAt
    });

    render(<BlocksClient initialPlan={{ plan, encodedPlan: 'encoded', planHash: 'hash-1', updatedAt: plan.updatedAt }} />);

    fireEvent.click(screen.getByRole('button', { name: /move weekend highlights down/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(fetchDefaultPlan).toHaveBeenCalled();
    });

    expect(screen.getByText(/plan changed remotely/i)).toBeInTheDocument();
  });
});
