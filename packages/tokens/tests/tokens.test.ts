import { describe, expect, it } from "vitest";
import { tokens } from "../src";

describe("tokens", () => {
  it("exposes primary color", () => {
    expect(tokens.colors.primary).toContain("--eh-color-primary");
  });
});
