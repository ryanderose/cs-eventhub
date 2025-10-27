import { describe, expect, it } from "vitest";
import { ensureBlocksRegistered } from "../src";
import { getBlockRenderer } from "@eventhub/block-runtime";

describe("block registry", () => {
  it("registers blocks", () => {
    ensureBlocksRegistered();
    expect(getBlockRenderer("hero")).toBeTypeOf("function");
  });
});
