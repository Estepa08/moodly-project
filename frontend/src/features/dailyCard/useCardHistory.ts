import { useMemo, useState } from 'react';
import {
  getCardRange,
  getNextMidnight,
  isCardOpened,
  markCardOpened,
  type DayCardInfo,
  type MotivationCardEntry,
} from './dailyCard';

export type DayCardViewModel =
  | { kind: 'locked'; dateKey: string; offset: number; unlocksAt: number }
  | {
      kind: 'open';
      dateKey: string;
      offset: number;
      card: MotivationCardEntry;
      /** Карточка ещё ни разу не открывалась — на рубашке текст-приглашение
       *  «открыть», а не «вспомнить», и первый флип даёт праздничный burst. */
      isFirstReveal: boolean;
      /** Текст сейчас показан лицом вверх — тоггл, можно перевернуть обратно. */
      revealed: boolean;
      toggle: () => void;
    };

export interface UseCardHistoryOptions {
  /** Сколько дней в прошлое можно проскроллить (по умолчанию неделя). */
  daysBack?: number;
}

const DEFAULT_DAYS_BACK = 7;

// Лента карточек: до `daysBack` дней в прошлое (можно проскроллить), сегодня
// и один запертый день вперёд. Дни раньше персонального anchor'а (когда
// пользователь ещё не пользовался приложением) в ленту не попадают — история
// растёт органически день за днём, а не сразу зияет пустыми рубашками.
// Карточка переворачивается туда-обратно повторным тапом (revealed —
// session-state, не персистится). Персистится только факт «видел ли текст
// хоть раз» (isCardOpened) — по нему решаем, показать ли на рубашке
// приглашение «открыть» или «вспомнить», и стоит ли давать праздничный burst
// при первом открытии (решение о burst принимает сам FlipCard по isFirstReveal).
export function useCardHistory({
  daysBack = DEFAULT_DAYS_BACK,
}: UseCardHistoryOptions = {}): DayCardViewModel[] {
  const now = useMemo(() => new Date(), []);
  const range = useMemo(() => getCardRange(now, { daysBack, daysForward: 1 }), [now, daysBack]);
  const tomorrowUnlocksAt = useMemo(() => getNextMidnight(now), [now]);

  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const toVm = (day: DayCardInfo): DayCardViewModel | null => {
    if (day.offset > 0) {
      return {
        kind: 'locked',
        dateKey: day.dateKey,
        offset: day.offset,
        unlocksAt: tomorrowUnlocksAt,
      };
    }
    if (day.dayNumber === null || !day.card) return null;

    const card = day.card;
    const wasOpenedBefore = isCardOpened(day.dateKey);
    return {
      kind: 'open',
      dateKey: day.dateKey,
      offset: day.offset,
      card,
      isFirstReveal: !wasOpenedBefore,
      revealed: !!revealedKeys[day.dateKey],
      toggle: () => {
        setRevealedKeys((prev) => {
          const next = !prev[day.dateKey];
          if (next && !wasOpenedBefore) markCardOpened(day.dateKey);
          return { ...prev, [day.dateKey]: next };
        });
      },
    };
  };

  return range.map(toVm).filter((vm): vm is DayCardViewModel => vm !== null);
}
