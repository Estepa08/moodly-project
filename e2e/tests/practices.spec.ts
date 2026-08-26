import { test, expect } from "@playwright/test";
import { register, uniqueEmail, gotoApp } from "../helpers";

test.setTimeout(150_000);

test("дыхание: быстрое упражнение завершается", { tag: "@practices" }, async ({ page }) => {
  await register(page, uniqueEmail("practice-breath"));

  await gotoApp(page, "/practices/breathing");
  await page.getByRole("button", { name: "Быстрое (Паника)" }).click();
  await page.getByRole("button", { name: "Начать упражнение" }).click();

  await expect(page.getByText(/Вы дышали .* секунд/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Ещё раз" })).toBeVisible();
});

test("благодарность: добавляется запись", { tag: "@practices" }, async ({ page }) => {
  await register(page, uniqueEmail("practice-gratitude"));

  await gotoApp(page, "/practices/gratitude");
  await page.getByPlaceholder("За что вы благодарны сегодня?").fill("e2e-благодарность за тест");
  await page.getByRole("button", { name: "Добавить" }).click();

  await expect(page.getByText("Добавлено в дневник благодарности")).toBeVisible();
  await expect(page.getByText("e2e-благодарность за тест")).toBeVisible();
});

test("дневник мыслей: сохраняется запись с XP", { tag: "@practices" }, async ({ page }) => {
  await register(page, uniqueEmail("practice-thought"));

  await gotoApp(page, "/practices/thought-journal");
  await page.getByPlaceholder("Опишите ситуацию коротко…").fill("e2e-ситуация");
  await page.getByPlaceholder("Запишите мысль дословно…").fill("e2e-мысль");
  await page.getByRole("button", { name: "Сохранить · +5 XP" }).click();

  await expect(page.getByText("Сохранено! +5 XP")).toBeVisible();
});

test("страницы практик открываются", { tag: "@practices" }, async ({ page }) => {
  await register(page, uniqueEmail("practice-open"));

  await gotoApp(page, "/practices/distortions");
  await expect(page.getByText("Когнитивные искажения").first()).toBeVisible();

  await gotoApp(page, "/practices/sleep-hygiene");
  await expect(page.getByText("Гигиена сна").first()).toBeVisible();

  await gotoApp(page, "/practices/cost-benefit-analysis");
  await expect(page.getByText("Анализ издержек и выгод").first()).toBeVisible();
});

test("хаб практик: группы и новые практики", { tag: "@practices" }, async ({ page }) => {
  await register(page, uniqueEmail("practice-hub"));

  await gotoApp(page, "/practices");
  await expect(page.getByText("Работа с мыслями")).toBeVisible();
  await expect(page.getByText("Позитивная психология")).toBeVisible();
  await expect(page.getByRole("link", { name: /Тренажёр мысли/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Пирог ответственности/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Декатастрофизация/ })).toBeVisible();

  await page.getByRole("link", { name: /Тренажёр мысли/ }).click();
  await expect(page).toHaveURL(/\/practices\/thought-battle/);
  await expect(page.getByText("Опознай искажение")).toBeVisible();
});

test("пирог ответственности: сохраняется запись", { tag: "@practices" }, async ({ page }) => {
  await register(page, uniqueEmail("practice-resp-pie"));

  await gotoApp(page, "/practices/responsibility-pie");
  await page
    .getByPlaceholder("Опишите ситуацию коротко…")
    .fill("e2e-ситуация: провалил дедлайн по проекту");
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(page.getByText("e2e-ситуация: провалил дедлайн по проекту")).toBeVisible();
});

test("декатастрофизация: визард из 3 шагов сохраняется", { tag: "@practices" }, async ({
  page,
}) => {
  await register(page, uniqueEmail("practice-decatastrophizing"));

  await gotoApp(page, "/practices/decatastrophizing");
  await page.getByPlaceholder("Опишите худший сценарий…").fill("e2e-худший сценарий");
  await page.getByRole("button", { name: "Далее" }).click();

  await expect(page.getByText("e2e-худший сценарий")).toBeVisible();
  await page.getByPlaceholder("Опишите план действий…").fill("e2e-план действий");
  await page.getByRole("button", { name: "Далее" }).click();

  await page.getByPlaceholder("Опишите реалистичный сценарий…").fill("e2e-реалистичный сценарий");
  await page.getByRole("button", { name: "Сравнить" }).click();

  await expect(page.getByText("e2e-худший сценарий")).toBeVisible();
  await expect(page.getByText("e2e-план действий")).toBeVisible();
  await expect(page.getByText("e2e-реалистичный сценарий")).toBeVisible();
  await page.getByRole("button", { name: "Сохранить" }).click();

  await expect(page.getByText("e2e-худший сценарий").first()).toBeVisible();
  await expect(page.getByText("e2e-реалистичный сценарий").first()).toBeVisible();
});
