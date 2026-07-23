import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function useEntries(params?: { parameterId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["entries", params],
    queryFn: () => api.entries.list(params),
    staleTime: 30_000,
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

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, value, note }: { id: string; value: number; note?: string }) =>
      api.entries.update(id, { value, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: () => {
      toast.error(t("dashboard.saveError"));
    },
  });
}
