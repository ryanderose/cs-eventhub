import { createBoundedBuffer } from './network';
import { createLogger, type HubLogger } from './logger';

export type ConsentStatus = 'pending' | 'granted';
export type ConsentSource = 'iab' | 'host' | 'user' | 'sdk';

type QueuedEvent = {
  bytes: number;
  flush: () => void;
};

const MAX_ITEMS = 200;
const MAX_BYTES = 64 * 1024;

function estimateSize(payload: unknown): number {
  try {
    return JSON.stringify(payload).length;
  } catch (_error) {
    return 0;
  }
}

export class ConsentManager {
  private status: ConsentStatus = 'pending';
  private readonly buffer = createBoundedBuffer<QueuedEvent>({
    maxItems: MAX_ITEMS,
    maxBytes: MAX_BYTES,
    sizeOf: (entry) => entry.bytes
  });
  private readonly listeners = new Set<(status: ConsentStatus) => void>();
  private readonly logger: HubLogger;

  constructor(logger: HubLogger = createLogger('consent')) {
    this.logger = logger;
  }

  onChange(listener: (status: ConsentStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): ConsentStatus {
    return this.status;
  }

  grant(source: ConsentSource = 'host'): void {
    if (this.status === 'granted') {
      return;
    }
    this.status = 'granted';
    this.logger.info('Consent granted', { source });
    this.buffer.flush((entry) => entry.flush());
    this.listeners.forEach((listener) => listener(this.status));
  }

  revoke(): void {
    if (this.status === 'pending') {
      return;
    }
    this.status = 'pending';
    this.logger.warn('Consent revoked');
    this.listeners.forEach((listener) => listener(this.status));
  }

  enqueue<T>(payload: T, dispatcher: (payload: T) => void): void {
    if (this.status === 'granted') {
      dispatcher(payload);
      return;
    }
    const bytes = estimateSize(payload);
    this.buffer.push({
      bytes,
      flush: () => dispatcher(payload)
    });
    this.logger.code('warn', 'CONSENT_PENDING', 'Event buffered until consent is granted', { bytes });
  }
}

export const consentManager = new ConsentManager();
