import { test, expect } from "@playwright/test";
import { register, uniqueEmail, gotoApp } from "../helpers";

const ROUTES: Array<[string, string]> = [
  ["/", "Период"],
  ["/progress", "Мой прогресс"],
  ["/tests", "Оценки"],
  ["/results", "Результаты тестов"],
  ["/settings", "Настройки"],
  ["/practices/breathing", "Дыхательное упражнение"],
  ["/practices/gratitude", "Дневник благодарности"],
  ["/practices/thought-journal", "Дневник мыслей"],
];

test("все ключевые маршруты открываются после входа", { tag: "@navigation" }, async ({ page }) => {
  await register(page, uniqueEmail("nav-all"));

  for (const [path, marker] of ROUTES) {
    await gotoApp(page, path);
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 20_000 });
  }
});

test(
  "неавторизованный пользователь перенаправляется на вход",
  { tag: "@navigation" },
  async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  },
);
