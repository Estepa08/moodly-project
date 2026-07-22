import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useOnboardingStories() {
  return useQuery({
    queryKey: ["onboarding"],
    queryFn: () => api.onboarding.list(),
  });
}
