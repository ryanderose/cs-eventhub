'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmbedConfig, EmbedHandle } from '@events-hub/embed-sdk';
import type { PageDoc } from '@events-hub/page-schema';
import { DEFAULT_TENANT, getEmbedMode, getEmbedSrc } from '../../../lib/env';
import { loadEmbedModule } from '../../../lib/embed-loader';
import { DEMO_EMBED_THEME } from '../../../lib/embed-theme';
import { useConsentStatus } from '../../../lib/consent';

export type ManualEmbedProps = {
  embedId?: string;
  tenantId?: string;
  plan: PageDoc;
  planHash?: string | null;
  config?: Partial<EmbedConfig>;
  className?: string;
  simulateTrustedTypesFailure?: boolean;
};

export function ManualEmbed({
  embedId,
  tenantId = DEFAULT_TENANT,
  plan,
  planHash,
  config,
  className,
  simulateTrustedTypesFailure = false
}: ManualEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<EmbedHandle | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const embedMode = useMemo(() => getEmbedMode(), []);
  const embedSrc = useMemo(() => getEmbedSrc(), []);
  const resolvedTenantId = plan.tenantId ?? tenantId;
  const configSignature = useMemo(() => JSON.stringify(config ?? {}), [config]);
  const resolvedConfig = useMemo<Partial<EmbedConfig>>(() => JSON.parse(configSignature) as Partial<EmbedConfig>, [configSignature]);
  const restoreTrustedTypesRef = useRef<(() => void) | null>(null);
  const currentPlanHashRef = useRef<string | null>(planHash ?? plan.meta?.planHash ?? null);
  const initialPlanRef = useRef<PageDoc | null>(null);
  const consentStatus = useConsentStatus();
  const consentDescription =
    consentStatus === 'granted'
      ? 'Consent granted — analytics emit immediately.'
      : 'Consent pending — telemetry buffers until consent is granted.';

  if (!initialPlanRef.current) {
    initialPlanRef.current = plan;
  }

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
      if (handleRef.current || !containerRef.current) {
        return;
      }
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
        const initialPlan = initialPlanRef.current as PageDoc;
        const handle = embedModule.create({
          container: containerRef.current,
          tenantId: resolvedTenantId,
          initialPlan,
          theme: { ...DEMO_EMBED_THEME },
          embedId,
          ...resolvedConfig
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
      restoreTrustedTypesRef.current?.();
      restoreTrustedTypesRef.current = null;
    };
  }, [embedMode, embedSrc, resolvedTenantId, embedId, resolvedConfig, simulateTrustedTypesFailure]);

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
    <div className={className}>
      <div ref={containerRef} data-embed-container="" />
      <p className="status" role="status" data-consent-status={consentStatus}>
        {status === 'loading' && 'Mounting embed…'}
        {status === 'ready' && 'Embed ready.'}
        {status === 'error' && `Failed to mount embed${error ? ` — ${error}` : ''}`}
        <span className="muted consent-status">{consentDescription}</span>
      </p>
    </div>
  );
}
