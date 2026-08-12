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
    queryFn: async () => {
      console.log("🔬 Fetching emotion lab state...");
      try {
        const result = await api.emotionLab.state();
        console.log("✅ State loaded:", result);
        return result;
      } catch (error) {
        console.error("❌ Failed to load state:", error);
        throw error;
      }
    },
    staleTime: 30_000,
  });
}

export function useEmotionLabAttempt() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (body: EmotionLabAttemptRequest) => {
      console.log("🔬 Attempt mutation called with:", body);
      console.log("📦 Sending to API:", JSON.stringify(body));

      try {
        const result = await api.emotionLab.attempt(body);
        console.log("✅ Attempt API response:", result);
        return result;
      } catch (error: any) {
        console.error("❌ Attempt API error:", error);
        console.error("Response data:", error.response?.data);
        console.error("Status:", error.response?.status);
        console.error("Headers:", error.response?.headers);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("🎉 Attempt success, updating cache:", data);

      queryClient.setQueryData<EmotionLabState>(STATE_KEY, (prev) => {
        console.log("📦 Previous state:", prev);

        const discovered = new Set(prev?.discoveredDyads ?? []);
        const isNew = !discovered.has(data.dyad.key);

        if (isNew) {
          discovered.add(data.dyad.key);
          console.log("✨ New discovery:", data.dyad.key);
        }

        const newState = prev
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

        console.log("📦 New state:", newState);
        return newState;
      });

      queryClient.invalidateQueries({ queryKey: STATE_KEY });
      console.log("🔄 Cache invalidated");
    },
    onError: (err: unknown) => {
      console.error("💥 Mutation onError:", err);

      // Детальное логирование ошибки
      if (err && typeof err === "object" && "response" in err) {
        const error = err as any;
        console.error("📋 Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }

      reportAttemptError(err);
      toast.error(t("emotionLab.attemptError"));
    },
  });
}
