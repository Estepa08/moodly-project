import { test, expect } from "@playwright/test";
import { register, uniqueEmail, gotoApp } from "../helpers";

test.setTimeout(150_000);

test("дыхание: быстрое упражнение завершается", async ({ page }) => {
  await register(page, uniqueEmail("practice-breath"));

  await gotoApp(page, "/practices/breathing");
  await page.getByRole("button", { name: "Быстрое (Паника)" }).click();
  await page.getByRole("button", { name: "Начать упражнение" }).click();

  await expect(page.getByText(/Вы дышали .* секунд/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Ещё раз" })).toBeVisible();
});

test("благодарность: добавляется запись", async ({ page }) => {
  await register(page, uniqueEmail("practice-gratitude"));

  await gotoApp(page, "/practices/gratitude");
  await page.getByPlaceholder("За что вы благодарны сегодня?").fill("e2e-благодарность за тест");
  await page.getByRole("button", { name: "Добавить" }).click();

  await expect(page.getByText("Добавлено в дневник благодарности")).toBeVisible();
  await expect(page.getByText("e2e-благодарность за тест")).toBeVisible();
});

test("дневник мыслей: сохраняется запись с XP", async ({ page }) => {
  await register(page, uniqueEmail("practice-thought"));

  await gotoApp(page, "/practices/thought-journal");
  await page.getByPlaceholder("Опишите ситуацию коротко…").fill("e2e-ситуация");
  await page.getByPlaceholder("Запишите мысль дословно…").fill("e2e-мысль");
  await page.getByRole("button", { name: "Сохранить · +5 XP" }).click();

  await expect(page.getByText("Сохранено! +5 XP")).toBeVisible();
});

test("страницы практик открываются", async ({ page }) => {
  await register(page, uniqueEmail("practice-open"));

  await gotoApp(page, "/practices/distortions");
  await expect(page.getByText("Когнитивные искажения").first()).toBeVisible();

  await gotoApp(page, "/practices/sleep-hygiene");
  await expect(page.getByText("Гигиена сна").first()).toBeVisible();

  await gotoApp(page, "/practices/cost-benefit-analysis");
  await expect(page.getByText("Анализ издержек и выгод").first()).toBeVisible();
});
