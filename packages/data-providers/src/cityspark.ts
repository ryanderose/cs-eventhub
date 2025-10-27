import { setTimeout as delay } from "node:timers/promises";

export type CitySparkEvent = {
  id: string;
  title: string;
  startTime: string;
  venue: string;
  category: string;
};

export interface CitySparkClientOptions {
  apiKey: string;
  fetcher?: typeof fetch;
  circuitBreaker?: {
    failureThreshold: number;
    resetMs: number;
  };
  retry?: {
    attempts: number;
    backoffMs: number;
  };
}

export class CitySparkClient {
  private failures = 0;
  private lastFailureAt = 0;
  constructor(private readonly options: CitySparkClientOptions) {}

  private canRequest() {
    const { circuitBreaker } = this.options;
    if (!circuitBreaker) return true;
    if (this.failures < circuitBreaker.failureThreshold) return true;
    return Date.now() - this.lastFailureAt > circuitBreaker.resetMs;
  }

  async listEvents(query: Record<string, string>): Promise<CitySparkEvent[]> {
    if (!this.canRequest()) {
      throw new Error("CitySpark circuit breaker open");
    }

    const fetcher = this.options.fetcher ?? fetch;
    const url = new URL("https://api.cityspark.example/events");
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

    const attempts = this.options.retry?.attempts ?? 1;
    const backoff = this.options.retry?.backoffMs ?? 100;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const response = await fetcher(url, {
        headers: { Authorization: `Bearer ${this.options.apiKey}` }
      });
      if (response.ok) {
        this.failures = 0;
        const json = (await response.json()) as CitySparkEvent[];
        return json;
      }
      this.failures += 1;
      this.lastFailureAt = Date.now();
      await delay(backoff * (attempt + 1));
    }

    throw new Error("CitySpark request failed");
  }
}
