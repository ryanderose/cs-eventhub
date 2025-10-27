import { describe, expect, it } from "vitest";
import { composePage } from "../src";

describe("composePage", () => {
  it("produces plan hash", () => {
    const result = composePage({ query: { intent: "search", filters: {}, version: "dsl/1" }, tenantId: "demo" });
    expect(result.planHash).toMatch(/^[a-f0-9]+$/);
  });
});
