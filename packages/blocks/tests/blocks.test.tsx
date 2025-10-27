import { describe, expect, it } from "vitest";
import { render } from "@testing-library/preact";
import { HeroBlock } from "../src";

const block = {
  key: "hero",
  id: "hero",
  order: 0,
  layout: { fullWidth: true },
  data: { headline: "Hello" }
} as const;

describe("HeroBlock", () => {
  it("renders headline", () => {
    const { getByText } = render(<HeroBlock block={block} />);
    expect(getByText("Hello")).toBeDefined();
  });
});
