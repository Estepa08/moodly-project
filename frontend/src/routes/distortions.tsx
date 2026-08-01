import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { DISTORTION_KEYS } from "../lib/distortionsQuiz";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { DistortionQuiz } from "../features/mood-entry";
import { ThoughtRelease } from "../features/journal";
import { Button } from "../components/ui/button";
import { useParameters } from "../hooks/useParameters";
import { useCreateEntry } from "../hooks/useEntries";
import { useRewardPractice, PracticeSource } from "../features/gamification";
import { SegmentControl, SegmentControlItem } from "../components/ui/segment-control";

const TABS = [
  { key: "library", labelKey: "distortions.tabLibrary" },
  { key: "quiz", labelKey: "distortions.tabQuiz" },
  { key: "letGo", labelKey: "distortions.tabLetGo" },
] as const;

export default function DistortionsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("library");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data: params } = useParameters();
  const quizParam = useMemo(() => params?.find((p) => p.name === "Distortion Quiz"), [params]);
  const thoughtReleaseParam = useMemo(
    () => params?.find((p) => p.name === "Thought Release"),
    [params],
  );
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateEntry(() => {
    rewardPractice.mutate(PracticeSource.Distortions);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("distortions.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("distortions.subtitle")}</p>
      </div>

      <div className="flex justify-center">
        <SegmentControl
          role="tablist"
          aria-label={t("distortions.title")}
          onKeyDown={(e) => {
            const idx = TABS.findIndex((t) => t.key === tab);
            if (e.key === "ArrowLeft" && idx > 0) setTab(TABS[idx - 1].key);
            if (e.key === "ArrowRight" && idx < TABS.length - 1) setTab(TABS[idx + 1].key);
          }}
        >
          {TABS.map((item) => (
            <SegmentControlItem
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              aria-controls={`distortion-panel-${item.key}`}
              active={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {t(item.labelKey)}
            </SegmentControlItem>
          ))}
        </SegmentControl>
      </div>

      <div
        role="tabpanel"
        id="distortion-panel-library"
        aria-labelledby="distortion-tab-library"
        hidden={tab !== "library"}
      >
        {tab === "library" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DISTORTION_KEYS.map((key, index) => (
              <Card
                key={key}
                className={`shadow-neumorphic border-t-2 transition-[transform,box-shadow,border-color] duration-200 animate-card-enter hover:-translate-y-0.5 hover:shadow-elevation-3 ${
                  expanded[key] ? "border-primary/60" : "border-primary/20"
                }`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <CardHeader className="pb-2 p-4">
                  <CardTitle className="text-sm">{t(`cognitiveDistortions.${key}`)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  <p
                    className={`text-sm text-muted-foreground ${expanded[key] ? "" : "line-clamp-3"}`}
                  >
                    {t(`distortionsLibrary.${key}.definition`)}
                  </p>

                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0 gap-1"
                    aria-expanded={!!expanded[key]}
                    onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                  >
                    <ChevronRight
                      aria-hidden="true"
                      className={`transition-transform duration-150 ${expanded[key] ? "rotate-90" : ""}`}
                    />
                    {expanded[key] ? t("distortions.hideExample") : t("distortions.showExample")}
                  </Button>

                  {expanded[key] && (
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t("distortions.exampleThought")}
                        </p>
                        <p className="text-foreground">{t(`distortionsLibrary.${key}.example`)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("distortions.reframe")}</p>
                        <p className="text-foreground">{t(`distortionsLibrary.${key}.reframe`)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
      <div
        role="tabpanel"
        id="distortion-panel-quiz"
        aria-labelledby="distortion-tab-quiz"
        hidden={tab !== "quiz"}
      >
        {tab === "quiz" ? (
          <div className="space-y-4">
            <DistortionQuiz parameterId={quizParam?.id} createEntry={createEntry} />
          </div>
        ) : null}
      </div>
      <div
        role="tabpanel"
        id="distortion-panel-letGo"
        aria-labelledby="distortion-tab-letGo"
        hidden={tab !== "letGo"}
      >
        {tab === "letGo" ? (
          <ThoughtRelease parameterId={thoughtReleaseParam?.id} createEntry={createEntry} />
        ) : null}
      </div>
    </div>
  );
}
