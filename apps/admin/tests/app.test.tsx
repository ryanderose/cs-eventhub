import { describe, expect, it } from "vitest";
import HomePage from "../app/page";
import { render } from "@testing-library/react";

describe("HomePage", () => {
  it("renders call to action", () => {
    const { getByText } = render(<HomePage />);
    expect(getByText(/Plans Dashboard/)).toBeDefined();
  });
});
