import { test, expect } from "@playwright/test";

test(
  "регистрация: новый пользователь попадает в приложение",
  { tag: "@auth" },
  async ({ page }) => {
    const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

    await page.goto("/register");
    await page.locator("#regEmail").fill(email);
    await page.locator("#regPassword").fill("secret123");
    await page.locator("#regBirthYear").fill("1998");
    const checkboxes = page.getByRole("checkbox");
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();
    await page.getByRole("button", { name: "Я сохранил(а) код, продолжить" }).click();

    await expect(page).not.toHaveURL(/\/register/);
    await expect(page.locator("#main-content")).toBeVisible();
  },
);
