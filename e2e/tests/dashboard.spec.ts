import { test, expect } from "@playwright/test";
import { register, quickEntry, gotoApp } from "../helpers";

test("запись настроения: создаётся быстрая запись", { tag: "@dashboard" }, async ({ page }) => {
  await register(page);

  await page.getByRole("button", { name: "Настроение" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Сохранено")).toBeVisible();
  await expect(page.getByTestId("quick-entry-saved-Mood")).toBeVisible();
});

test("запись настроения с заметкой сохраняет текст", { tag: "@dashboard" }, async ({ page }) => {
  await register(page);

  await quickEntry(page, "Тревога", "e2e-заметка о тревоге");

  await expect(page.getByTestId("quick-entry-saved-Anxiety")).toBeVisible();
});

test("период дашборда переключается", { tag: "@dashboard" }, async ({ page }) => {
  await register(page);

  await page.getByRole("tab", { name: "Месяц", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Месяц", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("пустое состояние прогресса и статистика отображаются", { tag: "@dashboard" }, async ({ page }) => {
  await register(page);

  await gotoApp(page, "/progress");
  await expect(page.getByRole("heading", { name: "Мой прогресс" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Статистика" })).toBeVisible();
  await expect(page.getByText(/XP/).first()).toBeVisible();
});
