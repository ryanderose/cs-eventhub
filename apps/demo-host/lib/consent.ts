'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { consent, type ConsentStatus, type ConsentSource } from '@events-hub/embed-sdk';

type Listener = (status: ConsentStatus) => void;

let initialized = false;
let currentStatus: ConsentStatus = 'pending';
const listeners = new Set<Listener>();

function ensureInitialized() {
  if (initialized) {
    return;
  }
  initialized = true;
  try {
    currentStatus = consent.status();
  } catch {
    currentStatus = 'pending';
  }
}

function updateStatus(nextStatus: ConsentStatus, source?: ConsentSource) {
  if (currentStatus === nextStatus) {
    return;
  }
  currentStatus = nextStatus;
  console.info('[demoHost.consent]', { status: nextStatus, source: source ?? 'manual' });
  for (const listener of listeners) {
    listener(nextStatus);
  }
}

export function getConsentStatus(): ConsentStatus {
  ensureInitialized();
  return currentStatus;
}

export function subscribeToConsent(listener: Listener): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function grantHostConsent(source: ConsentSource = 'host'): ConsentStatus {
  ensureInitialized();
  if (currentStatus === 'granted') {
    return currentStatus;
  }
  consent.grant(source);
  updateStatus('granted', source);
  return currentStatus;
}

export function resetHostConsent(): ConsentStatus {
  ensureInitialized();
  if (currentStatus === 'pending') {
    return currentStatus;
  }
  consent.revoke();
  updateStatus('pending', 'host');
  return currentStatus;
}

export function useConsentStatus(): ConsentStatus {
  const [status, setStatus] = useState<ConsentStatus>(() => getConsentStatus());

  useEffect(() => subscribeToConsent(setStatus), []);

  return status;
}

type UseConsentControllerOptions = {
  defaultStatus?: ConsentStatus;
  source?: ConsentSource;
};

export function useConsentController(options: UseConsentControllerOptions = {}) {
  const defaultStatus = options.defaultStatus ?? 'granted';
  const source = options.source ?? 'host';
  const status = useConsentStatus();
  const appliedDefaultRef = useRef(false);

  useEffect(() => {
    if (appliedDefaultRef.current) {
      return;
    }
    appliedDefaultRef.current = true;
    if (defaultStatus === 'granted') {
      grantHostConsent(source);
    } else {
      resetHostConsent();
    }
  }, [defaultStatus, source]);

  const setStatus = useCallback(
    (next: ConsentStatus) => {
      if (next === 'granted') {
        grantHostConsent(source);
      } else {
        resetHostConsent();
      }
    },
    [source]
  );

  return useMemo(() => ({ status, setStatus }), [status, setStatus]);
}

export function __resetConsentState(status: ConsentStatus = 'pending') {
  initialized = false;
  currentStatus = status;
  listeners.clear();
}
