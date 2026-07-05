import { expect, test } from "@playwright/test";

test("can open training screen and start a session", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /训练|Training/ })).toBeVisible();
  await page.getByRole("button", { name: /开始本局|Start session/ }).click();
  await expect(page.getByText(/试次 1|Trial 1/)).toBeVisible();
});
