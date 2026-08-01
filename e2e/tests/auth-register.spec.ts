import { test, expect } from "@playwright/test";

test("регистрация: новый пользователь попадает в приложение", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

  await page.goto("/register");
  await page.locator("#regEmail").fill(email);
  await page.locator("#regPassword").fill("secret123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(page).not.toHaveURL(/\/register/);
  await expect(page.locator("#main-content")).toBeVisible();
});
