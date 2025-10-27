import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { EventSummary } from '@events-hub/page-schema';

export type ProviderFilters = Record<string, unknown>;

export type ProviderQuota = {
  burst: number;
  minute: number;
};

export type ProviderRequestOptions = {
  tenantId: string;
  planHash?: string;
  composerVersion?: string;
  signal?: AbortSignal;
};

export type EventV21 = EventSummary & {
  description?: string;
  url: string;
  facets: {
    categories: string[];
    neighborhoods: string[];
    tags: string[];
  };
  rank: number;
  relevance: number;
  editorialBoost?: number;
  venue: EventSummary['venue'] & {
    capacity?: number;
  };
};

export type EventProviderV21 = {
  search(filters: ProviderFilters, options: ProviderRequestOptions): Promise<{ events: EventV21[]; cursor?: string }>;
  bySlug(slug: string, options: ProviderRequestOptions): Promise<EventV21 | null>;
};

type CacheEntry = {
  timestamp: number;
  events: EventV21[];
  cursor?: string;
};

const CACHE_TTL_MS = 120_000;
const STALE_REVALIDATE_MS = 600_000;

function cacheKey(filters: ProviderFilters, options: ProviderRequestOptions): string {
  const hash = createHash('sha1')
    .update(JSON.stringify({ filters, tenantId: options.tenantId, planHash: options.planHash, composerVersion: options.composerVersion }))
    .digest('base64url');
  return hash;
}

export class CircuitBreaker {
  #failureWindow: number[] = [];
  #openUntil = 0;

  constructor(private readonly windowMs: number, private readonly threshold: number) {}

  recordFailure(): void {
    const now = Date.now();
    this.#failureWindow.push(now);
    this.#failureWindow = this.#failureWindow.filter((time) => now - time <= this.windowMs);
    if (this.#failureWindow.length >= this.threshold) {
      this.#openUntil = now + this.windowMs;
    }
  }

  recordSuccess(): void {
    const now = Date.now();
    this.#failureWindow = this.#failureWindow.filter((time) => now - time <= this.windowMs);
    if (this.#failureWindow.length === 0) {
      this.#openUntil = 0;
    }
  }

  canRequest(): boolean {
    return Date.now() >= this.#openUntil;
  }
}

export class CitySparkClient implements EventProviderV21 {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly quotaState: { burstRemaining: number; minuteRemaining: number; lastRefill: number };
  private readonly breaker = new CircuitBreaker(60_000, 5);

  constructor(private readonly quota: ProviderQuota, private readonly telemetry: { record: (event: string, attrs?: Record<string, unknown>) => void }) {
    this.quotaState = {
      burstRemaining: quota.burst,
      minuteRemaining: quota.minute,
      lastRefill: Date.now()
    };
  }

  private refillQuota(): void {
    const now = Date.now();
    const delta = now - this.quotaState.lastRefill;
    if (delta >= 60_000) {
      this.quotaState.burstRemaining = this.quota.burst;
      this.quotaState.minuteRemaining = this.quota.minute;
      this.quotaState.lastRefill = now;
    }
  }

  private takeQuota(): void {
    this.refillQuota();
    if (this.quotaState.burstRemaining <= 0 || this.quotaState.minuteRemaining <= 0) {
      throw new Error('CitySpark quota exceeded');
    }
    this.quotaState.burstRemaining -= 1;
    this.quotaState.minuteRemaining -= 1;
  }

  private async simulateLatency() {
    await delay(10);
  }

  private hydrateCache(entryKey: string, value: CacheEntry): void {
    this.cache.set(entryKey, value);
  }

  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp <= CACHE_TTL_MS) {
      return entry;
    }
    if (now - entry.timestamp <= STALE_REVALIDATE_MS) {
      // Serve stale but schedule background refresh.
      queueMicrotask(() => {
        this.cache.delete(key);
      });
      return entry;
    }
    this.cache.delete(key);
    return null;
  }

  private generateEvents(filters: ProviderFilters, options: ProviderRequestOptions, limit = 20): EventV21[] {
    const hashSeed = createHash('md5').update(JSON.stringify({ filters, tenant: options.tenantId })).digest('hex');
    const events: EventV21[] = [];
    for (let i = 0; i < limit; i += 1) {
      const slug = `${hashSeed.slice(0, 8)}-${i}`;
      const baseRank = i + 1;
      const category = typeof filters.category === 'string' ? filters.category : 'general';
      events.push({
        id: slug,
        canonicalId: slug,
        name: `Event ${i + 1} for ${options.tenantId}`,
        venue: {
          id: `venue-${(i % 5) + 1}`,
          name: `Venue ${(i % 5) + 1}`,
          geo: { lat: 47.6 + i * 0.001, lng: -122.3 - i * 0.001 }
        },
        startDate: new Date(Date.now() + i * 3_600_000).toISOString(),
        endDate: undefined,
        categories: [category],
        heroImage: undefined,
        price: { min: 0, max: 20 + i, currency: 'USD' },
        distanceKm: 1 + i * 0.5,
        whyGo: [`Reason ${(i % 4) + 1}`],
        locale: 'en-US',
        timezone: 'America/Los_Angeles',
        ticketUrl: `https://tickets.example.com/${slug}`,
        source: { provider: 'cityspark', id: slug },
        description: `Generated event ${i}`,
        url: `https://events.example.com/${slug}`,
        facets: {
          categories: [category],
          neighborhoods: ['downtown'],
          tags: ['ai-composed']
        },
        rank: baseRank,
        relevance: Math.max(0, 1 - i * 0.05),
        editorialBoost: i % 3 === 0 ? 0.1 : undefined
      });
    }
    return events;
  }

  async search(filters: ProviderFilters, options: ProviderRequestOptions): Promise<{ events: EventV21[]; cursor?: string }> {
    if (!this.breaker.canRequest()) {
      this.telemetry.record('cityspark.breaker.open', { tenantId: options.tenantId });
      throw new Error('CitySpark circuit breaker open');
    }

    const key = cacheKey(filters, options);
    const cached = this.getFromCache(key);
    if (cached) {
      this.telemetry.record('cityspark.cache.hit', { tenantId: options.tenantId, planHash: options.planHash });
      return { events: cached.events, cursor: cached.cursor };
    }

    this.takeQuota();

    try {
      await this.simulateLatency();
      if (options.signal?.aborted) {
        throw new Error('aborted');
      }
      const events = this.generateEvents(filters, options);
      const result: CacheEntry = { events, cursor: undefined, timestamp: Date.now() };
      this.hydrateCache(key, result);
      this.telemetry.record('cityspark.cache.miss', { tenantId: options.tenantId, planHash: options.planHash });
      this.breaker.recordSuccess();
      return { events: result.events, cursor: result.cursor };
    } catch (error) {
      this.breaker.recordFailure();
      this.telemetry.record('cityspark.error', { tenantId: options.tenantId, error: (error as Error).message });
      throw error;
    }
  }

  async bySlug(slug: string, options: ProviderRequestOptions): Promise<EventV21 | null> {
    const { events } = await this.search({ slug }, options);
    return events.find((event) => event.canonicalId === slug) ?? null;
  }
}
