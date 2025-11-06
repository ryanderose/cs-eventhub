'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { relabelBlock, summarizeBlock } from '@events-hub/default-plan';
import type { PageDoc } from '@events-hub/page-schema';
import { ApiError, DefaultPlanResponse, fetchDefaultPlan, saveDefaultPlan } from '../../lib/plan-client';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

type BlockOrder = Array<{ key: string; title: string; summary: string; kind: string; id: string; order: number }>;

type StatusState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

type BlocksClientProps = {
  initialPlan: DefaultPlanResponse;
};

function extractBlocks(plan: PageDoc): BlockOrder {
  return [...plan.blocks]
    .sort((a, b) => a.order - b.order)
    .map((block) => ({
      key: block.key,
      id: block.id,
      kind: block.kind,
      title: resolveBlockTitle(block),
      summary: summarizeBlock(block),
      order: block.order
    }));
}

function resolveBlockTitle(block: PageDoc['blocks'][number]): string {
  return relabelBlock(block);
}

function applyOrderToPlan(plan: PageDoc, order: BlockOrder): PageDoc {
  const updates = new Map(order.map((item, index) => [item.key, index]));
  return {
    ...plan,
    blocks: plan.blocks.map((block) => ({
      ...block,
      order: updates.get(block.key) ?? block.order
    }))
  };
}

type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

type AnalyticsEvent = { action: string; status: string; blockCount: number };

function sendAnalytics(event: AnalyticsEvent) {
  console.debug('admin-default-plan', event);
  if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
    try {
      window.plausible('admin-default-plan', { props: event });
    } catch {
      // ignore analytics failures
    }
  }
}

