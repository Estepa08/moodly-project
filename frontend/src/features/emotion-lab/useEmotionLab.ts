import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { reportError } from "../../lib/errorReporter";
import type { components } from "../../lib/api-types";

export type EmotionLabState = components["schemas"]["EmotionLabState"];
type EmotionLabAttemptRequest = components["schemas"]["EmotionLabAttemptRequest"];
export type EmotionLabAttemptResponse = components["schemas"]["EmotionLabAttemptResponse"];

const STATE_KEY = ["emotion-lab"] as const;

function reportAttemptError(err: unknown): void {
  const message =
    err instanceof Error
      ? `saveError [emotion-lab-attempt] ${err.name}: ${err.message}`
      : `saveError [emotion-lab-attempt] Unexpected error: ${String(err)}`;
  reportError({ message, stack: err instanceof Error ? err.stack : undefined });
}

export function useEmotionLabState() {
  return useQuery({
    queryKey: STATE_KEY,
    queryFn: () => api.emotionLab.state(),
    staleTime: 30_000,
  });
}

export function useEmotionLabAttempt() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (body: EmotionLabAttemptRequest) => api.emotionLab.attempt(body),
    onSuccess: (data) => {
      queryClient.setQueryData<EmotionLabState>(STATE_KEY, (prev) => {
        const discovered = new Set(prev?.discoveredDyads ?? []);
        if (!discovered.has(data.dyad.key)) {
          discovered.add(data.dyad.key);
        }
        return prev
          ? {
              ...prev,
              discoveredDyads: [...discovered],
              discoveredCount: discovered.size,
              attemptsUsed: data.attemptsUsed,
              attemptsRemaining: data.attemptsRemaining,
              availableLevel: data.availableLevel,
              limitReached: data.limitReached,
              resetsAt: data.resetsAt,
            }
          : prev;
      });
      queryClient.invalidateQueries({ queryKey: STATE_KEY });
    },
    onError: (err: unknown) => {
      reportAttemptError(err);
      toast.error(t("emotionLab.attemptError"));
    },
  });
}
