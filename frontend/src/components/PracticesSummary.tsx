import { useTranslation } from "react-i18next";
import { Wind, Heart, Moon, Brain } from "lucide-react";
import type { components } from "../lib/api-types";
import { SLEEP_HYGIENE_ITEMS } from "../lib/sleepHygiene";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Entry = components["schemas"]["Entry"];

interface PracticesSummaryProps {
  gratitudeEntries: Entry[];
  hygieneEntries: Entry[];
  distortionEntries: Entry[];
  breathingSessionCount: number | undefined;
  isLoading: boolean;
}

export default function PracticesSummary({
  gratitudeEntries,
  hygieneEntries,
  distortionEntries,
  breathingSessionCount,
  isLoading,
}: PracticesSummaryProps) {
  const { t } = useTranslation();

  const latestHygiene = [...hygieneEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  const latestDistortion = [...distortionEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  const items = [
    {
      key: "breathing",
      icon: Wind,
      label: t("dashboard.practicesBreathing"),
      value:
        breathingSessionCount === undefined
          ? "—"
          : t("dashboard.practicesSessionsCount", { count: breathingSessionCount }),
    },
    {
      key: "gratitude",
      icon: Heart,
      label: t("dashboard.practicesGratitude"),
      value: t("dashboard.practicesEntriesCount", { count: gratitudeEntries.length }),
    },
    {
      key: "sleepHygiene",
      icon: Moon,
      label: t("dashboard.practicesSleepHygiene"),
      value: latestHygiene ? `${latestHygiene.value}/${SLEEP_HYGIENE_ITEMS.length}` : "—",
    },
    {
      key: "distortionQuiz",
      icon: Brain,
      label: t("dashboard.practicesDistortionQuiz"),
      value: latestDistortion?.note ?? "—",
    },
  ];

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.practicesSummary")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t("dashboard.practicesLoading")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(({ key, icon: Icon, label, value }) => (
              <div key={key} className="rounded-xl bg-muted/50 p-3 flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
