import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { isNetworkError, isServerError } from '../lib/api-error';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { enqueue } from '../lib/offline/sync';
import {
  deleteLocalEntry,
  listLocalEntries,
  saveLocalEntry,
  type LocalEntry,
} from '../lib/offline/db';
import { uuidv7 } from '@moodly/shared';
import { reportError } from '../lib/errorReporter';
import { decryptSettled } from '../lib/decryptSettled';
import type { components } from '../lib/api-types';
import {
  decryptEntryPayload,
  encryptEntryPayload,
  parseLegacyActivities,
  type ActivitySelection,
} from '../lib/crypto/records';
import type { DistortionKey } from '../lib/distortionsQuiz';

type Entry = components['schemas']['Entry'];

// Логирует реальную причину ошибки сохранения (код/сообщение) на бэкенд
// (POST /client-errors), чтобы в проде было видно первопричину, а не
// переведённую фразу тоста.
function reportSaveError(operation: string, err: unknown): void {
  const message =
    err instanceof Error ? `${err.name}: ${err.message}` : `Unexpected error: ${String(err)}`;
  const stack = err instanceof Error ? err.stack : undefined;
  reportError({ message: `saveError [${operation}] ${message}`, stack });
}

/**
 * Общий хвост для офлайн-режима и для отказа сервера (сеть/5xx): кладём
 * операцию в офлайн-очередь, зеркалим её в локальный кэш (IndexedDB) и
 * возвращаем «оптимистичный» результат так, как будто запись сохранилась —
 * синк дошлёт её на сервер позже. Используется и из ветки `!navigator.onLine`,
 * и из catch-блока после неудачного запроса — обе ветки должны вести себя
 * идентично, чтобы не терять данные.
 */
async function offlineFallback<T>(args: {
  id: string;
  enqueueData: Record<string, unknown>;
  localEntry: Partial<LocalEntry> & { id: string };
  toResult: () => T;
}): Promise<T> {
  await enqueue('entry', 'upsert', args.id, args.enqueueData);
  await saveLocalEntry(args.localEntry);
  return args.toResult();
}

export interface DecryptedEntry extends Entry {
  value: number;
  note: string | null;
  activities?: ActivitySelection[];
  distortions?: DistortionKey[];
  beliefBefore?: number;
  beliefAfter?: number;
  alternativeThought?: string;
  emotions?: string[];
}

async function decryptEntry(e: Entry): Promise<DecryptedEntry> {
  if (!e.encryptedData) {
    // Легаси-запись без шифротекста (demo-сид/миграция) — вернём как есть.
    // Активности для параметра Day Activities в таких записях лежат в note.
    return {
      ...e,
      value: e.value ?? 0,
      note: e.note ?? null,
      activities: parseLegacyActivities(e.note),
    };
  }
  const payload = await decryptEntryPayload(e.encryptedData, e.id);
  return {
    ...e,
    value: payload.value,
    note: payload.note,
    activities: payload.activities,
    distortions: payload.distortions,
    beliefBefore: payload.beliefBefore,
    beliefAfter: payload.beliefAfter,
    alternativeThought: payload.alternativeThought,
    emotions: payload.emotions,
  };
}

