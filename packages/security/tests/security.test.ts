import { describe, expect, it } from "vitest";
import { sanitizeHtml, isSafeUrl, buildFragmentCsp } from "../src";

describe("security", () => {
  it("removes scripts", () => {
    expect(sanitizeHtml('<div onclick="alert(1)"><script>alert(2)</script></div>')).not.toContain("script");
  });

  it("rejects javascript urls", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("builds csp", () => {
    const csp = buildFragmentCsp({ criticalStyleHashes: ["'sha256-abc'"] });
    expect(csp).toContain("style-src");
  });
});
