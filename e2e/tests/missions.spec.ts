import { test, expect, type Page } from "@playwright/test";
import { register, uniqueEmail, gotoApp, passTest } from "../helpers";

test.setTimeout(300_000);

const PRIORITY: Record<string, number> = {
  log_mood_entry: 1,
  practice_gratitude: 2,
  practice_thoughtJournal: 3,
  practice_sleepHygiene: 4,
  practice_breathing: 5,
  practice_distortions: 6,
  practice_cba: 7,
  complete_test: 8,
  log_3_mood_entries: 9,
  breathing_2: 10,
  complete_3_practices: 11,
  complete_5_practices: 12,
};

const MOOD_PARAM_LABELS = ["Настроение", "Сон", "Энергия", "Тревога"];

async function moodEntry(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await gotoApp(page, "/");
    await page
      .getByRole("button", { name: new RegExp(`^${MOOD_PARAM_LABELS[i]}`) })
      .first()
      .click();
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Сохранено").first()).toBeVisible();
  }
}

async function waitReward(page: Page): Promise<void> {
  await page
    .waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        (r.url().includes("/creature/reward") || r.url().includes("/creature/exercise/complete")),
      { timeout: 15_000 },
    )
    .catch(() => {});
}

async function gratitude(page: Page): Promise<void> {
  await gotoApp(page, "/practices/gratitude");
  const reward = waitReward(page);
  await page
    .getByPlaceholder("За что вы благодарны сегодня?")
    .fill("e2e-миссия: повод для благодарности");
  await page.getByRole("button", { name: "Добавить" }).click();
  await expect(page.getByText("Добавлено в дневник благодарности")).toBeVisible();
  await reward;
}

async function thoughtJournal(page: Page): Promise<void> {
  await gotoApp(page, "/practices/thought-journal");
  const reward = waitReward(page);
  await page.getByPlaceholder("Опишите ситуацию коротко…").fill("e2e-миссия: ситуация");
  await page.getByPlaceholder("Запишите мысль дословно…").fill("e2e-миссия: мысль");
  await page.getByRole("button", { name: "Сохранить · +5 XP" }).click();
  await expect(page.getByText("Сохранено! +5 XP")).toBeVisible();
  await reward;
}

async function sleepHygiene(page: Page): Promise<void> {
  await gotoApp(page, "/practices/sleep-hygiene");
  const reward = waitReward(page);
  await page.getByRole("button", { name: "Без кофеина в последние 6 часов" }).click();
  await page.getByRole("button", { name: "Сохранить на сегодня" }).click();
  await expect(page.getByText("Сохранено — сладких снов.")).toBeVisible();
  await reward;
}

async function distortionQuiz(page: Page): Promise<void> {
  await gotoApp(page, "/practices/distortions");
  const reward = waitReward(page);
  await page.getByRole("tab", { name: "Квиз" }).click();
  const panel = page.getByRole("tabpanel", { id: "distortion-panel-quiz" });
  for (let i = 0; i < 7; i++) {
    await panel.getByRole("button").first().click();
    await panel.getByRole("button", { name: i === 6 ? "Посмотреть результат" : "Далее" }).click();
  }
  await expect(page.getByText("Отлично!")).toBeVisible();
  await reward;
}

async function cba(page: Page): Promise<void> {
  await gotoApp(page, "/practices/cost-benefit-analysis");
  const reward = waitReward(page);
  await page.getByRole("tab", { name: "Новая запись" }).click();
  const form = page.getByRole("tabpanel", { id: "cba-panel-form" });
  await form
    .getByPlaceholder("Например: «Если я ошибусь, все подумают, что я некомпетентен»")
    .fill("e2e-миссия: мысль для АИВ");
  await form
    .locator("p", { hasText: "Плюсы" })
    .locator("..")
    .locator("button[aria-pressed='false']")
    .first()
    .click();
  await form
    .locator("p", { hasText: "Минусы" })
    .locator("..")
    .locator("button[aria-pressed='false']")
    .first()
    .click();
  await page.getByRole("button", { name: "Сохранить запись" }).click();
  await expect(page.getByText("e2e-миссия: мысль для АИВ")).toBeVisible();
  await reward;
}