export function useEntries(params?: { parameterId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['entries', params],
    // offline-first: при офлайне или недоступном сервере читаем локальный кэш
    // из IndexedDB (наполняется через pull).
    queryFn: async () => {
      if (navigator.onLine) {
        try {
          const raw = await api.entries.list(params);
          return decryptSettled(raw as Entry[], decryptEntry, 'entries');
        } catch (err) {
          if (!isNetworkError(err)) throw err;
          // ERR_CONNECTION_REFUSED и т.п. — сервер недоступен, читаем локально.
        }
      }
      const raw = await listLocalEntries(params);
      return decryptSettled(raw as Entry[], decryptEntry, 'entries');
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
      distortions?: DistortionKey[];
      beliefBefore?: number;
      beliefAfter?: number;
      alternativeThought?: string;
      emotions?: string[];
    }) => {
      const id = uuidv7();
      const encryptedData = await encryptEntryPayload(
        {
          value: data.value,
          note: data.note ?? null,
          activities: data.activities,
          distortions: data.distortions,
          beliefBefore: data.beliefBefore,
          beliefAfter: data.beliefAfter,
          alternativeThought: data.alternativeThought,
          emotions: data.emotions,
        },
        id,
      );
      const fallback = () =>
        offlineFallback({
          id,
          enqueueData: { parameterId: data.parameterId, encryptedData },
          localEntry: {
            id,
            userId: '',
            parameterId: data.parameterId,
            encryptedData,
            value: data.value,
            note: data.note ?? null,
            createdAt: new Date().toISOString(),
          },
          toResult: () => ({
            id,
            userId: '',
            parameterId: data.parameterId,
            value: data.value,
            note: data.note ?? null,
            activities: data.activities ?? [],
            distortions: data.distortions ?? [],
            beliefBefore: data.beliefBefore,
            beliefAfter: data.beliefAfter,
            alternativeThought: data.alternativeThought,
            emotions: data.emotions ?? [],
            createdAt: new Date().toISOString(),
          }),
        });

      if (!navigator.onLine) {
        return fallback();
      }
      try {
        return await api.entries.create({ id, parameterId: data.parameterId, encryptedData });
      } catch (err) {
        if (!isNetworkError(err) && !isServerError(err)) throw err;
        // Сервер недоступен (ERR_CONNECTION_REFUSED) или ответил 5xx (деплой,
        // перезапуск, сбой БД) — кладём в офлайн-очередь и локальное зеркало,
        // чтобы не потерять запись: синк отправит её позже.
        return fallback();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      onSuccess?.();
    },
    onError: (err) => {
      reportSaveError('create', err);
      toast.error(t('dashboard.saveError'));
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await enqueue('entry', 'delete', id);
        await deleteLocalEntry(id);
        return undefined;
      }
      try {
        return await api.entries.delete(id);
      } catch (err) {
        if (!isNetworkError(err) && !isServerError(err)) throw err;
        await enqueue('entry', 'delete', id);
        await deleteLocalEntry(id);
        return undefined;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
    onError: (err) => {
      reportSaveError('delete', err);
      toast.error(t('dashboard.saveError'));
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
      distortions,
      beliefBefore,
      beliefAfter,
      alternativeThought,
      emotions,
    }: {
      id: string;
      value: number;
      note?: string;
      activities?: ActivitySelection[];
      distortions?: DistortionKey[];
      beliefBefore?: number;
      beliefAfter?: number;
      alternativeThought?: string;
      emotions?: string[];
    }) => {
      const encryptedData = await encryptEntryPayload(
        {
          value,
          note: note ?? null,
          activities,
          distortions,
          beliefBefore,
          beliefAfter,
          alternativeThought,
          emotions,
        },
        id,
      );
      const fallback = () =>
        offlineFallback({
          id,
          enqueueData: { encryptedData },
          localEntry: { id, encryptedData, value, note: note ?? null },
          toResult: () => ({
            id,
            userId: '',
            parameterId: '',
            value,
            note: note ?? null,
            activities: activities ?? [],
            distortions: distortions ?? [],
            beliefBefore,
            beliefAfter,
            alternativeThought,
            emotions: emotions ?? [],
            createdAt: new Date().toISOString(),
          }),
        });

      if (!navigator.onLine) {
        return fallback();
      }
      try {
        return await api.entries.update(id, { encryptedData });
      } catch (err) {
        if (!isNetworkError(err) && !isServerError(err)) throw err;
        return fallback();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
    onError: (err) => {
      reportSaveError('update', err);
      toast.error(t('dashboard.saveError'));
    },
  });
}
