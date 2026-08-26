import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { reportMutationError } from '../shared/reportMutationError';
import type { components } from '../../lib/api-types';

type ResponsibilityPieEntryCreate = components['schemas']['ResponsibilityPieEntryCreate'];

export function useResponsibilityPieEntries() {
  return useQuery({
    queryKey: ['responsibility-pie-entries'],
    queryFn: () => api.responsibilityPie.entries.list(),
    staleTime: 30_000,
  });
}

export function useCreateResponsibilityPieEntry(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: ResponsibilityPieEntryCreate) => api.responsibilityPie.entries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibility-pie-entries'] });
      onSuccess?.();
    },
    onError: (err) => {
      reportMutationError('responsibility-pie-create', err);
      toast.error(t('responsibilityPie.saveError'));
    },
  });
}

export function useDeleteResponsibilityPieEntry() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (id: string) => api.responsibilityPie.entries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsibility-pie-entries'] });
    },
    onError: (err) => {
      reportMutationError('responsibility-pie-delete', err);
      toast.error(t('responsibilityPie.saveError'));
    },
  });
}
