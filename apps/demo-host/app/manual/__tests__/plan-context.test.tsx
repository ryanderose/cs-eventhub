import { render, screen, waitFor } from '@testing-library/react';
import type { PageDoc } from '@events-hub/page-schema';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { DemoPlanProvider, useDemoPlanContext } from '../../../lib/useDemoPlan';
import { useDefaultPlan } from '../../../lib/useDefaultPlan';
import { ManualEmbed } from '../components/ManualEmbed';
import { loadEmbedModule } from '../../../lib/embed-loader';

vi.mock('../../../lib/useDefaultPlan', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/useDefaultPlan')>('../../../lib/useDefaultPlan');
  return {
    ...actual,
    useDefaultPlan: vi.fn()
  };
});

vi.mock('../../../lib/embed-loader', () => ({
  loadEmbedModule: vi.fn()
}));

const mockUseDefaultPlan = vi.mocked(useDefaultPlan);
const mockLoadEmbedModule = vi.mocked(loadEmbedModule);

function createPlan(hash: string, orders: Array<{ key: string; order: number }>): PageDoc {
  return {
    tenantId: 'demo',
    blocks: orders.map(({ key, order }) => ({ key, order, type: key, props: {} })) as PageDoc['blocks'],
    meta: { planHash: hash }
  } as PageDoc;
}

function PlanKeys({ label }: { label: string }) {
  const { plan, planHash } = useDemoPlanContext();
  const orderedKeys = [...plan.blocks].sort((a, b) => a.order - b.order).map((block) => block.key).join(',');
  return (
    <div data-testid={`plan-${label}`}>
      <span>{planHash}</span>
      <span>{orderedKeys}</span>
    </div>
  );
}

beforeEach(() => {
  mockUseDefaultPlan.mockReset();
});

describe('DemoPlanProvider', () => {
  beforeEach(() => {
    const plan = createPlan('stored-hash', [
      { key: 'hero', order: 2 },
      { key: 'filter', order: 1 }
    ]);
    mockUseDefaultPlan.mockReturnValue({
      plan,
      planHash: plan.meta?.planHash ?? 'stored-hash',
      encodedPlan: undefined,
      status: 'ready',
      source: 'api',
      origin: 'stored',
      error: undefined
    });
  });

  it('shares stored plan ordering across consumers without refetching', () => {
    render(
      <DemoPlanProvider tenantId="demo">
        <PlanKeys label="first" />
        <PlanKeys label="second" />
      </DemoPlanProvider>
    );

    expect(mockUseDefaultPlan).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('stored-hash')).toHaveLength(2);
    expect(screen.getAllByText('filter,hero')).toHaveLength(2);
  });
});

describe('ManualEmbed plan rehydration', () => {
  beforeEach(() => {
    mockLoadEmbedModule.mockReset();
  });

  it('hydrates the existing handle when planHash changes', async () => {
    const hydrateNext = vi.fn();
    const destroy = vi.fn();
    const create = vi.fn(() => ({ hydrateNext, destroy }));
    mockLoadEmbedModule.mockResolvedValue({ create });

    const initialPlan = createPlan('plan-a', [
      { key: 'filter', order: 1 },
      { key: 'hero', order: 2 }
    ]);
    const updatedPlan = createPlan('plan-b', [
      { key: 'filter', order: 2 },
      { key: 'hero', order: 1 }
    ]);

    const { rerender, unmount } = render(<ManualEmbed embedId="manual-test" plan={initialPlan} planHash="plan-a" />);

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('Embed ready.')).toBeInTheDocument());

    rerender(<ManualEmbed embedId="manual-test" plan={updatedPlan} planHash="plan-b" />);

    await waitFor(() => expect(hydrateNext).toHaveBeenCalledWith({ plan: updatedPlan }));
    expect(create).toHaveBeenCalledTimes(1);

    unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
