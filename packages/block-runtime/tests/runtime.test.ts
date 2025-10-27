import { describe, expect, it } from "vitest";
import { registerBlock, getBlockRenderer } from "../src";

const block = {
  key: "hero",
  id: "1",
  order: 0,
  layout: { fullWidth: true },
  data: {}
} as const;

describe("block runtime", () => {
  it("registers block renderers", () => {
    registerBlock("hero", () => null);
    expect(getBlockRenderer(block.key)).toBeTypeOf("function");
  });
});
