import { expect, type Page } from "@playwright/test";

export const E2E_PASSWORD = "secret123";

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

export async function dismissCheckIn(page: Page): Promise<void> {
  const later = page.getByRole("button", { name: "Напомнить позже" });
  try {
    await later.waitFor({ state: "visible", timeout: 10_000 });
    await later.click();
    await expect(later).not.toBeVisible();
  } catch {
    // модалка не появилась — продолжаем
  }
}

export async function gotoApp(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await dismissCheckIn(page);
}

export async function register(
  page: Page,
  email = uniqueEmail(),
  password = E2E_PASSWORD,
): Promise<string> {
  await page.goto("/register");
  await page.locator("#regEmail").fill(email);
  await page.locator("#regPassword").fill(password);
  await page.locator("#regBirthYear").fill("1998");
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page).not.toHaveURL(/\/register/);
  await dismissCheckIn(page);
  return email;
}

export async function login(page: Page, email: string, password = E2E_PASSWORD): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await dismissCheckIn(page);
}

export async function logoutDesktop(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function quickEntry(page: Page, paramLabel: string, note?: string): Promise<void> {
  await page.getByRole("button", { name: new RegExp(`^${paramLabel}$`) }).click();
  if (note) {
    await page.getByRole("button", { name: "Добавить заметку" }).click();
    await page.locator("#quick-entry-note").fill(note);
  }
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Сохранено")).toBeVisible();
}

export async function passTest(page: Page, questions: number, option = "Нет"): Promise<void> {
  for (let i = 1; i <= questions; i++) {
    await page.getByRole("button", { name: option, exact: true }).click();
    if (i < questions) {
      await page.getByRole("button", { name: "Далее" }).click();
    } else {
      await page.getByRole("button", { name: "Отправить тест" }).click();
    }
  }
}
