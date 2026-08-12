import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, type MessageOfDay } from '../lib/api';
import type { DayPhase } from './useDayPhase';

export function useMessageOfDay(type: DayPhase) {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en' : 'ru';

  return useQuery<MessageOfDay | null>({
    queryKey: ['message-of-day', type, locale],
    queryFn: () => api.content.messageOfDay(type, locale),
    staleTime: 60 * 60 * 1000,
  });
}
