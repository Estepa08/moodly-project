import { test, expect } from "@playwright/test";
import { register, uniqueEmail, passTest, gotoApp } from "../helpers";

test.setTimeout(180_000);

test("прохождение BAI-теста приводит к результату", { tag: "@tests" }, async ({ page }) => {
  await register(page, uniqueEmail("test-bai"));

  await gotoApp(page, "/tests");
  await page.getByRole("link", { name: "Тест на тревогу" }).click();

  await passTest(page, 33);

  await expect(page.getByText(/— Результат/)).toBeVisible();
  await expect(page.getByText("Интерпретация")).toBeVisible();
});

test("результат теста можно раскрыть и перейти к истории", { tag: "@tests" }, async ({ page }) => {
  await register(page, uniqueEmail("test-result"));

  await gotoApp(page, "/tests");
  await page.getByRole("link", { name: "Тест на тревогу" }).click();
  await passTest(page, 33);

  await page.getByRole("button", { name: "Показать баллы" }).click();
  await expect(page.getByRole("button", { name: "Скрыть баллы" })).toBeVisible();

  await page.getByRole("link", { name: "Все результаты" }).click();
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByRole("heading", { name: "Результаты тестов" })).toBeVisible();
});

test("история результатов показывает пройденный тест", { tag: "@tests" }, async ({ page }) => {
  await register(page, uniqueEmail("test-history"));

  await gotoApp(page, "/tests");
  await page.getByRole("link", { name: "Тест на тревогу" }).click();
  await passTest(page, 33);

  await gotoApp(page, "/results");
  await expect(page.getByText("Тест на тревогу")).toBeVisible();
});
