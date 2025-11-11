'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import { DEFAULT_TENANT, getEmbedMode, getEmbedSrc } from '../../../lib/env';
import { loadEmbedModule } from '../../../lib/embed-loader';
import { DEMO_EMBED_THEME } from '../../../lib/embed-theme';
import { useConsentStatus } from '../../../lib/consent';

const SCRIPT_ID = 'manual-legacy-loader';

export type LegacyMountExampleProps = {
  tenantId?: string;
  plan: PageDoc;
  planHash?: string | null;
};

export function LegacyMountExample({ tenantId = DEFAULT_TENANT, plan, planHash }: LegacyMountExampleProps) {
  const embedMode = useMemo(() => getEmbedMode(), []);
  const embedSrc = useMemo(() => getEmbedSrc(), []);
  const handleRef = useRef<EmbedHandle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const currentPlanHashRef = useRef<string | null>(planHash ?? plan.meta?.planHash ?? null);
  const initialPlanRef = useRef<PageDoc | null>(null);
  const consentStatus = useConsentStatus();
  const consentDescription =
    consentStatus === 'granted'
      ? 'Consent granted — telemetry flushes immediately.'
      : 'Consent pending — telemetry buffering.';

  if (!initialPlanRef.current) {
    initialPlanRef.current = plan;
  }

  useEffect(() => {
    let disposed = false;
    async function boot() {
      if (handleRef.current) {
        return;
      }
      setStatus('loading');
      setError(null);
      try {
        const embedModule = await loadEmbedModule(embedMode, embedSrc);
        if (disposed) return;
        const initialPlan = initialPlanRef.current as PageDoc;
        const handle = embedModule.create({
          tenantId,
          initialPlan,
          theme: { ...DEMO_EMBED_THEME },
          historyMode: 'hash',
          legacyMountBefore: `#${SCRIPT_ID}`
        });
        handleRef.current = handle;
        currentPlanHashRef.current = initialPlan.meta?.planHash ?? null;
        setStatus('ready');
      } catch (err) {
        if (disposed) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    boot();

    return () => {
      disposed = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [embedMode, embedSrc, tenantId]);

  useEffect(() => {
    const nextHash = planHash ?? plan.meta?.planHash ?? null;
    const handle = handleRef.current;
    if (!handle) {
      currentPlanHashRef.current = nextHash;
      initialPlanRef.current = plan;
      return;
    }
    if (!nextHash || nextHash === currentPlanHashRef.current) {
      initialPlanRef.current = plan;
      return;
    }
    handle.hydrateNext({ plan });
    currentPlanHashRef.current = nextHash;
    initialPlanRef.current = plan;
  }, [plan, planHash]);

  return (
    <div>
      <p>
        This harness omits a container and relies on <code>data-mount-before</code> semantics. The SDK inserts the embed right before the
        simulated loader script below.
      </p>
      <div className="legacy-mount-harness">
        <script id={SCRIPT_ID} data-manual-legacy-script="" />
      </div>
      <p className="status" role="status" data-consent-status={consentStatus}>
        {status === 'loading' && 'Waiting for legacy mount…'}
        {status === 'ready' && 'Legacy mount complete — inspect DOM order above.'}
        {status === 'error' && `Legacy mount failed${error ? `: ${error}` : ''}`}
        <span className="muted consent-status">{consentDescription}</span>
      </p>
    </div>
  );
}
