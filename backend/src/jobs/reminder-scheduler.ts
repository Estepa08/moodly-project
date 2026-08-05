import { prisma } from "../lib/prisma.js";
import { notificationService } from "../services/notification.js";

let timer: NodeJS.Timeout | null = null;

function isVapidConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

async function runOnce(): Promise<number> {
  if (!isVapidConfigured()) return 0;

  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, "0");

  const users = await prisma.userPreference.findMany({
    where: {
      dailyReminder: true,
      reminderTime: { startsWith: `${currentHour}:` },
    },
    select: { userId: true },
  });

  for (const pref of users) {
    await notificationService.sendToUser(pref.userId, {
      title: "Moodly",
      body: "Как вы себя чувствуете сейчас? Отметьте настроение — это займёт 30 секунд.",
      url: "/",
    });
  }
  return users.length;
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
