import { prisma } from "../lib/prisma.js";
import { notificationService } from "../services/notification.js";
import { contentService } from "../services/content.js";

let timer: NodeJS.Timeout | null = null;

function isVapidConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function currentHour(): string {
  return String(new Date().getHours()).padStart(2, "0");
}

function sendForSlot(
  pref: { userId: string },
  payload: { title: string; body: string; url: string },
): Promise<number> {
  return notificationService.sendToUser(pref.userId, payload);
}

async function runOnce(): Promise<number> {
  if (!isVapidConfigured()) return 0;

  const hour = currentHour();
  const sent: string[] = [];

  // Слот «Утро» — прежние dailyReminder/reminderTime (настроение).
  const morning = await prisma.userPreference.findMany({
    where: { dailyReminder: true, reminderTime: { startsWith: `${hour}:` } },
    select: { userId: true },
  });
  for (const pref of morning) {
    await sendForSlot(pref, {
      title: "Moodly",
      body: "Как вы себя чувствуете сейчас? Отметьте настроение — это займёт 30 секунд.",
      url: "/my-day",
    });
    sent.push(pref.userId);
  }

  // Слот «День» — середина дня. Текст берётся из БД (контент-менеджер).
  const afternoon = await prisma.userPreference.findMany({
    where: { afternoonReminder: true, afternoonTime: { startsWith: `${hour}:` } },
    select: { userId: true },
  });
  for (const pref of afternoon) {
    const message = await contentService.messageOfDay("day", "ru", pref.userId);
    await sendForSlot(pref, {
      title: "Moodly",
      body: message?.question ?? message?.text ?? "Как проходит день? Отметьте, что вас окружает.",
      url: "/my-day",
    });
    sent.push(pref.userId);
  }

  // Слот «Вечер» — итог дня («Мой день»).
  const evening = await prisma.userPreference.findMany({
    where: { eveningReminder: true, eveningTime: { startsWith: `${hour}:` } },
    select: { userId: true },
  });
  for (const pref of evening) {
    await sendForSlot(pref, {
      title: "Moodly",
      body: "Как прошёл день? Подведите итог и отметьте занятия — это займёт 30 секунд.",
      url: "/my-day",
    });
    sent.push(pref.userId);
  }

  return sent.length;
}

function start(): void {
  const tick = () => {
    void runOnce().catch((err: unknown) => {
      console.error("[reminder] failed:", err);
    });
  };
  void runOnce().catch((err: unknown) => {
    console.error("[reminder] failed:", err);
  });
  timer = setInterval(tick, 60 * 60 * 1000);
  timer.unref();
}

function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export const reminderScheduler = { runOnce, start, stop };
