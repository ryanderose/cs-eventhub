import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "../src/Button";

describe("Button", () => {
  it("renders children", () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText("Click me")).toBeDefined();
  });
});
