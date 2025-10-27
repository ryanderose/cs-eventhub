import { describe, expect, it } from "vitest";
import { renderPageToString } from "../src/render";

const page = {
  id: "demo",
  title: "Demo",
  path: "/",
  blocks: [
    {
      key: "hero",
      id: "hero",
      order: 0,
      layout: { fullWidth: true },
      data: { headline: "Hello", subheadline: "World" }
    }
  ],
  updatedAt: new Date().toISOString(),
  version: "1.5",
  tenantId: "demo",
  meta: { planHash: "abc" }
} as const;

describe("renderPageToString", () => {
  it("produces html", () => {
    const result = renderPageToString(page);
    expect(result.html).toContain("Hello");
  });
});
