import { test, expect } from "@playwright/test";
import { register, uniqueEmail, logoutDesktop, gotoApp } from "../helpers";

test("настройки: раздел и удаление с подтверждением", async ({ page }) => {
  await register(page, uniqueEmail("settings-del"));

  await gotoApp(page, "/settings");
  await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();
  await expect(page.getByText("Сменить пароль")).toBeVisible();

  await page.getByRole("button", { name: "Удалить аккаунт" }).click();
  await expect(page.getByRole("heading", { name: "Удалить аккаунт?" })).toBeVisible();
  await page.getByRole("button", { name: "Отмена" }).click();
  await expect(page.getByRole("heading", { name: "Удалить аккаунт?" })).not.toBeVisible();
});

test("выход из аккаунта из сайдбара", async ({ page }) => {
  await register(page, uniqueEmail("settings-logout"));

  await logoutDesktop(page);
  await expect(page.getByRole("heading", { name: "Moodly" })).toBeVisible();
});
