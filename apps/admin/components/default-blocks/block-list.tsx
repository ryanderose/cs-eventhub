'use client';

import React, { useCallback, useEffect, useMemo, useState, useTransition, type CSSProperties } from 'react';
import { DndContext, PointerSensor, KeyboardSensor, DragEndEvent, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { PageDoc, BlockInstance } from '@events-hub/page-schema';
import { ADMIN_DEFAULT_PLAN_SPANS, recordAdminDefaultPlan } from '@events-hub/telemetry';

type DefaultPlanResponse = {
  plan: PageDoc;
  encodedPlan: string;
  planHash: string;
  updatedAt: string;
};

type BlockListProps = {
  initialPlan: PageDoc;
  apiBase: string;
  planHash: string;
  tenantId: string;
};

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

type BlockRowProps = {
  block: BlockInstance;
  index: number;
  onMove: (id: string, targetIndex: number) => void;
  total: number;
};

const ADMIN_BLOCKS_ROUTE = '/blocks';
const ADMIN_BLOCKS_SESSION = 'admin.blocks';

function BlockRow({ block, index, onMove, total }: BlockRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: '#f7f9fb',
    border: '1px solid #d3dae6',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} aria-roledescription="sortable item">
      <button
        type="button"
        {...listeners}
        aria-label={`Drag ${block.key}`}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'grab',
          fontSize: 18,
          lineHeight: 1
        }}
      >
        ☰
      </button>
      <div style={{ flexGrow: 1 }}>
        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
          <span style={{ marginRight: 8, color: '#4a5a74' }}>{index + 1}.</span>
          {block.data && typeof block.data === 'object' && 'title' in block.data
            ? String((block.data as Record<string, unknown>).title)
            : block.key}
        </div>
        <div style={{ fontSize: 12, color: '#4a5a74' }}>
          kind: {block.kind} · id: {block.id}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          type="button"
          onClick={() => onMove(block.id, index - 1)}
          disabled={index === 0}
          style={{ padding: '4px 8px', fontSize: 12 }}
        >
          Move up
        </button>
        <button
          type="button"
          onClick={() => onMove(block.id, index + 1)}
          disabled={index === total - 1}
          style={{ padding: '4px 8px', fontSize: 12 }}
        >
          Move down
        </button>
      </div>
    </li>
  );
}

