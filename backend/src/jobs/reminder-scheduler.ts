import { prisma } from '../lib/prisma.js';
import { notificationService } from '../services/notification.js';
import { contentService } from '../services/content.js';

let timer: NodeJS.Timeout | null = null;

function isVapidConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function currentHour(): string {
  return String(new Date().getHours()).padStart(2, '0');
}

function sendForSlot(
  pref: { userId: string },
  payload: { title: string; body: string; url: string },
): Promise<number> {
  return notificationService.sendToUser(pref.userId, payload);
}

// ---------- Гибкое окно (Сессия 4, docs/plans/three-personas-design-gaps.md) ----------
//
// Слот в режиме "window" не имеет фиксированной минуты отправки: вместо неё
// заданы границы окна (например, 20:00–23:00), и каждый день сервер
// детерминированно-случайно выбирает момент внутри окна. "Детерминированно"
// значит: seed = userId + слот + сегодняшняя дата, поэтому все часовые тики
// в течение одного дня сходятся на одном и том же выбранном часе (иначе
// пришлось бы хранить "выбранный момент" отдельным полем и заботиться о
// гонках при перезапуске планировщика) — а на следующий день seed меняется
// вместе с датой, и момент отправки снова другой. Разрешение отправки у
// планировщика — час (как и у точных слотов, см. ниже), поэтому сравнение
// идёт по часу выбранного момента.

/** Детерминированный псевдослучайный [0, 1) из строки (FNV-1a). */
function seededRandom(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0x100000000;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Выбирает "сегодняшний" момент (HH:MM) внутри [start; end] для данного
 * пользователя и слота. Окно может пересекать полночь (start > end).
 */
export function pickWindowTime(
  userId: string,
  slotKey: string,
  start: string,
  end: string,
): string {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  const span = endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
  const rand = seededRandom(`${userId}:${slotKey}:${todayKey()}`);
  const picked = (startMin + Math.floor(rand * (span + 1))) % 1440;
  const hh = String(Math.floor(picked / 60)).padStart(2, '0');
  const mm = String(picked % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

async function runOnce(): Promise<number> {
  if (!isVapidConfigured()) return 0;

  const hour = currentHour();
  const sent: string[] = [];

  // Слот «Утро» — прежние dailyReminder/reminderTime (настроение).
  // Режим "exact" фильтруем явно, чтобы пользователь, переключившийся на
  // "window", не получил ещё и старую точную отправку по устаревшему
  // reminderTime.
  const morning = await prisma.userPreference.findMany({
    where: { dailyReminder: true, reminderMode: 'exact', reminderTime: { startsWith: `${hour}:` } },
    select: { userId: true },
  });
  for (const pref of morning) {
    await sendForSlot(pref, {
      title: 'Moodly',
      body: 'Как вы себя чувствуете сейчас? Отметьте настроение — это займёт 30 секунд.',
      url: '/my-day',
    });
    sent.push(pref.userId);
  }

  // Слот «Утро» в режиме «гибкое окно».
  const morningWindow = await prisma.userPreference.findMany({
    where: { dailyReminder: true, reminderMode: 'window' },
    select: { userId: true, reminderWindowStart: true, reminderWindowEnd: true },
  });
  for (const pref of morningWindow) {
    const picked = pickWindowTime(
      pref.userId,
      'morning',
      pref.reminderWindowStart ?? '09:00',
      pref.reminderWindowEnd ?? '12:00',
    );
    if (!picked.startsWith(`${hour}:`)) continue;
    await sendForSlot(pref, {
      title: 'Moodly',
      body: 'Как вы себя чувствуете сейчас? Отметьте настроение — это займёт 30 секунд.',
      url: '/my-day',
    });
    sent.push(pref.userId);
  }

  // Слот «День» — середина дня. Текст берётся из БД (контент-менеджер).
  const afternoon = await prisma.userPreference.findMany({
    where: {
      afternoonReminder: true,
      afternoonMode: 'exact',
      afternoonTime: { startsWith: `${hour}:` },
    },
    select: { userId: true },
  });
  for (const pref of afternoon) {
    const message = await contentService.messageOfDay('day', 'ru', pref.userId);
    await sendForSlot(pref, {
      title: 'Moodly',
      body: message?.question ?? message?.text ?? 'Как проходит день? Отметьте, что вас окружает.',
      url: '/my-day',
    });
    sent.push(pref.userId);
  }

  // Слот «День» в режиме «гибкое окно».
  const afternoonWindow = await prisma.userPreference.findMany({
    where: { afternoonReminder: true, afternoonMode: 'window' },
    select: { userId: true, afternoonWindowStart: true, afternoonWindowEnd: true },
  });
  for (const pref of afternoonWindow) {
    const picked = pickWindowTime(
      pref.userId,
      'afternoon',
      pref.afternoonWindowStart ?? '14:00',
      pref.afternoonWindowEnd ?? '17:00',
    );
    if (!picked.startsWith(`${hour}:`)) continue;
    const message = await contentService.messageOfDay('day', 'ru', pref.userId);
    await sendForSlot(pref, {
      title: 'Moodly',
      body: message?.question ?? message?.text ?? 'Как проходит день? Отметьте, что вас окружает.',
      url: '/my-day',
    });
    sent.push(pref.userId);
  }

  // Слот «Вечер» — итог дня («Мой день»).
  const evening = await prisma.userPreference.findMany({
    where: { eveningReminder: true, eveningMode: 'exact', eveningTime: { startsWith: `${hour}:` } },
    select: { userId: true },
  });
  for (const pref of evening) {
    await sendForSlot(pref, {
      title: 'Moodly',
      body: 'Как прошёл день? Подведите итог и отметьте занятия — это займёт 30 секунд.',
      url: '/my-day',
    });
    sent.push(pref.userId);
  }

  // Слот «Вечер» в режиме «гибкое окно» — типичный случай из аудита:
  // «вечер, примерно между 20:00 и 23:00» вместо одной точной минуты.
  const eveningWindow = await prisma.userPreference.findMany({
    where: { eveningReminder: true, eveningMode: 'window' },
    select: { userId: true, eveningWindowStart: true, eveningWindowEnd: true },
  });
  for (const pref of eveningWindow) {
    const picked = pickWindowTime(
      pref.userId,
      'evening',
      pref.eveningWindowStart ?? '20:00',
      pref.eveningWindowEnd ?? '23:00',
    );
    if (!picked.startsWith(`${hour}:`)) continue;
    await sendForSlot(pref, {
      title: 'Moodly',
      body: 'Как прошёл день? Подведите итог и отметьте занятия — это займёт 30 секунд.',
      url: '/my-day',
    });
    sent.push(pref.userId);
  }

  return sent.length;
}

function start(): void {
  const tick = () => {
    void runOnce().catch((err: unknown) => {
      console.error('[reminder] failed:', err);
    });
  };
  void runOnce().catch((err: unknown) => {
    console.error('[reminder] failed:', err);
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
