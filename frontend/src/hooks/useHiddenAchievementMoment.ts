import { useEffect, useState } from 'react';
import { useAchievements } from '../features/gamification/useCreature';
import type { Achievement } from '../lib/api';
import { safeLocalStorage } from '../lib/safeStorage';

const STORAGE_KEY = 'moodly_hidden_achievements_seen';

function readStoredSeen(): Set<string> | null {
  const raw = safeLocalStorage.getJSON<string[]>(STORAGE_KEY);
  if (raw === null) return null;
  return new Set(raw);
}

function writeSeen(ids: Set<string>) {
  safeLocalStorage.setJSON(STORAGE_KEY, [...ids]);
}

// Phase 2, п.7 (см. docs/gamification-hidden-achievement-visuals.svg): Tier 3
// на разблокировку скрытой (category === 'hidden') ачивки — полноэкранный
// оверлей один раз на ачивку, глобально (не только пока открыт AchievementGrid,
// в отличие от Tier 1 burst там же). Первая загрузка для уже существующего
// аккаунта только запоминает уже открытые скрытые ачивки — оверлей не
// показывается задним числом (тот же приём, что useEvolutionMoment/
// useStreakMilestoneMoment).
export function useHiddenAchievementMoment() {
  const { data: achievements } = useAchievements();
  const [unlocked, setUnlocked] = useState<Achievement | null>(null);

  useEffect(() => {
    if (!achievements) return;
    const hiddenUnlocked = achievements.filter((a) => a.category === 'hidden' && a.unlocked);
    const hiddenUnlockedIds = hiddenUnlocked.map((a) => a.id);

    const stored = readStoredSeen();
    if (stored === null) {
      writeSeen(new Set(hiddenUnlockedIds));
      return;
    }

    const newlyUnlocked = hiddenUnlocked.find((a) => !stored.has(a.id));
    if (newlyUnlocked) {
      setUnlocked(newlyUnlocked);
      writeSeen(new Set([...stored, newlyUnlocked.id]));
    }
  }, [achievements]);

  const dismiss = () => setUnlocked(null);

  return { achievement: unlocked, dismiss };
}
