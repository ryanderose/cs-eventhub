import { describe, expect, it } from "vitest";
import { encodePlan, decodePlan } from "../src";

describe("router helpers", () => {
  it("round trips plans", () => {
    const encoded = encodePlan({ foo: "bar" });
    expect(decodePlan(encoded)).toEqual({ foo: "bar" });
  });
});
