import { describe, expect, it } from "vitest";
import { app } from "../src/server";

describe("API routes", () => {
  it("interprets queries", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/interpret",
      payload: { text: "music", tenantId: "demo" }
    });
    expect(response.statusCode).toBe(200);
  });
});
