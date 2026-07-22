import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useEntries(params?: { parameterId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["entries", params],
    queryFn: () => api.entries.list(params),
  });
}

export function useCreateEntry(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: { parameterId: string; value: number; note?: string }) =>
      api.entries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      onSuccess?.();
    },
    onError: () => {
      toast.error(t("dashboard.saveError"));
    },
  });
}
