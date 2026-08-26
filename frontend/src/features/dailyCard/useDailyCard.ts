import { useMemo, useState } from 'react';
import {
  getTodayCard,
  isOpenedToday,
  markOpenedToday,
  type MotivationCardEntry,
} from './dailyCard';

interface UseDailyCardResult {
  card: MotivationCardEntry;
  /** Уже открыта сегодня — из storage (в т.ч. при повторном визите на страницу). */
  isRevealed: boolean;
  /** true только в текущем сеансе сразу после open() — включает анимацию открытия. */
  justOpened: boolean;
  open: () => void;
}

export function useDailyCard(): UseDailyCardResult {
  const now = useMemo(() => new Date(), []);
  const card = useMemo(() => getTodayCard(now), [now]);
  const [revealed, setRevealed] = useState(() => isOpenedToday(now));
  const [justOpened, setJustOpened] = useState(false);

  const open = () => {
    if (revealed) return;
    markOpenedToday(now);
    setRevealed(true);
    setJustOpened(true);
  };

  return { card, isRevealed: revealed, justOpened, open };
}
