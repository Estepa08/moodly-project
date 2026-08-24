import { useEffect, useState } from 'react';
import { useCreatureState } from '../features/gamification/useCreature';

const STORAGE_KEY = 'moodly_streak_milestone_seen';

// Tier 3 (docs/gamification-phase2-visuals.svg, ряд 2): вехи стрика,
// отсортированы по возрастанию — важно для «какой самый старший тир уже
// пройден» при первой загрузке и при догоняющем чек-ине после лапса.
export const STREAK_MILESTONE_TIERS = [7, 30, 100] as const;
export type StreakMilestoneDays = (typeof STREAK_MILESTONE_TIERS)[number];

function readStoredSeen(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function writeSeen(days: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(days));
  } catch {
    /* localStorage may throw in private browsing */
  }
}

function highestTierAtOrBelow(streak: number): number {
  let highest = 0;
  for (const tier of STREAK_MILESTONE_TIERS) {
    if (streak >= tier) highest = tier;
  }
  return highest;
}

// Показывает оверлей ровно один раз при пересечении каждой вехи (7 → 30 →
// 100), никогда повторно (веха трактуется как одноразовая, симметрично
// одноразовым ачивкам streak_7/streak_30/streak_100). Первая загрузка для
// уже существующего аккаунта только запоминает текущую веху — оверлей не
// показывается задним числом за уже пройденные вехи.
export function useStreakMilestoneMoment() {
  const { data: creature } = useCreatureState();
  const [milestone, setMilestone] = useState<StreakMilestoneDays | null>(null);

  useEffect(() => {
    const streak = creature?.streak;
    if (streak === undefined) return;

    const stored = readStoredSeen();
    if (stored === null) {
      writeSeen(highestTierAtOrBelow(streak));
      return;
    }

    const newlyCrossed = STREAK_MILESTONE_TIERS.filter((d) => streak >= d && d > stored).pop();
    if (newlyCrossed !== undefined) {
      setMilestone(newlyCrossed as StreakMilestoneDays);
      writeSeen(newlyCrossed);
    }
  }, [creature?.streak]);

  const dismiss = () => setMilestone(null);

  return { milestone, dismiss };
}
