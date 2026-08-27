import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { BellRing } from 'lucide-react';
import { usePreferences } from '../../hooks/useOnboarding';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { api, type UserPreference } from '../../lib/api';
import { cn } from '../../lib/utils';
import { ToggleSwitch } from '../../components/ui/toggle-switch';

const TIMES = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

const SLOTS = [
  {
    key: 'morning',
    labelKey: 'settings.slotMorning',
    enabledField: 'dailyReminder' as const,
    timeField: 'reminderTime' as const,
    modeField: 'reminderMode' as const,
    windowStartField: 'reminderWindowStart' as const,
    windowEndField: 'reminderWindowEnd' as const,
    defaultTime: '09:00',
    defaultWindowStart: '09:00',
    defaultWindowEnd: '12:00',
  },
  {
    key: 'day',
    labelKey: 'settings.slotDay',
    enabledField: 'afternoonReminder' as const,
    timeField: 'afternoonTime' as const,
    modeField: 'afternoonMode' as const,
    windowStartField: 'afternoonWindowStart' as const,
    windowEndField: 'afternoonWindowEnd' as const,
    defaultTime: '14:00',
    defaultWindowStart: '14:00',
    defaultWindowEnd: '17:00',
  },
  {
    key: 'evening',
    labelKey: 'settings.slotEvening',
    enabledField: 'eveningReminder' as const,
    timeField: 'eveningTime' as const,
    modeField: 'eveningMode' as const,
    windowStartField: 'eveningWindowStart' as const,
    windowEndField: 'eveningWindowEnd' as const,
    defaultTime: '20:00',
    defaultWindowStart: '20:00',
    defaultWindowEnd: '23:00',
  },
] as const;

type SlotConfig = (typeof SLOTS)[number];

const DEFAULT_PREFS = {
  dailyReminder: false,
  reminderTime: '09:00',
  reminderMode: 'exact',
  reminderWindowStart: '09:00',
  reminderWindowEnd: '12:00',
  afternoonReminder: false,
  afternoonTime: '14:00',
  afternoonMode: 'exact',
  afternoonWindowStart: '14:00',
  afternoonWindowEnd: '17:00',
  eveningReminder: false,
  eveningTime: '20:00',
  eveningMode: 'exact',
  eveningWindowStart: '20:00',
  eveningWindowEnd: '23:00',
} as const;

function TimeSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 min-w-[88px] rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {TIMES.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </label>
  );
}

function SlotRow({
  slot,
  enabled,
  time,
  mode,
  windowStart,
  windowEnd,
  saving,
  onToggle,
  onTime,
  onMode,
  onWindowStart,
  onWindowEnd,
}: {
  slot: SlotConfig;
  enabled: boolean;
  time?: string;
  mode: string;
  windowStart?: string;
  windowEnd?: string;
  saving: boolean;
  onToggle: (next: boolean) => void;
  onTime: (next: string) => void;
  onMode: (next: 'exact' | 'window') => void;
  onWindowStart: (next: string) => void;
  onWindowEnd: (next: string) => void;
}) {
  const { t } = useTranslation();
  const isWindow = mode === 'window';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{t(slot.labelKey)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('settings.remindersSwitchDesc')}
          </p>
        </div>
        <ToggleSwitch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={t(slot.labelKey)}
          disabled={saving}
        />
      </div>

      {enabled && (
        <div className="space-y-2 pl-1">
          <div
            role="radiogroup"
            aria-label={t('settings.remindersTimeLabel')}
            className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!isWindow}
              disabled={saving}
              onClick={() => onMode('exact')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed',
                !isWindow ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('settings.remindersModeExact')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isWindow}
              disabled={saving}
              onClick={() => onMode('window')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed',
                isWindow ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('settings.remindersModeWindow')}
            </button>
          </div>

          {!isWindow && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{t('settings.remindersTimeLabel')}</p>
              <TimeSelect
                value={time ?? slot.defaultTime}
                onChange={onTime}
                disabled={saving}
                label={t('settings.remindersTimeLabel')}
              />
            </div>
          )}

          {isWindow && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{t('settings.remindersWindowFrom')}</p>
                <TimeSelect
                  value={windowStart ?? slot.defaultWindowStart}
                  onChange={onWindowStart}
                  disabled={saving}
                  label={t('settings.remindersWindowFrom')}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{t('settings.remindersWindowTo')}</p>
                <TimeSelect
                  value={windowEnd ?? slot.defaultWindowEnd}
                  onChange={onWindowEnd}
                  disabled={saving}
                  label={t('settings.remindersWindowTo')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.remindersModeWindowHint')}
              </p>
            </div>
          )}
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
  const [error, setError] = useState('');

  const current = prefs ?? DEFAULT_PREFS;
  const pushActive = permission === 'granted' && subscribed;
  const anyEnabled = current.dailyReminder || current.afternoonReminder || current.eveningReminder;

  const save = async (patch: Partial<UserPreference>) => {
    setSaving(true);
    setError('');
    try {
      await api.users.savePreferences(patch);
      await queryClient.invalidateQueries({ queryKey: ['preferences'] });
    } catch {
      setError(t('settings.remindersSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const ensurePush = async (): Promise<boolean> => {
    if (pushActive) return true;
    const result = await subscribe();
    if (!result.ok) {
      setError(
        result.error === 'no-vapid'
          ? t('settings.pushNotConfigured')
          : t('settings.pushSubscribeFailed'),
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
        <p className="text-sm text-muted-foreground">{t('settings.remindersSlotsDesc')}</p>
      </div>

      {SLOTS.map((slot) => (
        <SlotRow
          key={slot.key}
          slot={slot}
          enabled={Boolean(current[slot.enabledField])}
          time={current[slot.timeField]}
          mode={current[slot.modeField] ?? 'exact'}
          windowStart={current[slot.windowStartField]}
          windowEnd={current[slot.windowEndField]}
          saving={saving}
          onToggle={(next) => toggleSlot(slot, next)}
          onTime={(next) => save({ [slot.timeField]: next })}
          onMode={(next) => save({ [slot.modeField]: next })}
          onWindowStart={(next) => save({ [slot.windowStartField]: next })}
          onWindowEnd={(next) => save({ [slot.windowEndField]: next })}
        />
      ))}

      <div
        className={cn(
          'rounded-xl p-3 flex items-center gap-3',
          pushActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-muted/60',
        )}
      >
        <BellRing aria-hidden="true" className="w-4 h-4 shrink-0" />
        {pushActive ? (
          <div className="flex-1">
            <p className="text-sm font-medium">{t('settings.pushAllowed')}</p>
            <p className="text-xs opacity-80">{t('settings.pushAllowedDesc')}</p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-sm font-medium">
              {permission === 'denied' ? t('settings.pushDenied') : t('settings.pushEnable')}
            </p>
            <p className="text-xs opacity-80">
              {permission === 'denied'
                ? t('settings.pushDeniedDesc')
                : t('settings.pushEnableDesc')}
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
            {t('settings.pushDisable')}
          </button>
        ) : (
          permission !== 'denied' &&
          !anyEnabled && (
            <button
              type="button"
              onClick={async () => {
                const result = await subscribe();
                if (!result.ok) {
                  setError(
                    result.error === 'no-vapid'
                      ? t('settings.pushNotConfigured')
                      : t('settings.pushSubscribeFailed'),
                  );
                }
              }}
              disabled={subscribing}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {subscribing ? '…' : t('settings.pushAllow')}
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
