import { describe, expect, it } from "vitest";
import { runCli } from "../src/index";

describe("cli", () => {
  it("fails for unknown command", () => {
    const status = runCli(["node", "cli", "unknown"]);
    expect(status).toBe(1);
  });
});
