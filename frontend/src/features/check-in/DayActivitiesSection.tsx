import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Plus, Search } from "lucide-react";
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

  useEffect(() => {
    if (existing?.activities?.length) {
      setSelected((prev) => (prev.length === 0 ? (existing.activities ?? []) : prev));
    }
  }, [existing]);

  const selectedKeys = useMemo(
    () => new Set(selected.filter((s) => !s.custom).map((s) => s.key)),
    [selected],
  );

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ACTIVITY_CATALOG.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      const label = t(a.labelKey).toLowerCase();
      return label.includes(q);
    });
  }, [category, query, t]);

  const toggle = (key: string) => {
    setSaved(false);
    setSelected((prev) => {
      if (selectedKeys.has(key)) return prev.filter((s) => s.key !== key);
      return [...prev, { key }];
    });
  };

  const addCustom = () => {
    const text = customText.trim();
    if (!text) return;
    setSaved(false);
    setSelected((prev) => [
      ...prev,
      { key: `custom:${Date.now().toString(36)}`, custom: true, label: text },
    ]);
    setCustomText("");
  };

  const customExists = (text: string) =>
    selected.some((s) => s.custom && s.label?.toLowerCase() === text.toLowerCase());

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
            <Chip
              key={a.key}
              variant={active ? "active" : "outline"}
              onClick={() => toggle(a.key)}
            >
              {active && <Check aria-hidden="true" className="mr-1" />}
              {t(a.labelKey)}
            </Chip>
          );
        })}
        {selected
          .filter((s) => s.custom)
          .map((s) => (
            <Chip key={s.key} variant="active" onClick={() => toggle(s.key)}>
              <Check aria-hidden="true" className="mr-1" />
              {s.label}
            </Chip>
          ))}
      </div>

      {query && filteredCatalog.length === 0 && (
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
