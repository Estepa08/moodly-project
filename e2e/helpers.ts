import { expect, type Page } from "@playwright/test";

export const E2E_PASSWORD = "secret123";

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

// Чек-ин-диалог «Отметиться — 30 секунд» открывается на /my-day автоматически.
// На время e2e заранее ставим флаг «сегодня уже отмечен» для всех фаз дня —
// диалог не будет авто-всплывать и перехватывать клики.
export async function disableAutoCheckIn(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const today = new Date().toISOString().slice(0, 10);
    for (const phase of ["morning", "day", "evening"]) {
      try {
        localStorage.setItem(`moodly_pet_checkin_${phase}_${today}`, "1");
      } catch {
        /* noop */
      }
    }
    // OnboardingGate после любого full-reload пересматривает «онбординг завершён»
    // (localStorage moodly_onboarding_done + prefs.onboardingDone). Онбординг
    // тестовому пользователю проходим при регистрации; чтобы OnboardingGate не редиректил на
    // /onboarding при «задумчивом» запросе преференсов, помечаем онбординг
    // завершённым для всего теста — как у вернувшегося пользователя.
    try {
      localStorage.setItem("moodly_onboarding_done", "true");
    } catch {
      /* noop */
    }
  });
}

export async function dismissCheckIn(page: Page): Promise<void> {
  const skip = page.getByRole("button", { name: "Пропустить", exact: true });
  const dialog = page.locator("[role=dialog]");
  for (let i = 0; i < 3; i++) {
    try {
      await skip.waitFor({ state: "visible", timeout: 3_000 });
      await skip.click();
    } catch {
      return; // диалога нет — нечего закрывать
    }
    try {
      await dialog.waitFor({ state: "hidden", timeout: 3_000 });
      return;
    } catch {
      // диалог переоткрылся при дозагрузке данных — закроем ещё раз
    }
  }
}

export async function skipOnboarding(page: Page): Promise<void> {
  // Регистрация ведёт на /my-day, откуда OnboardingGate может редиректнуть на
  // /onboarding. С учётом pre-seed флага обычно сразу /my-day, но страховочно
  // обрабатываем оба варианта.
  const clean = page.url().split("?")[0];
  if (clean.endsWith("/onboarding")) {
    const skip = page.getByRole("button", { name: "Пропустить", exact: true });
    await skip.waitFor({ state: "visible", timeout: 10_000 });
    await skip.click();
  }
  await expect(page).toHaveURL(/\/my-day/);
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
  await disableAutoCheckIn(page);
  await page.goto("/register");
  await page.locator("#regEmail").fill(email);
  await page.locator("#regPassword").fill(password);
  await page.locator("#regBirthYear").fill("1998");
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  // После регистрации показывается экран с recovery-кодом — уходим с /register
  // только по явному подтверждению (см. PublicRoute в App.tsx: раньше редирект
  // срезал этот экран за ~150мс, теперь он остаётся до подтверждения).
  await page.getByRole("button", { name: "Я сохранил(а) код, продолжить" }).click();
  await expect(page).not.toHaveURL(/\/register/);
  await skipOnboarding(page);
  await dismissCheckIn(page);
  return email;
}

export async function login(page: Page, email: string, password = E2E_PASSWORD): Promise<void> {
  await disableAutoCheckIn(page);
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await skipOnboarding(page);
  await dismissCheckIn(page);
}

export async function logoutDesktop(page: Page): Promise<void> {
  await dismissCheckIn(page);
  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/login/);
}

// Быстрая запись самочувствия теперь живёт на странице /statistics.
export async function quickEntry(page: Page, paramLabel: string, note?: string): Promise<void> {
  await gotoApp(page, "/statistics");
  await page.getByRole("button", { name: new RegExp(`^${paramLabel}$`) }).click();
  if (note) {
    await page.getByRole("button", { name: "Добавить заметку" }).click();
    await page.locator("#quick-entry-note").fill(note);
  }
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page.getByText("Сохранено").first()).toBeVisible();
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