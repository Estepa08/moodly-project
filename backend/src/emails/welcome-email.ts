const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

interface WelcomeContent {
  preheader: string;
  greeting: (name: string) => string;
  intro: string;
  steps: { title: string; text: string }[];
  cta: string;
  ctaLink: string;
  privacy: string;
}

const content: Record<"ru" | "en", WelcomeContent> = {
  ru: {
    preheader:
      "Ваш первый день с Moodly: 30 секунд в день, чтобы замечать, как вы себя чувствуете.",
    greeting: (name) => `${name}, добро пожаловать в Moodly!`,
    intro:
      "Moodly — это дневник настроения, который заботится о вас. Начните с простого: всего 30 секунд в день. Вот что стоит попробовать в первый день.",
    steps: [
      {
        title: "Пройдите тест настроения",
        text: "Три минуты — и вы лучше понимаете своё состояние. Это отправная точка.",
      },
      {
        title: "Попробуйте дыхательную практику",
        text: "Две минуты спокойствия, когда тревога поднимается. Работает офлайн.",
      },
      {
        title: "Выберите питомца",
        text: "Он станет вашим компаньоном и будет расти вместе с вами.",
      },
      {
        title: "Включите напоминание",
        text: "Пусть Moodly сам напомнит отметить настроение — привычка закрепится.",
      },
    ],
    cta: "Открыть Moodly",
    ctaLink: FRONTEND_URL,
    privacy:
      "Ваши данные доступны только вам: записи настроения и результаты тестов зашифрованы на устройстве (сквозное шифрование) — ключ никто не видит, кроме вас. Обязательно сохраните recovery-код: без него восстановить данные после сброса пароля невозможно. Обработка персональных данных — по 152-ФЗ. Подробности в политике конфиденциальности.",
  },
  en: {
    preheader: "Your first day with Moodly: 30 seconds a day to notice how you feel.",
    greeting: (name) => `${name}, welcome to Moodly!`,
    intro:
      "Moodly is a mood journal that cares about you. Start simple: just 30 seconds a day. Here's what to try on your first day.",
    steps: [
      {
        title: "Take the mood test",
        text: "Three minutes — and you understand your state better. It's a good starting point.",
      },
      {
        title: "Try a breathing practice",
        text: "Two minutes of calm when anxiety rises. Works offline.",
      },
      {
        title: "Pick your pet",
        text: "It will become your companion and grow together with you.",
      },
      {
        title: "Turn on reminders",
        text: "Let Moodly remind you to log your mood — the habit will stick.",
      },
    ],
    cta: "Open Moodly",
    ctaLink: FRONTEND_URL,
    privacy:
      "Your data is available only to you: mood entries and test results are encrypted on your device (end-to-end encryption) — no one sees your key except you. Be sure to save your recovery code: without it, your data cannot be restored if you reset your password. Personal data processing is GDPR-aligned. See the privacy policy for details.",
  },
};

function renderSteps(steps: WelcomeContent["steps"]): string {
  return steps
    .map(
      (step, i) => `
      <tr>
        <td style="padding: 10px 0; vertical-align: top;">
          <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: #ede9fe; color: #6d28d9; text-align: center; line-height: 24px; font-weight: 600; font-size: 13px;">${i + 1}</span>
          <span style="font-weight: 600; color: #1f2937;">${step.title}</span>
          <p style="margin: 2px 0 0 32px; color: #6b7280; font-size: 14px;">${step.text}</p>
        </td>
      </tr>`,
    )
    .join("");
}

export function welcomeEmailHtml({ name, lang }: { name: string; lang: "ru" | "en" }): string {
  const c = content[lang] ?? content.en;
  const steps = renderSteps(c.steps);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 26px; max-width: 480px; margin: 0 auto; color: #374151;">
  <h2 style="color: #6d28d9; margin-bottom: 4px;">Moodly</h2>
  <p style="color: #9ca3af; font-size: 12px;">${c.preheader}</p>
  <h3 style="color: #111827;">${c.greeting(name)}</h3>
  <p style="font-size: 15px; line-height: 1.6;">${c.intro}</p>
  <table style="width: 100%;">
    ${steps}
  </table>
  <p style="margin-top: 24px;">
    <a href="${c.ctaLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600;">
      ${c.cta}
    </a>
  </p>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">${c.privacy}</p>
</body>
</html>`;
}

export function detectLang(acceptLanguage?: string): "ru" | "en" {
  const header = acceptLanguage || "";
  if (/^ru\b|(^|,)\s*ru[;,-]/i.test(header)) return "ru";
  return "en";
}
