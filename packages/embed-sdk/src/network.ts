export const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRY_DELAY_MS = 250;

export type FetchWithRetryOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

export async function fetchWithTimeout(input: RequestInfo | URL, options: FetchWithRetryOptions = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0, retryDelayMs = DEFAULT_RETRY_DELAY_MS, signal, ...rest } = options;
  const controller = new AbortController();
  const timeoutId =
    typeof window !== 'undefined'
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : setTimeout(() => controller.abort(), timeoutMs);
  const mergedSignal = mergeSignals(signal, controller.signal);

  try {
    const response = await fetch(input, { ...rest, signal: mergedSignal });
    if (!response.ok && retries > 0 && isRetriableStatus(response.status)) {
      await delay(retryDelayMs);
      return fetchWithTimeout(input, { ...options, retries: retries - 1, retryDelayMs: retryDelayMs * 2 });
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await delay(retryDelayMs);
      return fetchWithTimeout(input, { ...options, retries: retries - 1, retryDelayMs: retryDelayMs * 2 });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function mergeSignals(a?: AbortSignal | null, b?: AbortSignal | null): AbortSignal | undefined {
  if (!a) return b ?? undefined;
  if (!b) return a;
  if (a === b) return a;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener('abort', onAbort, { once: true });
  b.addEventListener('abort', onAbort, { once: true });
  if (a.aborted || b.aborted) {
    controller.abort();
  }
  return controller.signal;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

export function sendBeaconWithFallback(url: string, data?: BodyInit | null): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      return navigator.sendBeacon(url, data ?? '');
    } catch (error) {
      console.warn('[hub-embed] navigator.sendBeacon failed, falling back to fetch', error);
    }
  }
  if (typeof fetch !== 'undefined') {
    fetch(url, {
      method: 'POST',
      body: data ?? undefined,
      keepalive: true,
      headers: { 'content-type': 'application/json' }
    }).catch((error) => {
      console.error('[hub-embed] Beacon fetch failed', error);
    });
    return true;
  }
  return false;
}

export function onLifecycleEvent(event: 'pagehide' | 'visibilitychange', handler: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const listener = () => handler();
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}

export type BufferedItem<T> = {
  payload: T;
  bytes: number;
};

export type BoundedBuffer<T> = {
  push(payload: T): void;
  flush(callback: (payload: T) => void): void;
  clear(): void;
  stats(): { items: number; bytes: number };
};

export type BoundedBufferOptions<T> = {
  maxItems: number;
  maxBytes: number;
  sizeOf?: (payload: T) => number;
  onEvict?: (payload: T) => void;
};

export function createBoundedBuffer<T>(options: BoundedBufferOptions<T>): BoundedBuffer<T> {
  const { maxItems, maxBytes, sizeOf = defaultSizer, onEvict } = options;
  const queue: BufferedItem<T>[] = [];
  let totalBytes = 0;

  function evictIfNeeded() {
    while (queue.length > maxItems || totalBytes > maxBytes) {
      const removed = queue.shift();
      if (!removed) break;
      totalBytes -= removed.bytes;
      onEvict?.(removed.payload);
    }
  }

  return {
    push(payload: T) {
      const bytes = sizeOf(payload);
      queue.push({ payload, bytes });
      totalBytes += bytes;
      evictIfNeeded();
    },
    flush(callback: (payload: T) => void) {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) continue;
        totalBytes -= item.bytes;
        callback(item.payload);
      }
    },
    clear() {
      queue.length = 0;
      totalBytes = 0;
    },
    stats() {
      return { items: queue.length, bytes: totalBytes };
    }
  };
}

function defaultSizer(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

export type GateChecker = () => boolean;

export type GatedDispatcher<T> = {
  dispatch(payload: T): void;
  flush(): void;
  pause(): void;
  resume(): void;
};

export function createGatedDispatcher<T>(options: {
  gate: GateChecker;
  buffer: BoundedBuffer<T>;
  transport: (payload: T) => void;
}): GatedDispatcher<T> {
  let paused = false;
  return {
    dispatch(payload: T) {
      if (!paused && options.gate()) {
        options.transport(payload);
        return;
      }
      options.buffer.push(payload);
    },
    flush() {
      options.buffer.flush(options.transport);
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
      options.buffer.flush(options.transport);
    }
  };
}
