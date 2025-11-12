'use client';

import { useId, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConsentController } from '../../../lib/consent';

export function ManualHarnessControls() {
  const radioGroupId = useId();
  const descriptionId = `${radioGroupId}-description`;
  const searchParams = useSearchParams();
  const defaultStatus = useMemo<'granted' | 'pending'>(() => {
    const queryValue = searchParams.get('consent');
    return queryValue === 'pending' ? 'pending' : 'granted';
  }, [searchParams]);
  const { status, setStatus } = useConsentController({ source: 'manual-harness', defaultStatus });
  const isGranted = status === 'granted';

  return (
    <section className="manual-harness-controls" aria-labelledby={`${radioGroupId}-label`}>
      <h2 id={`${radioGroupId}-label`}>Manual Harness Controls</h2>
      <p id={descriptionId} className="muted">
        Toggle consent to reproduce buffered telemetry. Pending consent keeps analytics in the SDK buffer; granting flushes everything immediately.
      </p>
      <div role="radiogroup" aria-labelledby={`${radioGroupId}-label`} aria-describedby={descriptionId} className="manual-harness-controls__toggles">
        <label>
          <input
            type="radio"
            name={`consent-${radioGroupId}`}
            value="granted"
            checked={isGranted}
            onChange={() => setStatus('granted')}
          />
          Consent granted
        </label>
        <label>
          <input
            type="radio"
            name={`consent-${radioGroupId}`}
            value="pending"
            checked={!isGranted}
            onChange={() => setStatus('pending')}
          />
          Consent pending
        </label>
      </div>
      <p className="status" role="status" data-consent-status={status}>
        {isGranted
          ? 'Consent granted — telemetry events flush immediately.'
          : 'Consent pending — [hub-embed] buffers events until you grant consent.'}
      </p>
    </section>
  );
}
