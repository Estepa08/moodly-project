import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { CreatureState } from "../lib/api";

function isToday(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function useDailyCheckIn(creature: CreatureState | undefined) {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const shouldShow = useMemo(() => {
    if (!creature || dismissed) return false;
    return !isToday(creature.lastCheckInAt);
  }, [creature, dismissed]);

  const mutation = useMutation({
    mutationFn: () => api.creature.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });

  const doCheckIn = useCallback(() => {
    mutation.mutate(undefined, {
      onSuccess: (data) => {
        setDismissed(true);
        return data;
      },
    });
  }, [mutation]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    shouldShow,
    isPending: mutation.isPending,
    doCheckIn,
    dismiss,
    lastResult: mutation.data,
  };
}
