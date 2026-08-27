import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { InterfaceMode } from '../lib/constants';
import { setClassicMode } from '../features/gamification/interfaceModeStore';
import { useCurrentUser } from './useCurrentUser';

/**
 * Классический режим (см. docs/plans/three-personas-design-gaps.md, Сессия 1):
 * полностью отключает игровую надстройку (питомец/XP/достижения/streak-heatmap)
 * в UI. Бэкенд продолжает считать прогресс компаньона фоново в обоих режимах —
 * это только UI-переключатель отображения, не источник истины о прогрессе.
 */
export function useInterfaceMode() {
  const { data: user, isLoading } = useCurrentUser();
  const mode = (user?.interfaceMode as InterfaceMode | undefined) ?? InterfaceMode.Companion;
  const isClassic = mode === InterfaceMode.Classic;

  // Зеркалим в модульный стор для celebration.tsx (не React-код, не может
  // читать react-query напрямую) — см. interfaceModeStore.ts.
  useEffect(() => {
    setClassicMode(isClassic);
  }, [isClassic]);

  return { mode, isClassic, isLoading };
}

export function useSetInterfaceMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mode: InterfaceMode) => api.users.update({ interfaceMode: mode }),
    onSuccess: (user) => {
      queryClient.setQueryData(['userMe'], user);
    },
  });
}
