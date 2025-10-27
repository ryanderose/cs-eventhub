export type ProviderFilters = Record<string, unknown>;
export type ProviderEvent = { id: string; title: string };

export class CitySparkClient {
  constructor(private readonly quota: { burst: number; minute: number }) {}

  async search(_filters: ProviderFilters): Promise<ProviderEvent[]> {
    void this.quota;
    return [];
  }
}
