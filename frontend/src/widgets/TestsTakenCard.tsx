import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { useTestResults, useTests } from "../hooks/useTests";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LoadingCard } from "../components/ui/loading-card";
import EmptyState from "../components/ui/empty-state";
import type { components } from "../lib/api-types";

type TestResult = components["schemas"]["TestResult"];

export default function TestsTakenCard() {
  const { t } = useTranslation();
  const { data: results, isLoading } = useTestResults();
  const { data: tests } = useTests();

  const titleMap = useMemo(() => {
    const map = new Map<string, string>();
    if (tests) {
      for (const test of tests) map.set(test.id, test.title);
    }
    return map;
  }, [tests]);

  const latestByTest = useMemo(() => {
    if (!results) return [];
    const byTest = new Map<string, TestResult>();
    for (const r of results) {
      const prev = byTest.get(r.testId);
      if (!prev || new Date(r.completedAt).getTime() > new Date(prev.completedAt).getTime()) {
        byTest.set(r.testId, r);
      }
    }
    return Array.from(byTest.values()).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
  }, [results]);

  if (isLoading) {
    return <LoadingCard className="border-0 shadow-none" />;
  }

  if (latestByTest.length === 0) {
    return (
      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="w-4 h-4 text-primary" />
            {t("dashboard.testsTaken")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={ClipboardList} title={t("dashboard.noTestData")} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList aria-hidden="true" className="w-4 h-4 text-primary" />
          {t("dashboard.testsTaken")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {latestByTest.map((r) => (
            <div
              key={r.testId}
              className="flex items-center justify-between rounded-xl bg-muted/50 p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {titleMap.get(r.testId) ?? r.testId}
                </p>
                <p className="text-[11px] text-muted-foreground">{r.interpretation}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums ml-2">{r.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
