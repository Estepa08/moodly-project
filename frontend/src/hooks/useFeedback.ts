import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useFeedbackList() {
  return useQuery({
    queryKey: ["feedback"],
    queryFn: () => api.feedback.listMine(),
    staleTime: 30_000,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (message: string) => api.feedback.create({ message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast.success(t("feedback.sent"));
    },
  });
}
