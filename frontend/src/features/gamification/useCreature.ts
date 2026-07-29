import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { PracticeSource } from "./practice.enums";

export function useCreatureState() {
  return useQuery({
    queryKey: ["creature"],
    queryFn: () => api.creature.getState(),
    staleTime: 30_000,
  });
}

export function useCompleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (duration: number) => api.creature.completeExercise(duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });
}

export function useRewardPractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (source: PracticeSource) => api.creature.reward(source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });
}

export function useCompletions(days = 30) {
  return useQuery({
    queryKey: ["creature", "completions", days],
    queryFn: () => api.creature.getCompletions(days),
    staleTime: 30_000,
  });
}
