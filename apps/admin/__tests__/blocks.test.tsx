import '@testing-library/jest-dom/vitest';
import React from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
});

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
      createBlock('block-one', 'Block One', 0),
      createBlock('block-who', 'Block Who', 1),
      createBlock('block-three', 'Block Three', 2)
    ],
    meta: {
      planHash: 'hash-1',
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

function createBlock(key: string, title: string, order: number) {
  return {
    id: key,
    key,
    kind: 'promo-slot',
    version: '1.6' as const,
    order,
    layout: { fullWidth: true },
    analytics: {
      viewKey: `default:${key}`,
      surface: 'default-plan',
      attributes: { label: title }
    },
    data: {
      slotId: key,
      advertiser: title,
      disclosure: 'Sponsored',
      measurement: {},
      safety: { blockedCategories: [], brandSuitability: 'moderate' as const }
    }
  };
}

describe('BlocksClient', () => {
  it('renders the block list and disables save until changes occur', () => {
    const plan = createPlan();
    render(<BlocksClient initialPlan={{ plan, encodedPlan: 'encoded', planHash: 'hash-1', updatedAt: plan.updatedAt }} />);

    expect(screen.getByText('Block One')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
  });

  it('reorders blocks via control buttons and persists changes', async () => {
    const plan = createPlan();
    const updatedPlan = createPlan({
      blocks: [
        createBlock('block-who', 'Block Who', 0),
        createBlock('block-one', 'Block One', 1),
        createBlock('block-three', 'Block Three', 2)
      ],
      meta: { ...plan.meta, planHash: 'hash-2' }
    });

    saveDefaultPlan.mockResolvedValue({
      plan: updatedPlan,
      encodedPlan: 'encoded',
      planHash: 'hash-2',
      updatedAt: updatedPlan.updatedAt
    });

    render(<BlocksClient initialPlan={{ plan, encodedPlan: 'encoded', planHash: 'hash-1', updatedAt: plan.updatedAt }} />);

    fireEvent.click(screen.getAllByRole('button', { name: /move block one down/i })[0]);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveDefaultPlan).toHaveBeenCalledTimes(1);
      expect(saveButton).toBeDisabled();
    });

    const payloadPlan = saveDefaultPlan.mock.calls[0][0] as PageDoc;
    const orderLookup = Object.fromEntries(payloadPlan.blocks.map((block) => [block.key, block.order]));
    expect(orderLookup['block-one']).toBe(1);
    expect(orderLookup['block-who']).toBe(0);
    expect(orderLookup['block-three']).toBe(2);

    expect(screen.getByText('Plan updated')).toBeInTheDocument();
  });

  it('handles optimistic concurrency conflicts by refetching', async () => {
    const plan = createPlan();
    const refreshedPlan = createPlan({
      blocks: [
        createBlock('block-three', 'Block Three', 0),
        createBlock('block-one', 'Block One', 1),
        createBlock('block-who', 'Block Who', 2)
      ],
      meta: { ...plan.meta, planHash: 'hash-3' }
    });

    saveDefaultPlan.mockRejectedValue(new ApiError(412, 'Precondition Failed', { planHash: 'hash-2' }));
    fetchDefaultPlan.mockResolvedValue({
      plan: refreshedPlan,
      encodedPlan: 'encoded',
      planHash: 'hash-3',
      updatedAt: refreshedPlan.updatedAt
    });

    render(<BlocksClient initialPlan={{ plan, encodedPlan: 'encoded', planHash: 'hash-1', updatedAt: plan.updatedAt }} />);

    fireEvent.click(screen.getAllByRole('button', { name: /move block one down/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(fetchDefaultPlan).toHaveBeenCalled();
    });

    expect(screen.getByText(/plan changed remotely/i)).toBeInTheDocument();
  });
});
