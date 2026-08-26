import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { reportMutationError } from '../shared/reportMutationError';
import type { components } from '../../lib/api-types';

type DecatastrophizingEntryCreate = components['schemas']['DecatastrophizingEntryCreate'];

export function useDecatastrophizingEntries() {
  return useQuery({
    queryKey: ['decatastrophizing-entries'],
    queryFn: () => api.decatastrophizing.entries.list(),
    staleTime: 30_000,
  });
}

export function useCreateDecatastrophizingEntry(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: DecatastrophizingEntryCreate) => api.decatastrophizing.entries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decatastrophizing-entries'] });
      onSuccess?.();
    },
    onError: (err) => {
      reportMutationError('decatastrophizing-create', err);
      toast.error(t('decatastrophizing.saveError'));
    },
  });
}

export function useDeleteDecatastrophizingEntry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => api.decatastrophizing.entries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decatastrophizing-entries'] });
    },
    onError: (err) => {
      reportMutationError('decatastrophizing-delete', err);
      toast.error(t('decatastrophizing.saveError'));
    },
  });
}
