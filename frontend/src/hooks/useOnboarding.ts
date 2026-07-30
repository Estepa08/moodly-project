import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type UserPreference } from "../lib/api";
import { ONBOARDING_DONE_KEY } from "../lib/constants";
import { usePushNotifications } from "./usePushNotifications";

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => api.users.getPreferences(),
    staleTime: 60_000,
  });
}

export function useSavePreferences() {
  return useMutation({
    mutationFn: (data: Partial<UserPreference>) => api.users.savePreferences(data),
  });
}

export function useOnboarding() {
  const { data: prefs, isLoading } = usePreferences();
  const savePrefs = useSavePreferences();
  const push = usePushNotifications();
  const [saving, setSaving] = useState(false);

  const localDone = localStorage.getItem(ONBOARDING_DONE_KEY) === "true";

  const needsOnboarding = !isLoading && !localDone && !prefs?.onboardingDone;

  const complete = useCallback(
    async (data: Partial<UserPreference>) => {
      setSaving(true);
      try {
        await savePrefs.mutateAsync({ ...data, onboardingDone: true });
        localStorage.setItem(ONBOARDING_DONE_KEY, "true");
        if (data.dailyReminder) {
          push.subscribe();
        }
      } finally {
        setSaving(false);
      }
    },
    [savePrefs, push],
  );

  return {
    needsOnboarding,
    isLoading: isLoading || saving,
    preferences: prefs,
    complete,
  };
}
