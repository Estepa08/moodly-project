import { prisma } from '../lib/prisma.js';
import { notificationService } from '../services/notification.js';

// Раз в 15 минут проверяет, у кого «прогулка» компаньона завершилась
// (adventureReturnAt в прошлом), и шлёт один пуш «вернулся» — не чаще
// одного раза за прогулку (adventureNotified защищает от повторов между
// тиками). Пуш не отменяет саму награду — она забирается отдельно через
// POST /creature/adventure/claim, когда пользователь откроет приложение.

let timer: NodeJS.Timeout | null = null;

const INTERVAL_MS = 15 * 60 * 1000;

function isVapidConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

async function runOnce(): Promise<number> {
  if (!isVapidConfigured()) return 0;

  const due = await prisma.creatureState.findMany({
    where: { adventureReturnAt: { lte: new Date() }, adventureNotified: false },
    select: { userId: true },
  });

  for (const { userId } of due) {
    await notificationService.sendToUser(userId, {
      title: 'Moodly',
      body: 'Компаньон вернулся с прогулки и принёс подарок 🎁',
      url: '/my-day',
    });
    await prisma.creatureState.update({
      where: { userId },
      data: { adventureNotified: true },
    });
  }

  return due.length;
}

function start(): void {
  const tick = () => {
    void runOnce().catch((err: unknown) => {
      console.error('[adventure] failed:', err);
    });
  };
  void runOnce().catch((err: unknown) => {
    console.error('[adventure] failed:', err);
  });
  timer = setInterval(tick, INTERVAL_MS);
  timer.unref();
}

function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export const adventureScheduler = { runOnce, start, stop };
