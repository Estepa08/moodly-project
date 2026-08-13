import { useMemo } from 'react';
import { useParameters } from './useParameters';
import { useEntries, useCreateEntry, useUpdateEntry } from './useEntries';
import { useRewardPractice, PracticeSource } from '../features/gamification';

export function useSleepHygieneEntry() {
  const { data: params } = useParameters();
  const hygieneParam = useMemo(
    () => params?.find((p) => p.name === 'Sleep Hygiene'),
    [params],
  );

  const { data: hygieneEntries } = useEntries(
    hygieneParam ? { parameterId: hygieneParam.id } : undefined,
  );
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateEntry(() => {
    rewardPractice.mutate(PracticeSource.SleepHygiene);
  });
  const updateEntry = useUpdateEntry();

  return {
    parameterId: hygieneParam?.id,
    hygieneEntries: hygieneParam ? (hygieneEntries ?? []) : [],
    createEntry,
    updateEntry,
  };
}
