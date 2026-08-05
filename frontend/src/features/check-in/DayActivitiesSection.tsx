import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Plus, Search, X } from "lucide-react";
import { Chip } from "../../components/ui/chip";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useParameters } from "../../hooks/useParameters";
import { useEntries, useCreateEntry } from "../../hooks/useEntries";
import { ParameterName } from "../../lib/constants";
import {
  ACTIVITY_CATALOG,
  ACTIVITY_CATEGORY_ORDER,
  DEFAULT_ACTIVITY_CATEGORY,
  type ActivityCategory,
} from "../../lib/dayActivities";
import {
  loadMyActivities,
  createMyActivity,
  removeMyActivity,
  type MyActivity,
} from "../../lib/myActivities";
import type { ActivitySelection } from "../../lib/crypto/records";

const DAY_ACTIVITIES_NAME = ParameterName.DayActivities;

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function DayActivitiesSection() {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const createEntry = useCreateEntry();

  const paramId = useMemo(() => params?.find((p) => p.name === DAY_ACTIVITIES_NAME)?.id, [params]);

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
  }, []);

  const { data: todayEntries } = useEntries(paramId ? todayRange : undefined);

  const existing = useMemo(() => {
    if (!paramId || !todayEntries) return undefined;
    return todayEntries.find((e) => e.parameterId === paramId && isToday(e.createdAt));
  }, [paramId, todayEntries]);

  const [selected, setSelected] = useState<ActivitySelection[]>([]);
  const [category, setCategory] = useState<ActivityCategory | "all">(DEFAULT_ACTIVITY_CATEGORY);
  const [query, setQuery] = useState("");
  const [customText, setCustomText] = useState("");
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

  const filteredCustom = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCustom;
    return allCustom.filter((s) => s.label?.toLowerCase().includes(q));
  }, [allCustom, query]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ACTIVITY_CATALOG.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      const label = t(a.labelKey).toLowerCase();
      return label.includes(q);
    });
  }, [category, query, t]);

  const toggle = (item: { key: string; custom?: boolean; label?: string }) => {
    setSaved(false);
    setSelected((prev) => {
      if (prev.some((s) => s.key === item.key)) return prev.filter((s) => s.key !== item.key);
      return [...prev, item];
    });
  };

  const addCustom = () => {
    const text = customText.trim();
    if (!text) return;
    const item = createMyActivity(text);
    setMyActivities((prev) => [...prev, item]);
    setSaved(false);
    setSelected((prev) => [...prev, { key: item.key, custom: true, label: text }]);
    setCustomText("");
  };

  const customExists = (text: string) =>
    allCustom.some((s) => s.label?.toLowerCase() === text.toLowerCase());

  const removeFromCatalog = (key: string) => {
    removeMyActivity(key);
    setMyActivities(loadMyActivities());
    setSaved(false);
    setSelected((prev) => prev.filter((s) => s.key !== key));
  };

  const save = () => {
    if (!paramId) return;
    createEntry.mutate(
      { parameterId: paramId, value: 0, activities: selected },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success(t("dayActivities.saved"));
        },
      },
    );
  };

  if (!paramId) return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-foreground">{t("dayActivities.sectionHeading")}</h3>
        <p className="text-xs text-muted-foreground">{t("dayActivities.subtitle")}</p>
      </div>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <Input
          className="pl-9 h-10 text-sm"
          placeholder={t("dayActivities.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Chip
          variant={category === "all" ? "active" : "default"}
          onClick={() => setCategory("all")}
        >
          {t("dayActivities.title")}
        </Chip>
        {ACTIVITY_CATEGORY_ORDER.map((c) => (
          <Chip
            key={c}
            variant={category === c ? "active" : "default"}
            onClick={() => setCategory(c)}
          >
            {t(`dayActivities.categories.${c}`)}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
        {filteredCatalog.map((a) => {
          const active = selectedKeys.has(a.key);
          return (
            <Chip key={a.key} variant={active ? "active" : "outline"} onClick={() => toggle(a)}>
              {active && <Check aria-hidden="true" className="mr-1" />}
              {t(a.labelKey)}
            </Chip>
          );
        })}
        {filteredCustom.length > 0 && (
          <div className="w-full mt-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
              {t("dayActivities.myActivities")}
            </p>
            <div className="flex flex-wrap gap-2">
              {filteredCustom.map((s) => {
                const active = selectedCustomKeys.has(s.key);
                return (
                  <span key={s.key} className="inline-flex items-center gap-0.5">
                    <Chip
                      variant={active ? "active" : "outline"}
                      onClick={() => toggle({ key: s.key, custom: true, label: s.label })}
                    >
                      {active && <Check aria-hidden="true" className="mr-1" />}
                      {s.label}
                    </Chip>
                    <button
                      type="button"
                      onClick={() => removeFromCatalog(s.key)}
                      aria-label={t("dayActivities.removeFromCatalog")}
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X aria-hidden="true" className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {query && filteredCatalog.length === 0 && filteredCustom.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("dayActivities.empty")}</p>
      )}

      <div className="flex items-center gap-2">
        <Input
          className="h-10 text-sm flex-1"
          placeholder={t("dayActivities.customPlaceholder")}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addCustom();
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
          {t("dayActivities.addCustom")}
        </Button>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-medium text-muted-foreground">
          {t("dayActivities.selectedCount", { count: selected.length })}
        </span>
        <Button type="button" onClick={save} disabled={createEntry.isPending}>
          {saved ? t("dayActivities.saved") : t("dayActivities.save")}
        </Button>
      </div>
    </div>
  );
}
