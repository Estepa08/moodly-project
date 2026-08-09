import { test, expect } from "@playwright/test";
import { register, quickEntry, gotoApp } from "../helpers";

test("запись настроения: создаётся быстрая запись", { tag: "@dashboard" }, async ({ page }) => {
  await register(page);

  await gotoApp(page, "/statistics");
  await page.getByRole("button", { name: /^Настроение$/ }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Сохранено").first()).toBeVisible();
  await expect(page.getByTestId("quick-entry-saved-Mood")).toBeVisible();
});

test("запись настроения с заметкой сохраняет текст", { tag: "@dashboard" }, async ({ page }) => {
  await register(page);

  await quickEntry(page, "Тревога", "e2e-заметка о тревоге");

  await expect(page.getByTestId("quick-entry-saved-Anxiety")).toBeVisible();
});

test("период на странице статистики переключается", { tag: "@dashboard" }, async ({ page }) => {
  await register(page);

  await gotoApp(page, "/statistics");
  const trigger = page.getByRole("combobox", { name: "Период" }).first();
  await expect(trigger).toBeVisible({ timeout: 20_000 });
  await trigger.click();
  await page.getByRole("option", { name: "Месяц", exact: true }).click();
  await expect(trigger).toContainText("Месяц");
});

test(
  "пустое состояние прогресса и статистика отображаются",
  { tag: "@dashboard" },
  async ({ page }) => {
    await register(page);

    await gotoApp(page, "/progress");
    await expect(page.getByRole("heading", { name: "Мой прогресс" })).toBeVisible();
    await expect(page.getByText("Статистика").first()).toBeVisible();
    await expect(page.getByText(/0\/100 XP/).first()).toBeVisible();
  },
);