import { describe, expect, it } from "vitest";
import { CitySparkClient } from "../src/cityspark";

describe("CitySparkClient", () => {
  it("throws when breaker open", async () => {
    const client = new CitySparkClient({ apiKey: "test", circuitBreaker: { failureThreshold: 1, resetMs: 1000 } });
    // @ts-expect-error private access for test
    client.failures = 2;
    // @ts-expect-error private access for test
    client.lastFailureAt = Date.now();
    await expect(client.listEvents({})).rejects.toThrow();
  });
});
