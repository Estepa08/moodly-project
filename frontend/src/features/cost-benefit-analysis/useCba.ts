import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { reportError } from '../../lib/errorReporter';
import type { components } from '../../lib/api-types';

type CbaEntryCreate = components['schemas']['CbaEntryCreate'];

// Логирует реальную причину ошибки сохранения CBA-записи (как и в useEntries).
function reportCbaSaveError(operation: string, err: unknown): void {
  const message =
    err instanceof Error
      ? `saveError [cba-${operation}] ${err.name}: ${err.message}`
      : `saveError [cba-${operation}] Unexpected error: ${String(err)}`;
  reportError({ message, stack: err instanceof Error ? err.stack : undefined });
}

export function useCbaExamples() {
  return useQuery({
    queryKey: ['cba-examples'],
    queryFn: () => api.cba.examples(),
    staleTime: 60_000,
  });
}

export function useCbaCommonItems() {
  return useQuery({
    queryKey: ['cba-common-items'],
    queryFn: () => api.cba.commonItems(),
    staleTime: 60_000,
  });
}

export function useCbaEntries() {
  return useQuery({
    queryKey: ['cba-entries'],
    queryFn: () => api.cba.entries.list(),
    staleTime: 30_000,
  });
}

export function useCreateCbaEntry(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: CbaEntryCreate) => api.cba.entries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cba-entries'] });
      onSuccess?.();
    },
    onError: (err) => {
      reportCbaSaveError('create', err);
      toast.error(t('cba.saveError'));
    },
  });
}

export function useDeleteCbaEntry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => api.cba.entries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cba-entries'] });
    },
    onError: (err) => {
      reportCbaSaveError('delete', err);
      toast.error(t('cba.saveError'));
    },
  });
}
