import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Spinner from "./ui/spinner";
import type { components } from "../lib/api-types";

type TestResult = components["schemas"]["TestResult"];

interface TestGroup {
  testId: string;
  label: string;
  results: TestResult[];
  lastSeverity: string;
  lastScore: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  minimal: "hsl(var(--accent))",
  mild: "hsl(var(--severity-mild))",
  moderate: "hsl(var(--severity-moderate))",
  severe: "hsl(var(--destructive))",
};

function getSeverity(score: number, interpretation: string): string {
  const lower = interpretation.toLowerCase();
  if (lower.includes("severe") || lower.includes("high")) return "severe";
  if (lower.includes("moderate") || lower.includes("mod")) return "moderate";
  if (lower.includes("mild")) return "mild";
  return "minimal";
}

interface TestTimelineProps {
  testTimeline: TestGroup[];
  loading: boolean;
}

export default function TestTimeline({ testTimeline, loading }: TestTimelineProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.testProgress")}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size={32} /></div>
        ) : testTimeline.length > 0 ? (
          <div className="space-y-4">
            {testTimeline.map((group) => {
              const severityColor = SEVERITY_COLORS[group.lastSeverity] ?? "hsl(var(--primary))";
              return (
                <div key={group.testId} className="flex items-center gap-3">
                  <div className="w-10 text-xs font-semibold text-muted-foreground shrink-0">
                    {group.label}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                    {group.results.map((r, idx) => {
                      const sev = getSeverity(r.score, r.interpretation);
                      const color = SEVERITY_COLORS[sev] ?? "hsl(var(--primary))";
                      return (
                        <div key={r.id} className="flex items-center gap-0">
                          <div
                            className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                              idx === group.results.length - 1
                                ? "shadow-neumorphic-sm scale-110"
                                : ""
                            }`}
                            style={{
                              backgroundColor: `${color}50`,
                              borderColor: color,
                            }}
                            title={`${r.score} — ${r.interpretation}`}
                          />
                          {idx < group.results.length - 1 && (
                            <div className="w-3 h-0.5 bg-border" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs font-medium shrink-0" style={{ color: severityColor }}>
                    {group.lastScore}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noTestData")}</p>
        )}
      </CardContent>
    </Card>
  );
}
