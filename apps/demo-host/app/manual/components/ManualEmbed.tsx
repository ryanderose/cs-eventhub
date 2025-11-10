'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import { createDefaultDemoPlan } from '@events-hub/default-plan';
import { DEFAULT_TENANT, getEmbedMode, getEmbedSrc } from '../../../lib/env';
import { loadEmbedModule } from '../../../lib/embed-loader';
import { DEMO_EMBED_THEME } from '../../../lib/embed-theme';

type ManualEmbedProps = {
  embedId?: string;
  tenantId?: string;
  plan?: PageDoc;
  config?: Partial<EmbedConfig>;
  className?: string;
  simulateTrustedTypesFailure?: boolean;
};

export function ManualEmbed({ embedId, tenantId = DEFAULT_TENANT, plan, config, className, simulateTrustedTypesFailure = false }: ManualEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<EmbedHandle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const embedMode = useMemo(() => getEmbedMode(), []);
  const embedSrc = useMemo(() => getEmbedSrc(), []);
  const planDoc = useMemo(() => plan ?? createDefaultDemoPlan({ tenantId }), [plan, tenantId]);
  const configSignature = useMemo(() => JSON.stringify(config ?? {}), [config]);
  const resolvedConfig = useMemo<Partial<EmbedConfig>>(() => JSON.parse(configSignature) as Partial<EmbedConfig>, [configSignature]);
  const restoreTrustedTypesRef = useRef<(() => void) | null>(null);

  function applyTrustedTypesFailure() {
    if (typeof window === 'undefined') {
      return null;
    }
    const descriptor = Object.getOwnPropertyDescriptor(window, 'trustedTypes');
    const stub = {
      createPolicy() {
        throw new Error('Trusted Types policy creation blocked for manual test.');
      },
      getPolicy() {
        return null;
      }
    };
    Object.defineProperty(window, 'trustedTypes', {
      configurable: true,
      value: stub
    });
    return () => {
      if (descriptor) {
        Object.defineProperty(window, 'trustedTypes', descriptor);
      } else {
        Reflect.deleteProperty(window as typeof window & { trustedTypes?: typeof stub }, 'trustedTypes');
      }
    };
  }

  useEffect(() => {
    let disposed = false;
    async function boot() {
      setStatus('loading');
      setError(null);
      try {
        if (simulateTrustedTypesFailure) {
          restoreTrustedTypesRef.current = applyTrustedTypesFailure();
        }
        const embedModule = await loadEmbedModule(embedMode, embedSrc);
        if (!containerRef.current || disposed) {
          return;
        }
        const handle = embedModule.create({
          container: containerRef.current,
          tenantId,
          initialPlan: planDoc,
          theme: { ...DEMO_EMBED_THEME },
          embedId,
          ...resolvedConfig
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
      restoreTrustedTypesRef.current?.();
      restoreTrustedTypesRef.current = null;
    };
  }, [embedMode, embedSrc, planDoc, tenantId, embedId, resolvedConfig, simulateTrustedTypesFailure]);

  return (
    <div className={className}>
      <div ref={containerRef} data-embed-container="" />
      <p className="status" role="status">
        {status === 'loading' && 'Mounting embed…'}
        {status === 'ready' && 'Embed ready.'}
        {status === 'error' && `Failed to mount embed${error ? ` — ${error}` : ''}`}
      </p>
    </div>
  );
}
