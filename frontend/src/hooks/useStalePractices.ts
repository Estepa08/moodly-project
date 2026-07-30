import { useMemo } from "react";
import { useCompletions, useCreatureState } from "../features/gamification/useCreature";
import { PracticeSource } from "../features/gamification/practice.enums";

const ALL_SOURCES = Object.values(PracticeSource);

export function useStalePractices(thresholdDays = 3): {
  staleSources: PracticeSource[];
  staleCount: number;
  isStale: (source: PracticeSource) => boolean;
} {
  const { data: creature } = useCreatureState();
  const { data: completions } = useCompletions(thresholdDays);

  const recentSources = useMemo(() => {
    if (!completions) return new Set<PracticeSource>();
    return new Set(completions.map((c) => c.source as PracticeSource));
  }, [completions]);

  const staleSources = useMemo(() => {
    return ALL_SOURCES.filter((source) => {
      if (recentSources.has(source)) return false;

      if (source === PracticeSource.Breathing && creature?.lastExerciseAt) {
        const last = new Date(creature.lastExerciseAt);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - thresholdDays);
        return last < cutoff;
      }

      return true;
    });
  }, [recentSources, creature, thresholdDays]);

  const staleCount = staleSources.length;

  const isStale = (source: PracticeSource) => staleSources.includes(source);

  return { staleSources, staleCount, isStale };
}
