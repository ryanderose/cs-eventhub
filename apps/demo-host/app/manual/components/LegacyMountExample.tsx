'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedHandle } from '@events-hub/embed-sdk';
import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { DEFAULT_TENANT, getEmbedMode, getEmbedSrc } from '../../../lib/env';
import { loadEmbedModule } from '../../../lib/embed-loader';
import { DEMO_EMBED_THEME } from '../../../lib/embed-theme';

const SCRIPT_ID = 'manual-legacy-loader';

export function LegacyMountExample() {
  const tenantId = DEFAULT_TENANT;
  const plan = useMemo(() => createDefaultDemoPlan({ tenantId }), [tenantId]);
  const embedMode = useMemo(() => getEmbedMode(), []);
  const embedSrc = useMemo(() => getEmbedSrc(), []);
  const handleRef = useRef<EmbedHandle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    async function boot() {
      setStatus('loading');
      setError(null);
      try {
        const embedModule = await loadEmbedModule(embedMode, embedSrc);
        if (disposed) return;
        const handle = embedModule.create({
          tenantId,
          initialPlan: plan,
          theme: { ...DEMO_EMBED_THEME },
          historyMode: 'hash',
          legacyMountBefore: `#${SCRIPT_ID}`
        });
        handleRef.current = handle;
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
  }, [embedMode, embedSrc, plan, tenantId]);

  return (
    <div>
      <p>
        This harness omits a container and relies on <code>data-mount-before</code> semantics. The SDK inserts the embed right before the
        simulated loader script below.
      </p>
      <div className="legacy-mount-harness">
        <script id={SCRIPT_ID} data-manual-legacy-script="" />
      </div>
      <p className="status" role="status">
        {status === 'loading' && 'Waiting for legacy mount…'}
        {status === 'ready' && 'Legacy mount complete — inspect DOM order above.'}
        {status === 'error' && `Legacy mount failed${error ? `: ${error}` : ''}`}
      </p>
    </div>
  );
}
