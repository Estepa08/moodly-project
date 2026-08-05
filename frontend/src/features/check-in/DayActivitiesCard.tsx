import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange, Pencil, Plus } from "lucide-react";
import { useParameters } from "../../hooks/useParameters";
import { useEntries } from "../../hooks/useEntries";
import { ParameterName } from "../../lib/constants";
import { ACTIVITY_CATALOG, ACTIVITY_ICONS } from "../../lib/dayActivities";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ModalShell } from "../../components/ui/modal-shell";
import { ComponentSize } from "../../lib/constants";
import DayActivitiesSection from "./DayActivitiesSection";

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function DayActivitiesCard() {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const [open, setOpen] = useState(false);

  const paramId = useMemo(
    () => params?.find((p) => p.name === ParameterName.DayActivities)?.id,
    [params],
  );

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
  }, []);

  const { data: todayEntries } = useEntries(paramId ? todayRange : undefined);

  const activities = useMemo(() => {
    if (!paramId || !todayEntries) return [];
    const entry = todayEntries.find((e) => e.parameterId === paramId && isToday(e.createdAt));
    return entry?.activities ?? [];
  }, [paramId, todayEntries]);

  const labelFor = (key: string) => {
    if (key.startsWith("custom:")) {
      const custom = activities.find((a) => a.key === key);
      return custom?.label ? (`${custom.label}` as string) : key;
    }
    const def = ACTIVITY_CATALOG.find((a) => a.key === key);
    return def ? t(def.labelKey) : key;
  };

  if (!paramId) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange aria-hidden="true" className="w-4 h-4 text-accent" />
            {t("dayActivities.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dayActivities.empty")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activities.map((a) => {
                const Icon = ACTIVITY_ICONS[a.key];
                return (
                  <span
                    key={a.key}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
                  >
                    {Icon ? <Icon aria-hidden="true" className="w-3.5 h-3.5" /> : null}
                    {labelFor(a.key)}
                  </span>
                );
              })}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
            {activities.length === 0 ? (
              <Plus aria-hidden="true" className="mr-1 h-4 w-4" />
            ) : (
              <Pencil aria-hidden="true" className="mr-1 h-4 w-4" />
            )}
            {activities.length === 0 ? t("dayActivities.addCustom") : t("dayActivities.edit")}
          </Button>
        </CardContent>
      </Card>

      <ModalShell
        open={open}
        onOpenChange={setOpen}
        icon={CalendarRange}
        iconSize={ComponentSize.Md}
        iconBg="bg-accent/10"
        iconColor="text-accent"
        title={t("dayActivities.sectionHeading")}
        description={t("dayActivities.subtitle")}
      >
        <DayActivitiesSection />
      </ModalShell>
    </>
  );
}
