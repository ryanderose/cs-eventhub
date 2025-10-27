import { describe, expect, it } from "vitest";
import { createTelemetry } from "../src";

describe("telemetry", () => {
  it("creates spans", () => {
    const telemetry = createTelemetry({ serviceName: "test" });
    const span = telemetry.startSpan("sdk.mount");
    expect(span).toBeTruthy();
    span.end();
  });
});
