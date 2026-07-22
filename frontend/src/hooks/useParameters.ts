import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useParameters() {
  return useQuery({
    queryKey: ["parameters"],
    queryFn: () => api.parameters.list(),
    staleTime: 60_000,
  });
}
