import { describe, expect, it } from "vitest";
import { BlockInstance, PageDoc } from "../src";

describe("Page schema", () => {
  it("validates block instances", () => {
    const block = BlockInstance.parse({
      key: "hero",
      id: "hero-1",
      order: 0,
      layout: { fullWidth: true },
      data: { headline: "Hi" }
    });
    expect(block.key).toBe("hero");
  });

  it("validates page documents", () => {
    const page = PageDoc.parse({
      id: "demo",
      title: "Demo",
      path: "/",
      blocks: [],
      updatedAt: new Date().toISOString(),
      version: "1.5",
      tenantId: "tenant-1",
      meta: { planHash: "abc" }
    });
    expect(page.version).toBe("1.5");
  });
});
