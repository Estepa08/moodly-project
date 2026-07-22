import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useCreatureState() {
  return useQuery({
    queryKey: ["creature"],
    queryFn: () => api.creature.getState(),
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
