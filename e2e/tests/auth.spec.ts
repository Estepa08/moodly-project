import { test, expect } from "@playwright/test";
import { register, login, logoutDesktop, uniqueEmail, E2E_PASSWORD } from "../helpers";

test("повторный вход: после выхода можно войти с тем же паролем", { tag: "@auth" }, async ({ page }) => {
  const email = await register(page);

  await logoutDesktop(page);
  await login(page, email);

  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator("#main-content")).toBeVisible();
});

test("вход с неверным паролем показывает ошибку", { tag: "@auth" }, async ({ page }) => {
  const email = uniqueEmail("auth-badpass");
  await register(page, email);

  await logoutDesktop(page);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("wrong-password-1");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "Проверьте email и пароль и попробуйте снова",
  );
  await expect(page).toHaveURL(/\/login/);
});

test("регистрация невозможна без согласия 18+", { tag: "@auth" }, async ({ page }) => {
  await page.goto("/register");
  await page.locator("#regEmail").fill(uniqueEmail("auth-noconsent"));
  await page.locator("#regPassword").fill(E2E_PASSWORD);

  const submit = page.getByRole("button", { name: "Зарегистрироваться" });
  await expect(submit).toBeDisabled();

  await page.getByRole("checkbox").check();
  await expect(submit).toBeEnabled();
});

test("формы auth доступны: forgot-password и reset-password", { tag: "@auth" }, async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Забыли пароль" })).toBeVisible();
  await page.locator("#email").fill(uniqueEmail("auth-forgot"));
  await page.getByRole("button", { name: "Отправить ссылку" }).click();
  await expect(page.getByText("Проверьте почту")).toBeVisible();

  await page.goto("/login");
  await page.getByRole("link", { name: "Забыли пароль?" }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
});
