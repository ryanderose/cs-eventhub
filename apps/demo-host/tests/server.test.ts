import { describe, expect, it } from "vitest";
import { renderPageToString } from "@eventhub/embed-sdk";
import { demoPage } from "../src/pageDoc";

describe("demo host", () => {
  it("renders demo page", () => {
    const rendered = renderPageToString(demoPage);
    expect(rendered.html).toContain("Discover what's happening nearby");
  });
});
