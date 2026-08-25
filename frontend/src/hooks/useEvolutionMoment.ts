import { useEffect, useState } from 'react';
import { EVOLUTION_STAGES } from '@moodly/shared';
import { useCreatureState } from '../features/gamification/useCreature';
import { safeLocalStorage } from '../lib/safeStorage';

const STORAGE_KEY = 'moodly_pet_stage_seen';

function stageIndex(stage: string): number {
  return EVOLUTION_STAGES.findIndex((s) => s.key === stage);
}

function readStoredStage(): string | null {
  return safeLocalStorage.getItem(STORAGE_KEY);
}

function writeStoredStage(stage: string) {
  safeLocalStorage.setItem(STORAGE_KEY, stage);
}

export interface EvolutionTransition {
  from: string;
  to: string;
}

// F1: показывает оверлей «момент эволюции» ровно один раз при переходе
// питомца на новую стадию (baby → kid → adult → max). Первая загрузка для
// уже существующего аккаунта только запоминает текущую стадию — оверлей не
// показывается задним числом.
export function useEvolutionMoment() {
  const { data: creature } = useCreatureState();
  const [transition, setTransition] = useState<EvolutionTransition | null>(null);

  useEffect(() => {
    const stage = creature?.stage;
    if (!stage) return;

    const stored = readStoredStage();
    if (stored === null) {
      writeStoredStage(stage);
      return;
    }
    if (stored === stage) return;

    if (stageIndex(stage) > stageIndex(stored)) {
      setTransition({ from: stored, to: stage });
    }
    writeStoredStage(stage);
  }, [creature?.stage]);

  const dismiss = () => setTransition(null);

  return { transition, dismiss };
}