async function breathing(page: Page, sessions: number): Promise<void> {
  for (let i = 0; i < sessions; i++) {
    await gotoApp(page, "/practices/breathing");
    const reward = waitReward(page);
    await page.getByRole("button", { name: "Быстрое (Паника)" }).click();
    await page.getByRole("button", { name: "Начать упражнение" }).click();
    await expect(page.getByText(/Вы дышали .* секунд/)).toBeVisible({ timeout: 90_000 });
    await reward;
  }
}

async function completeTest(page: Page): Promise<void> {
  await gotoApp(page, "/tests");
  await page.getByRole("link", { name: "Тест на тревогу" }).click();
  await passTest(page, 33);
  await expect(page.getByText(/— Результат/)).toBeVisible();
}

export async function runMission(page: Page, missionKey: string): Promise<void> {
  switch (missionKey) {
    case "log_mood_entry":
      await moodEntry(page, 1);
      break;
    case "log_3_mood_entries":
      await moodEntry(page, 3);
      break;
    case "practice_gratitude":
      await gratitude(page);
      break;
    case "practice_thoughtJournal":
      await thoughtJournal(page);
      break;
    case "practice_sleepHygiene":
      await sleepHygiene(page);
      break;
    case "practice_breathing":
      await breathing(page, 1);
      break;
    case "breathing_2":
      await breathing(page, 2);
      break;
    case "practice_distortions":
      await distortionQuiz(page);
      break;
    case "practice_cba":
      await cba(page);
      break;
    case "complete_test":
      await completeTest(page);
      break;
    case "complete_3_practices":
      await gratitude(page);
      await thoughtJournal(page);
      await sleepHygiene(page);
      break;
    case "complete_5_practices":
      await gratitude(page);
      await thoughtJournal(page);
      await sleepHygiene(page);
      await breathing(page, 1);
      await distortionQuiz(page);
      break;
    default:
      throw new Error(`Неподдерживаемая миссия в E2E: ${missionKey}`);
  }
}

async function pickMission(page: Page): Promise<string> {
  await gotoApp(page, "/progress");
  const missionCards = page.locator("[data-testid^='mission-']");
  await expect(missionCards.first()).toBeVisible();
  const testids = await missionCards.evaluateAll((els) =>
    els.map((el) => el.getAttribute("data-testid") ?? ""),
  );
  const keys = testids.map((t) => t.replace("mission-", ""));
  expect(keys.length, "На странице должны отображаться миссии").toBeGreaterThanOrEqual(1);
  const candidates = keys.filter((k) => k in PRIORITY).sort((a, b) => PRIORITY[a] - PRIORITY[b]);
  expect(candidates.length, "Хотя бы одна миссия должна быть выполнимой").toBeGreaterThan(0);
  return candidates[0];
}

test(
  "миссия засчитывает выполнение, claim начисляет XP",
  { tag: "@missions" },
  async ({ page }) => {
    await register(page, uniqueEmail("missions"));

    const missionKey = await pickMission(page);

    await runMission(page, missionKey);

    await gotoApp(page, "/progress");
    const card = page.getByTestId(`mission-${missionKey}`);
    const claimButton = card.getByRole("button", { name: "Забрать награду" });
    await expect(claimButton).toBeVisible();
    await expect(card.getByText("100%")).toBeVisible();

    const xpText = page.getByText(/\d+\/\d+ XP/).first();
    const before = await xpText.textContent();

    await claimButton.click();
    await expect(claimButton).not.toBeVisible();
    await expect(card.locator(".text-success")).toBeVisible();

    await expect.poll(async () => (await xpText.textContent()) ?? "").not.toBe(before);
  },
);
