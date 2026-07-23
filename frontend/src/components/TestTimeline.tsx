import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Spinner from "./ui/spinner";
import type { components } from "../lib/api-types";

type TestResult = components["schemas"]["TestResult"];

interface TestGroup {
  testId: string;
  label: string;
  results: TestResult[];
  lastScore: number;
}

interface TestTimelineProps {
  testTimeline: TestGroup[];
  isLoading: boolean;
}

export default function TestTimeline({ testTimeline, isLoading }: TestTimelineProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.testProgress")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size={32} />
          </div>
        ) : testTimeline.length > 0 ? (
          <div className="space-y-4">
            {testTimeline.map((group) => (
              <div key={group.testId} className="flex items-center gap-3">
                <div className="w-10 text-xs font-semibold text-muted-foreground shrink-0">
                  {group.label}
                </div>
                <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                  {group.results.map((r, idx) => (
                    <div key={r.id} className="flex items-center gap-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 border-primary/40 transition-all duration-150 ${
                          idx === group.results.length - 1
                            ? "bg-primary shadow-neumorphic-sm scale-110 border-primary"
                            : "bg-primary/20"
                        }`}
                        title={r.interpretation}
                      />
                      {idx < group.results.length - 1 && <div className="w-3 h-0.5 bg-border" />}
                    </div>
                  ))}
                </div>
                <div className="text-xs font-medium text-muted-foreground shrink-0">
                  {group.lastScore}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("dashboard.noTestData")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
