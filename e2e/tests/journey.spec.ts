import { test, expect } from "@playwright/test";
import { register, uniqueEmail, gotoApp } from "../helpers";

test("длинный путь: запись → практика → дневник мыслей", async ({ page }) => {
  await register(page, uniqueEmail("journey"));

  await page.getByRole("button", { name: "Настроение" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByTestId("quick-entry-saved-Mood")).toBeVisible();

  await gotoApp(page, "/practices/gratitude");
  await page.getByPlaceholder("За что вы благодарны сегодня?").fill("e2e-путь: повод для благодарности");
  await page.getByRole("button", { name: "Добавить" }).click();
  await expect(page.getByText("Добавлено в дневник благодарности")).toBeVisible();

  await gotoApp(page, "/practices/thought-journal");
  await page.getByPlaceholder("Опишите ситуацию коротко…").fill("e2e-путь: сложная ситуация");
  await page.getByPlaceholder("Запишите мысль дословно…").fill("e2e-путь: мысль дословно");
  await page.getByRole("button", { name: "Сохранить · +5 XP" }).click();
  await expect(page.getByText("Сохранено! +5 XP")).toBeVisible();
});
