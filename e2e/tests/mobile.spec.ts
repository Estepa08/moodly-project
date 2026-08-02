import { test, expect, devices } from "@playwright/test";
import { register, uniqueEmail, dismissCheckIn } from "../helpers";

test.use({ ...devices["iPhone 14"], browserName: "chromium" });

test("мобильная регистрация и нижняя навигация", { tag: "@mobile" }, async ({ page }) => {
  await register(page, uniqueEmail("mobile-reg"));
  await dismissCheckIn(page);

  await expect(page.getByRole("link", { name: "Статистика" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Прогресс" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Тесты" })).toBeVisible();

  await page.getByRole("button", { name: "Ещё" }).click({ force: true });
  await expect(page.getByRole("link", { name: "Благодарность" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Дыхание" })).toBeVisible();
});

test("мобильная запись настроения", { tag: "@mobile" }, async ({ page }) => {
  await register(page, uniqueEmail("mobile-entry"));

  await page.getByRole("button", { name: "Сон" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Сохранено")).toBeVisible();
});
