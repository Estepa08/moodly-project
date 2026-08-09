import { test, expect } from "@playwright/test";
import { register, uniqueEmail, gotoApp } from "../helpers";

const ROUTES: Array<[string, string]> = [
  ["/my-day", "Мой день"],
  ["/statistics", "Статистика"],
  ["/progress", "Мой прогресс"],
  ["/tests", "Оценки"],
  ["/settings", "Настройки"],
  ["/practices/breathing", "Дыхательное упражнение"],
  ["/practices/gratitude", "Дневник благодарности"],
  ["/practices/thought-journal", "Дневник мыслей"],
];

test("все ключевые маршруты открываются после входа", { tag: "@navigation" }, async ({ page }) => {
  await register(page, uniqueEmail("nav-all"));

  for (const [path, marker] of ROUTES) {
    await gotoApp(page, path);
    await expect(page.getByText(marker, { exact: false }).first()).toBeVisible({
      timeout: 20_000,
    });
  }
});

test(
  "неавторизованный пользователь видит лендинг со входом",
  { tag: "@navigation" },
  async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Войти", exact: true })).toBeVisible();
  },
);