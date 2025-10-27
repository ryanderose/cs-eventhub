import { describe, expect, it } from "vitest";
import { interpret } from "../src";

describe("interpret", () => {
  it("adds date filter", () => {
    const result = interpret({ text: "concerts today", tenantId: "demo" });
    expect(result.query.filters.dateRange).toEqual({ preset: "today" });
  });
});
