import { test, expect } from "@playwright/test";

test("placeholder", async ({ page }) => {
  await page.goto("/");
  expect(true).toBeTruthy();
});
