import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { usePreferences } from "../../hooks/useOnboarding";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";

const TIMES = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

export function RemindersCard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: prefs, isLoading } = usePreferences();
  const { permission, subscribing, subscribe, unsubscribe } = usePushNotifications();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pushActive = permission === "granted";

  const save = async (patch: Partial<{ dailyReminder: boolean; reminderTime: string }>) => {
    if (!prefs) return;
    setSaving(true);
    setError("");
    try {
      await api.users.savePreferences(patch);
      await queryClient.invalidateQueries({ queryKey: ["preferences"] });
    } catch {
      setError(t("settings.remindersSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggleReminder = async (next: boolean) => {
    await save({ dailyReminder: next });
    if (next && !pushActive) {
      await subscribe();
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
    await save({ dailyReminder: false });
  };

  if (isLoading || !prefs) {
    return <div className="h-40 rounded-xl bg-muted/40 animate-pulse" aria-hidden="true" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t("settings.remindersSwitchLabel")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("settings.remindersSwitchDesc")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.dailyReminder}
          aria-label={t("settings.remindersSwitchLabel")}
          onClick={() => toggleReminder(!prefs.dailyReminder)}
          disabled={saving}
          className={cn(
            "relative h-7 w-12 rounded-full transition-colors duration-200 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
            prefs.dailyReminder ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 h-5 w-5 rounded-full bg-background shadow-neumorphic-sm transition-transform duration-200",
              prefs.dailyReminder && "translate-x-5",
            )}
          />
        </button>
      </div>

      {prefs.dailyReminder && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">{t("settings.remindersTimeLabel")}</p>
          <label className="relative">
            <span className="sr-only">{t("settings.remindersTimeLabel")}</span>
            <select
              value={prefs.reminderTime ?? "20:00"}
              onChange={(e) => save({ reminderTime: e.target.value })}
              disabled={saving}
              className="h-9 min-w-[88px] rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {TIMES.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div
        className={cn(
          "rounded-xl p-3 flex items-center gap-3",
          pushActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted/60",
        )}
      >
        <BellRing aria-hidden="true" className="w-4 h-4 shrink-0" />
        {pushActive ? (
          <div className="flex-1">
            <p className="text-sm font-medium">{t("settings.pushAllowed")}</p>
            <p className="text-xs opacity-80">{t("settings.pushAllowedDesc")}</p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-sm font-medium">
              {permission === "denied" ? t("settings.pushDenied") : t("settings.pushEnable")}
            </p>
            <p className="text-xs opacity-80">
              {permission === "denied"
                ? t("settings.pushDeniedDesc")
                : t("settings.pushEnableDesc")}
            </p>
          </div>
        )}
        {pushActive ? (
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={saving || subscribing}
            className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80 disabled:opacity-50 cursor-pointer"
          >
            {t("settings.pushDisable")}
          </button>
        ) : (
          permission !== "denied" && (
            <button
              type="button"
              onClick={() => {
                void subscribe();
              }}
              disabled={subscribing}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {subscribing ? "…" : t("settings.pushAllow")}
            </button>
          )
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
