import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useWeeklyDigest() {
  return useQuery({
    queryKey: ["digest", "weekly"],
    queryFn: () => api.digest.weekly(),
    staleTime: 60_000,
  });
}