export function BlockList({ initialPlan, apiBase, planHash: initialHash, tenantId }: BlockListProps) {
  const sessionId = ADMIN_BLOCKS_SESSION;
  const route = ADMIN_BLOCKS_ROUTE;
  const [referencePlan, setReferencePlan] = useState<PageDoc>(initialPlan);
  const [blocks, setBlocks] = useState<BlockInstance[]>(() => [...initialPlan.blocks]);
  const [planHash, setPlanHash] = useState(initialHash);
  const [updatedAt, setUpdatedAt] = useState(initialPlan.updatedAt);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setReferencePlan(initialPlan);
    setBlocks(initialPlan.blocks);
    setPlanHash(initialHash);
    setUpdatedAt(initialPlan.updatedAt);
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
      status: 'success',
      envelope: {
        tenantId,
        planHash: initialHash,
        route,
        sessionId,
        ts: Date.now()
      },
      source: 'admin-ui'
    });
  }, [initialPlan, initialHash]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const isDirty = useMemo(() => {
    const referenceIds = referencePlan.blocks.map((block) => block.id);
    const currentIds = blocks.map((block) => block.id);
    return referenceIds.some((id, idx) => id !== currentIds[idx]);
  }, [referencePlan.blocks, blocks]);

  const moveBlock = useCallback(
    (id: string, targetIndex: number) => {
      const currentIndex = blocks.findIndex((block) => block.id === id);
      if (currentIndex === -1) return;
      if (targetIndex < 0 || targetIndex >= blocks.length) return;
      const updated = arrayMove(blocks, currentIndex, targetIndex).map((block, index) => ({
        ...block,
        order: index
      }));
      setBlocks(updated);
    },
    [blocks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const currentIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);
      if (currentIndex === -1 || newIndex === -1) return;
      const updated = arrayMove(blocks, currentIndex, newIndex).map((block, index) => ({
        ...block,
        order: index
      }));
      setBlocks(updated);
    },
    [blocks]
  );

  const refetchPlan = useCallback(async (): Promise<DefaultPlanResponse | null> => {
    const response = await fetch(`${apiBase}/v1/plan/default?tenantId=${tenantId}`, { cache: 'no-store' });
    if (!response.ok) {
      recordAdminDefaultPlan({
        type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
        status: 'error',
        envelope: { tenantId, route, sessionId, ts: Date.now() },
        source: 'admin-ui',
        message: `Refetch failed (${response.status})`
      });
      return null;
    }
    const next = (await response.json()) as DefaultPlanResponse;
    recordAdminDefaultPlan({
      type: ADMIN_DEFAULT_PLAN_SPANS.fetch,
      status: 'success',
      envelope: { tenantId, planHash: next.planHash, route, sessionId, ts: Date.now() },
      source: 'admin-ui'
    });
    return next;
  }, [apiBase, route, sessionId, tenantId]);

  const handleSave = useCallback(async () => {
    if (!isDirty || saveState.status === 'saving') {
      return;
    }

    setSaveState({ status: 'saving' });
    const payload = {
      plan: {
        ...referencePlan,
        blocks: blocks.map((block, index) => ({
          ...block,
          order: index
        }))
      }
    };

    try {
      const response = await fetch(`${apiBase}/v1/plan/default?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'if-match': planHash
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 412) {
        const conflictPayload = (await response.json()) as { planHash?: string };
        const conflictHash = conflictPayload.planHash ?? planHash;
        recordAdminDefaultPlan({
          type: ADMIN_DEFAULT_PLAN_SPANS.save,
          status: 'conflict',
          envelope: { tenantId, planHash: conflictHash, route, sessionId, ts: Date.now() },
          message: 'Plan hash mismatch',
          source: 'admin-ui'
        });
        const latest = await refetchPlan();
        if (latest) {
          setReferencePlan(latest.plan);
          setBlocks(latest.plan.blocks);
          setPlanHash(latest.planHash);
          setUpdatedAt(latest.updatedAt);
        }
        setSaveState({
          status: 'error',
          message: 'Your view was stale. Reloaded the latest plan—review and save again.'
        });
        return;
      }

      if (!response.ok) {
        const message = `Save failed (${response.status})`;
        setSaveState({ status: 'error', message });
        recordAdminDefaultPlan({
          type: ADMIN_DEFAULT_PLAN_SPANS.save,
          status: 'error',
          envelope: { tenantId, planHash, route, sessionId, ts: Date.now() },
          message,
          source: 'admin-ui'
        });
        return;
      }

      const result = (await response.json()) as DefaultPlanResponse;
      setReferencePlan(result.plan);
      setBlocks(result.plan.blocks);
      setPlanHash(result.planHash);
      setUpdatedAt(result.updatedAt);
      recordAdminDefaultPlan({
        type: ADMIN_DEFAULT_PLAN_SPANS.save,
        status: 'success',
        envelope: { tenantId, planHash: result.planHash, route, sessionId, ts: Date.now() },
        source: 'admin-ui'
      });
      setSaveState({ status: 'success', message: 'Plan updated' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      setSaveState({ status: 'error', message });
      recordAdminDefaultPlan({
        type: ADMIN_DEFAULT_PLAN_SPANS.save,
        status: 'error',
        envelope: { tenantId, planHash, route, sessionId, ts: Date.now() },
        message,
        source: 'admin-ui'
      });
    }
  }, [apiBase, blocks, isDirty, planHash, referencePlan, refetchPlan, route, saveState.status, sessionId, tenantId]);

  const triggerSave = useCallback(() => {
    startTransition(() => {
      void handleSave();
    });
  }, [handleSave, startTransition]);

  useEffect(() => {
    if (saveState.status === 'success') {
      const clear = setTimeout(() => setSaveState({ status: 'idle' }), 4000);
      return () => clearTimeout(clear);
    }
    return undefined;
  }, [saveState]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Default Blocks</h1>
        <p style={{ color: '#4a5a74', margin: '4px 0' }}>
          Drag to reorder blocks. Press space to pick up, use arrow keys to move, Enter to drop.
        </p>
        <p style={{ fontSize: 12, color: '#6b778c' }}>
          Last updated: {new Date(updatedAt).toLocaleString()} · Tenant: {tenantId}
        </p>
      </header>

      {saveState.status === 'error' && (
        <div
          role="alert"
          style={{
            border: '1px solid #d1433f',
            background: '#fbeaea',
            color: '#5d1f1f',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16
          }}
        >
          {saveState.message}
        </div>
      )}
      {saveState.status === 'success' && (
        <div
          role="status"
          style={{
            border: '1px solid #3a8038',
            background: '#e7f6e7',
            color: '#1f4f1d',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16
          }}
        >
          {saveState.message}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
        <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {blocks.map((block, index) => (
              <BlockRow key={block.id} block={block} index={index} total={blocks.length} onMove={moveBlock} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => {
            setBlocks(referencePlan.blocks);
            setSaveState({ status: 'idle' });
          }}
          disabled={!isDirty || saveState.status === 'saving'}
          style={{ padding: '10px 16px' }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={triggerSave}
          disabled={!isDirty || saveState.status === 'saving' || isPending}
          style={{ padding: '10px 18px', fontWeight: 600 }}
        >
          {saveState.status === 'saving' || isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
