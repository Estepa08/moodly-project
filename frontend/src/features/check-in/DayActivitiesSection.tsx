import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, ChevronLeft, History, Plus, Search, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useParameters } from '../../hooks/useParameters';
import { useEntries, useCreateEntry } from '../../hooks/useEntries';
import { ParameterName } from '../../lib/constants';
import {
  ACTIVITY_CATALOG,
  ACTIVITY_CATEGORY_ORDER,
  ACTIVITY_ICONS,
  CATEGORY_ICONS,
  isCoreActivity,
  type ActivityCategory,
} from '../../lib/dayActivities';
import {
  loadMyActivities,
  createMyActivity,
  removeMyActivity,
  type MyActivity,
} from '../../lib/myActivities';
import { latestDayActivities, pickFrequent } from '../../lib/activityHistory';
import type { ActivitySelection } from '../../lib/crypto/records';

const DAY_ACTIVITIES_NAME = ParameterName.DayActivities;
const HISTORY_DAYS = 30;

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function range(days: number) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { from: start.toISOString(), to: new Date(end.getTime() + 86_400_000).toISOString() };
}

type View = { step: 'home' } | { step: 'category'; category: ActivityCategory } | { step: 'mine' };

interface DayActivitiesSectionProps {
  onClose?: () => void;
}

