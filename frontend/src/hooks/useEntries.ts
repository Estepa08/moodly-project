import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { enqueue } from "../lib/offline/sync";
import { listLocalEntries } from "../lib/offline/db";
import { uuidv7 } from "@moodly/shared";
import type { components } from "../lib/api-types";
import { decryptEntryPayload, encryptEntryPayload, type ActivitySelection } from "../lib/crypto/records";

type Entry = components["schemas"]["Entry"];

export interface DecryptedEntry extends Entry {
  value: number;
  note: string | null;
  activities?: ActivitySelection[];
}

async function decryptEntry(e: Entry): Promise<DecryptedEntry> {
  if (!e.encryptedData) {
    // Легаси-запись без шифротекста (миграция не тронула) — вернём как есть.
    return { ...e, value: e.value ?? 0, note: e.note ?? null, activities: [] };
  }
  const payload = await decryptEntryPayload(e.encryptedData, e.id);
  return { ...e, value: payload.value, note: payload.note, activities: payload.activities };
}

export function useEntries(params?: { parameterId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["entries", params],
    // offline-first: при офлайне читаем локальный кэш из IndexedDB (наполняется через pull)
    queryFn: async () => {
      const raw = navigator.onLine
        ? await api.entries.list(params)
        : await listLocalEntries(params);
      return Promise.all((raw as Entry[]).map(decryptEntry));
    },
    staleTime: 30_000,
  });
}

export function useCreateEntry(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: {
      parameterId: string;
      value: number;
      note?: string;
      activities?: ActivitySelection[];
    }) => {
      const id = uuidv7();
      const encryptedData = await encryptEntryPayload(
        { value: data.value, note: data.note ?? null, activities: data.activities },
        id,
      );
      if (!navigator.onLine) {
        await enqueue("entry", "upsert", id, {
          parameterId: data.parameterId,
          encryptedData,
        });
        return {
          id,
          userId: "",
          parameterId: data.parameterId,
          value: data.value,
          note: data.note ?? null,
          activities: data.activities ?? [],
          createdAt: new Date().toISOString(),
        };
      }
      return api.entries.create({ id, parameterId: data.parameterId, encryptedData });
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
    mutationFn: async ({
      id,
      value,
      note,
      activities,
    }: {
      id: string;
      value: number;
      note?: string;
      activities?: ActivitySelection[];
    }) => {
      const encryptedData = await encryptEntryPayload(
        { value, note: note ?? null, activities },
        id,
      );
      if (!navigator.onLine) {
        await enqueue("entry", "upsert", id, { encryptedData });
        return {
          id,
          userId: "",
          parameterId: "",
          value,
          note: note ?? null,
          activities: activities ?? [],
          createdAt: new Date().toISOString(),
        };
      }
      return api.entries.update(id, { encryptedData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: () => {
      toast.error(t("dashboard.saveError"));
    },
  });
}
