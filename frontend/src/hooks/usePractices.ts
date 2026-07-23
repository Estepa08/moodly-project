import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function usePractices() {
  return useQuery({
    queryKey: ["practices"],
    queryFn: () => api.practices.list(),
    staleTime: 5 * 60 * 1000,
  });
}
