import { useCreatureState } from "../features/gamification/useCreature";
import { useTestResults } from "./useTests";
import { useStalePractices } from "./useStalePractices";

export function useNavHighlights() {
  const { data: creature } = useCreatureState();
  const { data: testResults } = useTestResults();
  const { staleCount } = useStalePractices(3);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCheckIn = creature?.lastCheckInAt ? new Date(creature.lastCheckInAt) : null;
  const checkedInToday = lastCheckIn && lastCheckIn >= today;
  const dashboard = !checkedInToday;

  const practices = staleCount > 0;

  const lastTest = testResults && testResults.length > 0
    ? new Date(testResults[0].completedAt)
    : null;
  const daysSinceTest = lastTest
    ? Math.floor((Date.now() - lastTest.getTime()) / 86400000)
    : 999;
  const tests = daysSinceTest >= 14;

  return { dashboard, practices, tests } as const;
}
