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

export function useCreatureStats() {
  return useQuery({
    queryKey: ["creature", "stats"],
    queryFn: () => api.creature.getStats(),
    staleTime: 60_000,
  });
}

export function usePets() {
  return useQuery({
    queryKey: ["creature", "pets"],
    queryFn: () => api.creature.getPets(),
    staleTime: 60_000,
  });
}

export function useSetPet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: string | { petType?: string; petName?: string | null }) =>
      typeof args === "string"
        ? api.creature.setPet(args)
        : api.creature.setPet(args.petType, args.petName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creature", "pets"] });
      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });
}

export function useHeatmap(days = 90) {
  return useQuery({
    queryKey: ["creature", "heatmap", days],
    queryFn: () => api.creature.getHeatmap(days),
    staleTime: 60_000,
  });
}

export function useMissions() {
  return useQuery({
    queryKey: ["creature", "missions"],
    queryFn: () => api.creature.getMissions(),
    staleTime: 30_000,
  });
}

export function useClaimMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.creature.claimMission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creature", "missions"] });
      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.achievements.list(),
    staleTime: 60_000,
  });
}
