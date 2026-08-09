import { test, expect, devices } from "@playwright/test";
import { register, uniqueEmail, dismissCheckIn, gotoApp } from "../helpers";

test.use({ ...devices["iPhone 14"], browserName: "chromium" });

test("мобильная регистрация и нижняя навигация", { tag: "@mobile" }, async ({ page }) => {
  await register(page, uniqueEmail("mobile-reg"));
  await dismissCheckIn(page);

  await expect(page.getByRole("link", { name: "Мой день" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Практики" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Статистика" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Прогресс" })).toBeVisible();
});

test("мобильная запись настроения", { tag: "@mobile" }, async ({ page }) => {
  await register(page, uniqueEmail("mobile-entry"));
  await dismissCheckIn(page);

  await gotoApp(page, "/statistics");
  await page.getByRole("button", { name: /^Настроение$/ }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Сохранено").first()).toBeVisible();
});