export default function BlocksClient({ initialPlan }: BlocksClientProps) {
  const [lastSavedPlan, setLastSavedPlan] = useState<PageDoc>(initialPlan.plan);
  const [plan, setPlan] = useState<PageDoc>(initialPlan.plan);
  const [order, setOrder] = useState<BlockOrder>(() => extractBlocks(initialPlan.plan));
  const [status, setStatus] = useState<StatusState>({ kind: 'idle' });
  const [toast, setToast] = useState<ToastState>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [seeded, setSeeded] = useState<boolean>(Boolean(initialPlan.plan.meta?.flags?.seeded));

  const canonicalKeyOrder = useMemo(() => order.map((block) => block.key), [order]);
  const savedKeyOrder = useMemo(
    () => extractBlocks(lastSavedPlan).map((block) => block.key),
    [lastSavedPlan]
  );

  const hasChanges = useMemo(() => {
    if (canonicalKeyOrder.length !== savedKeyOrder.length) return true;
    return canonicalKeyOrder.some((key, index) => key !== savedKeyOrder[index]);
  }, [canonicalKeyOrder, savedKeyOrder]);

  const lastSavedAt = useMemo(() => {
    if (!lastSavedPlan.updatedAt) return null;
    const date = new Date(lastSavedPlan.updatedAt);
    return Number.isNaN(date.getTime()) ? lastSavedPlan.updatedAt : date.toLocaleString();
  }, [lastSavedPlan.updatedAt]);

  useEffect(() => {
    if (toast?.type === 'success') {
      const timeout = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [toast]);

  async function refreshPlan() {
    setStatus({ kind: 'idle' });
    try {
      const latest = await fetchDefaultPlan();
      setPlan(latest.plan);
      setLastSavedPlan(latest.plan);
      setOrder(extractBlocks(latest.plan));
      setSeeded(Boolean(latest.plan.meta?.flags?.seeded));
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to refresh plan after conflict.' });
    }
  }

  function reorderByIndex(list: BlockOrder, fromIndex: number, toIndex: number): BlockOrder {
    if (fromIndex === toIndex) return list;
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next.map((item, index) => ({ ...item, order: index }));
  }

  function reorderByKey(list: BlockOrder, fromKey: string, toKey: string): BlockOrder {
    const fromIndex = list.findIndex((item) => item.key === fromKey);
    const toIndex = list.findIndex((item) => item.key === toKey);
    if (fromIndex === -1 || toIndex === -1) {
      return list;
    }
    return reorderByIndex(list, fromIndex, toIndex);
  }

  function handleDragStart(key: string) {
    setDraggingKey(key);
  }

  function handleDragOver(targetKey: string) {
    if (!draggingKey || draggingKey === targetKey) {
      return;
    }
    setOrder((current) => {
      const updated = reorderByKey(current, draggingKey, targetKey);
      if (updated === current) {
        return current;
      }
      sendAnalytics({ action: 'reorder', status: 'pending', blockCount: current.length });
      return updated;
    });
  }

  function handleDragEnd() {
    setDraggingKey(null);
  }

  async function handleSave() {
    if (!hasChanges || status.kind === 'saving') {
      return;
    }
    setStatus({ kind: 'saving' });
    sendAnalytics({ action: 'save', status: 'pending', blockCount: order.length });
    try {
      const payload = await saveDefaultPlan(applyOrderToPlan(plan, order));
      setPlan(payload.plan);
      setLastSavedPlan(payload.plan);
      setOrder(extractBlocks(payload.plan));
      setSeeded(Boolean(payload.plan.meta?.flags?.seeded));
      setStatus({ kind: 'idle' });
      setToast({ type: 'success', message: 'Plan updated' });
      sendAnalytics({ action: 'save', status: 'success', blockCount: order.length });
    } catch (error) {
      if (error instanceof ApiError && error.status === 412) {
        setStatus({ kind: 'idle' });
        setToast({ type: 'error', message: 'Plan changed remotely. Refreshing…' });
        sendAnalytics({ action: 'save', status: 'conflict', blockCount: order.length });
        await refreshPlan();
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus({ kind: 'error', message });
      setToast({ type: 'error', message: 'Failed to save plan' });
      sendAnalytics({ action: 'save', status: 'error', blockCount: order.length });
    }
  }

  function moveBlock(key: string, direction: -1 | 1) {
    setOrder((current) => {
      const index = current.findIndex((item) => item.key === key);
      if (index === -1) return current;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const updated = reorderByIndex(current, index, nextIndex);
      sendAnalytics({ action: 'reorder', status: 'pending', blockCount: current.length });
      return updated;
    });
  }

  return (
    <section aria-labelledby="default-plan-heading">
      <div role="status" aria-live="polite">
        {toast ? (
          <p className={`callout ${toast.type}`}>{toast.message}</p>
        ) : status.kind === 'saving' ? (
          <p className="muted">Saving…</p>
        ) : null}
      </div>
      <p className="instructions">
        Drag items to reorder. Keyboard: focus a row, press space to lift, use arrow keys to move, and press space again to drop.
      </p>
      {seeded ? (
        <p className="callout info seeded-banner" role="status">
          Using the seeded default block order. Save a change to persist this plan to storage.
        </p>
      ) : (
        <p className="muted">
          Stored default plan{lastSavedAt ? ` · last updated ${lastSavedAt}` : ''}.
        </p>
      )}
      <ol
        className="block-list"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleDragEnd();
        }}
      >
        {order.map((block) => (
          <SortableBlockItem
            key={block.key}
            block={block}
            dragging={draggingKey === block.key}
            onMoveUp={() => moveBlock(block.key, -1)}
            onMoveDown={() => moveBlock(block.key, 1)}
            onDragStart={() => handleDragStart(block.key)}
            onDragEnter={() => handleDragOver(block.key)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </ol>
      <footer className="actions">
        <button type="button" onClick={handleSave} disabled={!hasChanges || status.kind === 'saving'}>
          {status.kind === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOrder(extractBlocks(lastSavedPlan));
            setPlan(lastSavedPlan);
            setSeeded(Boolean(lastSavedPlan.meta?.flags?.seeded));
            setDraggingKey(null);
            setToast(null);
            setStatus({ kind: 'idle' });
            sendAnalytics({ action: 'reset', status: 'success', blockCount: lastSavedPlan.blocks.length });
          }}
          disabled={!hasChanges || status.kind === 'saving'}
        >
          Reset
        </button>
      </footer>
    </section>
  );
}

type SortableBlockItemProps = {
  block: BlockOrder[number];
  dragging: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
};

function SortableBlockItem({
  block,
  dragging,
  onMoveDown,
  onMoveUp,
  onDragStart,
  onDragEnter,
  onDragEnd
}: SortableBlockItemProps) {
  return (
    <li
      className="block-item"
      tabIndex={0}
      data-block-key={block.key}
      aria-roledescription="sortable"
      aria-label={`${block.title} (${block.kind}). ${block.summary}`}
      aria-grabbed={dragging}
      draggable
      onDragStart={(event) => {
        event.dataTransfer?.setData('text/plain', block.key);
        onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragEnter();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDragEnter();
        onDragEnd();
      }}
      onDragEnd={(event) => {
        event.preventDefault();
        onDragEnd();
      }}
    >
      <div className="block-item__content">
        <span className="block-item__position" aria-hidden="true">
          {block.order + 1}
        </span>
        <div>
          <strong>{block.title}</strong>
          <p className="muted">
            {block.summary}
            <br />
            <span className="block-item__meta">
              {block.kind} · {block.id}
            </span>
          </p>
        </div>
      </div>
      <div className="block-item__controls">
        <button type="button" onClick={onMoveUp} aria-label={`Move ${block.title} up`}>
          ↑
        </button>
        <button type="button" onClick={onMoveDown} aria-label={`Move ${block.title} down`}>
          ↓
        </button>
      </div>
    </li>
  );
}