export default function DayActivitiesSection({ onClose }: DayActivitiesSectionProps) {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const createEntry = useCreateEntry();

  const paramId = useMemo(() => params?.find((p) => p.name === DAY_ACTIVITIES_NAME)?.id, [params]);

  const todayRange = useMemo(() => range(1), []);
  const historyRange = useMemo(() => range(HISTORY_DAYS), []);

  const { data: todayEntries } = useEntries(paramId ? todayRange : undefined);
  const { data: historyEntries } = useEntries(paramId ? historyRange : undefined);

  const existing = useMemo(() => {
    if (!paramId || !todayEntries) return undefined;
    return todayEntries.find((e) => e.parameterId === paramId && isToday(e.createdAt));
  }, [paramId, todayEntries]);

  const historyData = useMemo(() => historyEntries ?? [], [historyEntries]);

  const frequent = useMemo(() => pickFrequent(historyData, 6), [historyData]);
  const yesterday = useMemo(() => latestDayActivities(historyData), [historyData]);

  const [selected, setSelected] = useState<ActivitySelection[]>([]);
  const [view, setView] = useState<View>({ step: 'home' });
  const [query, setQuery] = useState('');
  const [customText, setCustomText] = useState('');
  const [saved, setSaved] = useState(false);
  const [myActivities, setMyActivities] = useState<MyActivity[]>(() => loadMyActivities());

  useEffect(() => {
    if (existing?.activities?.length) {
      setSelected((prev) => (prev.length === 0 ? (existing.activities ?? []) : prev));
    }
  }, [existing]);

  const selectedKeys = useMemo(
    () => new Set(selected.filter((s) => !s.custom).map((s) => s.key)),
    [selected],
  );

  const selectedCustomKeys = useMemo(
    () => new Set(selected.filter((s) => s.custom).map((s) => s.key)),
    [selected],
  );

  const allCustom = useMemo(() => {
    const map = new Map<string, ActivitySelection>();
    for (const m of myActivities) map.set(m.key, { key: m.key, custom: true, label: m.label });
    for (const s of selected) {
      if (s.custom) map.set(s.key, s);
    }
    return Array.from(map.values());
  }, [myActivities, selected]);

  const toggle = (item: { key: string; custom?: boolean; label?: string }) => {
    setSaved(false);
    setSelected((prev) => {
      if (prev.some((s) => s.key === item.key)) return prev.filter((s) => s.key !== item.key);
      return [...prev, item];
    });
  };

  const applyYesterday = () => {
    setSaved(false);
    setSelected((prev) => {
      const next = prev.filter((s) => !yesterday.some((y) => y.key === s.key));
      return [...next, ...yesterday.filter((y) => !next.some((s) => s.key === y.key))];
    });
  };

  const addCustom = () => {
    const text = customText.trim();
    if (!text) return;
    const item = createMyActivity(text);
    setMyActivities((prev) => [...prev, item]);
    setSaved(false);
    setSelected((prev) => [...prev, { key: item.key, custom: true, label: text }]);
    setCustomText('');
  };

  const customExists = (text: string) =>
    allCustom.some((s) => s.label?.toLowerCase() === text.toLowerCase());

  const save = () => {
    if (!paramId) return;
    createEntry.mutate(
      { parameterId: paramId, value: 0, activities: selected },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success(t('dayActivities.saved'));
          onClose?.();
        },
      },
    );
  };

  const addCustomFromCategory = () => {
    const text = customText.trim();
    if (!text) return;
    const item = createMyActivity(text);
    setMyActivities((prev) => [...prev, item]);
    setSaved(false);
    setSelected((prev) => [...prev, { key: item.key, custom: true, label: text }]);
    setCustomText('');
  };

  const filteredByCategory = useMemo(() => {
    if (view.step !== 'category') return [];
    const q = query.trim().toLowerCase();
    return ACTIVITY_CATALOG.filter((a) => {
      if (a.category !== view.category) return false;
      // Без поискового запроса показываем только куратированное «ядро»
      // категории (~18-20 пунктов) — чтобы не перегружать выбор (см.
      // isCoreActivity). Полный список остаётся доступен через поиск.
      if (!q) return isCoreActivity(a.key);
      return t(a.labelKey).toLowerCase().includes(q);
    });
  }, [view, query, t]);

  const goBack = () => {
    setView({ step: 'home' });
    setQuery('');
  };

  if (!paramId) return null;

  const showFrequent =
    view.step === 'home' && frequent.length > 0 && frequent.some((f) => !selectedKeys.has(f.key));
  const showYesterday =
    view.step === 'home' && yesterday.length > 0 && yesterday.some((y) => !selectedKeys.has(y.key));

  return (
    <div className="space-y-4">
      {view.step === 'home' && (
        <>
          {showYesterday && (
            <button
              type="button"
              onClick={applyYesterday}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/10 text-accent text-sm font-semibold transition-colors hover:bg-accent/15 active:scale-[0.99]"
            >
              <History aria-hidden="true" className="w-4 h-4" />
              {t('dayActivities.likeYesterday')}
            </button>
          )}

          {showFrequent && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground">
                {t('dayActivities.frequent')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {frequent
                  .filter((f) => !selectedKeys.has(f.key))
                  .slice(0, 4)
                  .map((f) => {
                    const Icon = ACTIVITY_ICONS[f.key];
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => toggle({ key: f.key, custom: f.custom, label: f.label })}
                        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-neumorphic-sm transition-colors hover:border-primary/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="grid place-items-center w-8 h-8 shrink-0 rounded-lg bg-accent/10 text-accent">
                          {Icon ? <Icon aria-hidden="true" className="w-4 h-4" /> : null}
                        </span>
                        <span className="truncate text-xs font-medium text-foreground">
                          {f.custom
                            ? f.label
                            : t(`dayActivities.activities.${f.key.replace('.', '_')}`)}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">
              {t('dayActivities.allActivities')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_CATEGORY_ORDER.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setView({ step: 'category', category: cat })}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-3 text-center shadow-neumorphic-sm transition-colors hover:border-primary/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-accent/10 text-accent">
                      {Icon ? <Icon aria-hidden="true" className="w-5 h-5" /> : null}
                    </span>
                    <span className="text-[11px] font-medium text-foreground leading-tight">
                      {t(`dayActivities.categories.${cat}`)}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setView({ step: 'mine' })}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-2 py-3 text-center shadow-neumorphic-sm transition-colors hover:border-primary/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid place-items-center w-9 h-9 rounded-full bg-muted text-muted-foreground">
                  <Plus aria-hidden="true" className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-foreground leading-tight">
                  {t('dayActivities.myActivities')}
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {view.step === 'category' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-neumorphic-sm transition-colors hover:border-primary/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft aria-hidden="true" className="w-4 h-4" />
            {t('dayActivities.back')}
          </button>

          <div className="flex items-center gap-2">
            <Input
              className="h-10 text-sm flex-1"
              placeholder={t('dayActivities.customPlaceholder')}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomFromCategory();
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCustomFromCategory}
              disabled={!customText.trim() || customExists(customText)}
            >
              <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
              {t('dayActivities.addCustom')}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-accent/10 text-accent">
              {(() => {
                const Icon = CATEGORY_ICONS[view.category];
                return Icon ? <Icon aria-hidden="true" className="w-5 h-5" /> : null;
              })()}
            </span>
            <h4 className="text-sm font-bold text-foreground">
              {t(`dayActivities.categories.${view.category}`)}
            </h4>
          </div>

          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
            <Input
              className="pl-9 h-10 text-sm"
              placeholder={t('dayActivities.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredByCategory.map((a) => {
              const active = selectedKeys.has(a.key);
              const Icon = ACTIVITY_ICONS[a.key] ?? CATEGORY_ICONS[a.category];
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => toggle(a)}
                  className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center shadow-neumorphic-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground hover:border-primary/50'
                  }`}
                >
                  {active && (
                    <span className="absolute top-1.5 right-1.5 grid place-items-center w-4 h-4 rounded-full bg-primary text-primary-foreground">
                      <Check aria-hidden="true" className="w-3 h-3" />
                    </span>
                  )}
                  <span
                    className={`grid place-items-center w-9 h-9 rounded-full ${
                      active ? 'bg-primary/15 text-primary' : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {Icon ? <Icon aria-hidden="true" className="w-5 h-5" /> : null}
                  </span>
                  <span className="text-[11px] font-medium leading-tight line-clamp-2">
                    {t(a.labelKey)}
                  </span>
                </button>
              );
            })}
            {filteredByCategory.length === 0 && (
              <p className="col-span-2 text-xs text-muted-foreground">{t('dayActivities.empty')}</p>
            )}
          </div>
        </div>
      )}

      {view.step === 'mine' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft aria-hidden="true" className="w-4 h-4" />
            {t('dayActivities.back')}
          </button>

          <div className="flex items-center gap-2">
            <Input
              className="h-10 text-sm flex-1"
              placeholder={t('dayActivities.customPlaceholder')}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustom();
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addCustom}
              disabled={!customText.trim() || customExists(customText)}
            >
              <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
              {t('dayActivities.addCustom')}
            </Button>
          </div>

          {allCustom.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('dayActivities.empty')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {allCustom.map((s) => {
                const active = selectedCustomKeys.has(s.key);
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 shadow-neumorphic-sm ${
                      active ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle({ key: s.key, custom: true, label: s.label })}
                      className="flex items-center gap-2 flex-1 min-w-0 py-1 text-left active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {active && <Check aria-hidden="true" className="w-3.5 h-3.5 text-primary" />}
                      <span className="truncate text-xs font-medium text-foreground">
                        {s.label}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeMyActivity(s.key);
                        setMyActivities(loadMyActivities());
                        setSaved(false);
                        setSelected((prev) => prev.filter((x) => x.key !== s.key));
                      }}
                      aria-label={t('dayActivities.removeFromCatalog')}
                      className="grid place-items-center w-6 h-6 shrink-0 rounded-full text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X aria-hidden="true" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-medium text-muted-foreground">
          {t('dayActivities.selectedCount', { count: selected.length })}
        </span>
        {view.step === 'category' ? (
          <Button
            type="button"
            variant="secondary"
            onClick={goBack}
            disabled={createEntry.isPending}
          >
            <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
            {t('dayActivities.addCustom')}
          </Button>
        ) : (
          <Button type="button" onClick={save} disabled={createEntry.isPending}>
            {saved ? t('dayActivities.saved') : t('dayActivities.save')}
          </Button>
        )}
      </div>
    </div>
  );
}
