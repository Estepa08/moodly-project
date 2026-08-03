import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { enqueue } from "../lib/offline/sync";
import { listLocalEntries } from "../lib/offline/db";
import { uuidv7 } from "@moodly/shared";

export function useEntries(params?: { parameterId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["entries", params],
    // offline-first: при офлайне читаем локальный кэш из IndexedDB (наполняется через pull)
    queryFn: () => (navigator.onLine ? api.entries.list(params) : listLocalEntries(params)),
    staleTime: 30_000,
  });
}

export function useCreateEntry(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: { parameterId: string; value: number; note?: string }) => {
      if (!navigator.onLine) {
        const id = uuidv7();
        await enqueue("entry", "upsert", id, {
          parameterId: data.parameterId,
          value: data.value,
          note: data.note ?? null,
        });
        return {
          id,
          userId: "",
          parameterId: data.parameterId,
          value: data.value,
          note: data.note,
          createdAt: new Date().toISOString(),
        };
      }
      return api.entries.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      onSuccess?.();
    },
    onError: () => {
      toast.error(t("dashboard.saveError"));
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await enqueue("entry", "delete", id);
        return undefined;
      }
      return api.entries.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
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
    mutationFn: async ({ id, value, note }: { id: string; value: number; note?: string }) => {
      if (!navigator.onLine) {
        await enqueue("entry", "upsert", id, { value, note: note ?? null });
        return {
          id,
          userId: "",
          parameterId: "",
          value,
          note,
          createdAt: new Date().toISOString(),
        };
      }
      return api.entries.update(id, { value, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: () => {
      toast.error(t("dashboard.saveError"));
    },
  });
}
