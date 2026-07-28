import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCreatureState } from "./useCreature";
import { useCompletions } from "./useCreature";
import { useEntries } from "./useEntries";
import { useTestResults } from "./useTests";
import type { LucideIcon } from "lucide-react";
import { Wind, Heart, ClipboardList } from "lucide-react";

export interface Recommendation {
  id: string;
  priority: number;
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
}

export function useRecommendations(): Recommendation[] {
  const { t } = useTranslation();
  const { data: creature } = useCreatureState();
  const { data: completions } = useCompletions(7);
  const { data: entries } = useEntries();
  const { data: testResults } = useTestResults();

  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    const result: Recommendation[] = [];

    if (!creature) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCheckIn = creature.lastCheckInAt ? new Date(creature.lastCheckInAt) : null;
    const checkedInToday = lastCheckIn && lastCheckIn >= today;

    if (!checkedInToday) {
      result.push({
        id: "check-in",
        priority: 90,
        icon: Heart,
        title: t("insights.checkInTitle"),
        description: t("insights.checkInDesc"),
        actionLabel: t("insights.checkInAction"),
        actionPath: "/",
      });
    }

    if (creature.streak >= 5) {
      result.push({
        id: "streak",
        priority: 20,
        icon: Heart,
        title: t("insights.streakTitle"),
        description: t("insights.streakDesc", { count: creature.streak }),
        actionLabel: t("insights.streakAction"),
        actionPath: "/",
      });
    }

    const lastExercise = creature.lastExerciseAt ? new Date(creature.lastExerciseAt) : null;
    const daysSinceExercise = lastExercise
      ? Math.floor((Date.now() - lastExercise.getTime()) / 86400000)
      : 999;

    if (daysSinceExercise >= 3) {
      result.push({
        id: "breathing",
        priority: 60,
        icon: Wind,
        title: t("insights.breathingTitle"),
        description: t("insights.breathingDesc"),
        actionLabel: t("insights.breathingAction"),
        actionPath: "/breathing",
      });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCompletions = completions?.filter((c) => new Date(c.createdAt) >= weekAgo) ?? [];

    if (recentCompletions.length === 0) {
      result.push({
        id: "practices",
        priority: 50,
        icon: Wind,
        title: t("insights.practicesTitle"),
        description: t("insights.practicesDesc"),
        actionLabel: t("insights.practicesAction"),
        actionPath: "/practices",
      });
    }

    const lastTest = testResults && testResults.length > 0
      ? new Date(testResults[0].completedAt)
      : null;
    const daysSinceTest = lastTest
      ? Math.floor((Date.now() - lastTest.getTime()) / 86400000)
      : 999;

    if (daysSinceTest >= 14) {
      result.push({
        id: "test",
        priority: 30,
        icon: ClipboardList,
        title: t("insights.testTitle"),
        description: t("insights.testDesc"),
        actionLabel: t("insights.testAction"),
        actionPath: "/tests",
      });
    }

    result.sort((a, b) => b.priority - a.priority);
    setRecs(result);
  }, [creature, completions, entries, testResults, t]);

  return recs;
}
