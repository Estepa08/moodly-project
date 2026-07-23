import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useRecommendation() {
  return useQuery({
    queryKey: ["recommendation"],
    queryFn: () => api.practices.recommended(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useRecordRecommendationAction() {
  return useMutation({
    mutationFn: ({ practiceId, action }: { practiceId: string; action: "shown" | "taken" | "dismissed" }) =>
      api.practices.recordAction(practiceId, action),
  });
}
