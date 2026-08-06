import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { usePreferences } from "../../hooks/useOnboarding";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { api, type UserPreference } from "../../lib/api";
import { cn } from "../../lib/utils";

const TIMES = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

const SLOTS = [
  {
    key: "morning",
    labelKey: "settings.slotMorning",
    enabledField: "dailyReminder" as const,
    timeField: "reminderTime" as const,
    defaultTime: "09:00",
  },
  {
    key: "day",
    labelKey: "settings.slotDay",
    enabledField: "afternoonReminder" as const,
    timeField: "afternoonTime" as const,
    defaultTime: "14:00",
  },
  {
    key: "evening",
    labelKey: "settings.slotEvening",
    enabledField: "eveningReminder" as const,
    timeField: "eveningTime" as const,
    defaultTime: "20:00",
  },
] as const;

type SlotConfig = (typeof SLOTS)[number];

const DEFAULT_PREFS = {
  dailyReminder: false,
  reminderTime: "09:00",
  afternoonReminder: false,
  afternoonTime: "14:00",
  eveningReminder: false,
  eveningTime: "20:00",
} as const;

function SlotRow({
  slot,
  enabled,
  time,
  saving,
  onToggle,
  onTime,
}: {
  slot: SlotConfig;
  enabled: boolean;
  time?: string;
  saving: boolean;
  onToggle: (next: boolean) => void;
  onTime: (next: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t(slot.labelKey)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("settings.remindersSwitchDesc")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t(slot.labelKey)}
          onClick={() => onToggle(!enabled)}
          disabled={saving}
          className={cn(
            "relative h-7 w-12 rounded-full transition-colors duration-200 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
            enabled ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 h-5 w-5 rounded-full bg-background shadow-neumorphic-sm transition-transform duration-200",
              enabled && "translate-x-5",
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="flex items-center justify-between gap-4 pl-1">
          <p className="text-sm font-medium">{t("settings.remindersTimeLabel")}</p>
          <label className="relative">
            <span className="sr-only">{t("settings.remindersTimeLabel")}</span>
            <select
              value={time ?? slot.defaultTime}
              onChange={(e) => onTime(e.target.value)}
              disabled={saving}
              className="h-9 min-w-[88px] rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

export function RemindersCard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: prefs, isLoading } = usePreferences();
  const { permission, subscribed, subscribing, subscribe, unsubscribe } = usePushNotifications();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = prefs ?? DEFAULT_PREFS;
  const pushActive = permission === "granted" && subscribed;
  const anyEnabled = current.dailyReminder || current.afternoonReminder || current.eveningReminder;

  const save = async (patch: Partial<UserPreference>) => {
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

  const ensurePush = async (): Promise<boolean> => {
    if (pushActive) return true;
    const result = await subscribe();
    if (!result.ok) {
      setError(
        result.error === "no-vapid"
          ? t("settings.pushNotConfigured")
          : t("settings.pushSubscribeFailed"),
      );
      return false;
    }
    return true;
  };

  const toggleSlot = async (slot: SlotConfig, next: boolean) => {
    if (next) {
      const ok = await ensurePush();
      if (!ok) return;
      await save({ [slot.enabledField]: true });
      return;
    }
    const othersEnabled = SLOTS.some(
      (s) => s.enabledField !== slot.enabledField && current[s.enabledField],
    );
    if (!othersEnabled) {
      await unsubscribe();
    }
    await save({ [slot.enabledField]: false });
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
    await save({ dailyReminder: false, afternoonReminder: false, eveningReminder: false });
  };

  if (isLoading) {
    return <div className="h-40 rounded-xl bg-muted/40 animate-pulse" aria-hidden="true" />;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-muted/50 p-3 flex items-center gap-3">
        <BellRing aria-hidden="true" className="w-4 h-4 shrink-0" />
        <p className="text-sm text-muted-foreground">{t("settings.remindersSlotsDesc")}</p>
      </div>

      {SLOTS.map((slot) => (
        <SlotRow
          key={slot.key}
          slot={slot}
          enabled={Boolean(current[slot.enabledField])}
          time={current[slot.timeField]}
          saving={saving}
          onToggle={(next) => toggleSlot(slot, next)}
          onTime={(next) => save({ [slot.timeField]: next })}
        />
      ))}

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
          permission !== "denied" &&
          !anyEnabled && (
            <button
              type="button"
              onClick={async () => {
                const result = await subscribe();
                if (!result.ok) {
                  setError(
                    result.error === "no-vapid"
                      ? t("settings.pushNotConfigured")
                      : t("settings.pushSubscribeFailed"),
                  );
                }
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
