import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useAdminFeedbackList() {
  return useQuery({
    queryKey: ["adminFeedback"],
    queryFn: () => api.admin.listFeedback(),
    staleTime: 30_000,
  });
}
