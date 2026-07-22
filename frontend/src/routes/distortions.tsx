import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { DISTORTION_KEYS } from "../lib/distortionsQuiz";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import DistortionQuiz from "../components/DistortionQuiz";
import { useParameters } from "../hooks/useParameters";
import { useCreateEntry } from "../hooks/useEntries";

const TABS = [
  { key: "library", labelKey: "distortions.tabLibrary" },
  { key: "quiz", labelKey: "distortions.tabQuiz" },
] as const;

export default function DistortionsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("library");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data: params } = useParameters();
  const quizParam = useMemo(() => params?.find((p) => p.name === "Distortion Quiz"), [params]);
  const createEntry = useCreateEntry();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">{t("distortions.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("distortions.subtitle")}</p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1 bg-card rounded-xl shadow-neumorphic-sm p-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              aria-pressed={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                tab === item.key
                  ? "bg-primary text-primary-foreground shadow-neumorphic-sm"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {tab === "library" ? (
        <div className="space-y-3">
          {DISTORTION_KEYS.map((key) => (
            <Card key={key} className="shadow-neumorphic">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t(`cognitiveDistortions.${key}`)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{t(`distortionsLibrary.${key}.definition`)}</p>

                <button
                  aria-expanded={!!expanded[key]}
                  className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                >
                  <ChevronRight className={`w-4 h-4 ${expanded[key] ? "rotate-90" : ""}`} />
                  {expanded[key] ? t("distortions.hideExample") : t("distortions.showExample")}
                </button>

                {expanded[key] && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("distortions.exampleThought")}</p>
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
      ) : (
        <DistortionQuiz parameterId={quizParam?.id} createEntry={createEntry} />
      )}
    </div>
  );
}
