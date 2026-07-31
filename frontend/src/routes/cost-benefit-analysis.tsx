import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Scale } from "lucide-react";
import {
  useCbaExamples,
  useCbaCommonItems,
  useCbaEntries,
  useCreateCbaEntry,
  useDeleteCbaEntry,
  CbaLibrary,
  CbaEntryForm,
  CbaHistory,
} from "../features/cost-benefit-analysis";
import { useRewardPractice, PracticeSource } from "../features/gamification";
import Spinner from "../components/ui/spinner";
import { CbaTrendChart, TrendPreview } from "../features/analytics";
import { SegmentControl, SegmentControlItem } from "../components/ui/segment-control";

const TABS = [
  { key: "library", labelKey: "cba.tabLibrary" },
  { key: "form", labelKey: "cba.tabForm" },
  { key: "history", labelKey: "cba.tabHistory" },
] as const;

export default function CostBenefitAnalysisPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("library");
  const [chartOpen, setChartOpen] = useState(false);

  const { data: examples, isLoading: examplesLoading } = useCbaExamples();
  const { data: commonItems, isLoading: commonItemsLoading } = useCbaCommonItems();
  const { data: entries, isLoading: entriesLoading } = useCbaEntries();
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateCbaEntry(() => {
    setTab("history");
    rewardPractice.mutate(PracticeSource.Cba);
  });
  const deleteEntry = useDeleteCbaEntry();

  const last7 = useMemo(() => {
    const arr: (number | null)[] = new Array(7).fill(null);
    for (const e of entries ?? []) {
      const dayIndex = Math.floor((Date.now() - new Date(e.createdAt).getTime()) / 86_400_000);
      if (dayIndex >= 0 && dayIndex < 7) {
        const idx = 6 - dayIndex;
        arr[idx] = (arr[idx] ?? 0) + 1;
      }
    }
    return arr;
  }, [entries]);

  const activeDays = last7.filter((v): v is number => v !== null).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">{t("cba.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("cba.subtitle")}</p>
      </div>

      <div className="max-w-lg mx-auto">
        <TrendPreview
          title={t("trendPreview.title")}
          label={t("trendPreview.days", { active: activeDays, total: 7 })}
          days={last7}
          icon={<Scale aria-hidden="true" className="w-4 h-4 text-primary" />}
          expanded={chartOpen}
          onToggle={() => setChartOpen((o) => !o)}
          showLabel={t("trendPreview.show")}
          hideLabel={t("trendPreview.hide")}
          disabled={(entries?.length ?? 0) === 0}
        >
          {entries && entries.length > 0 && <CbaTrendChart entries={entries} noCard />}
        </TrendPreview>
      </div>

      <div className="flex justify-center">
        <SegmentControl
          role="tablist"
          aria-label={t("cba.title")}
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
              aria-controls={`cba-panel-${item.key}`}
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
        id="cba-panel-library"
        aria-labelledby="cba-tab-library"
        hidden={tab !== "library"}
      >
        {tab === "library" ? (
          examplesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <CbaLibrary examples={examples ?? []} />
          )
        ) : null}
      </div>
      <div
        role="tabpanel"
        id="cba-panel-form"
        aria-labelledby="cba-tab-form"
        hidden={tab !== "form"}
      >
        {tab === "form" ? (
          commonItemsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <CbaEntryForm commonItems={commonItems ?? []} createEntry={createEntry} />
          )
        ) : null}
      </div>
      <div
        role="tabpanel"
        id="cba-panel-history"
        aria-labelledby="cba-tab-history"
        hidden={tab !== "history"}
      >
        {tab === "history" ? (
          entriesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="space-y-4">
              <CbaHistory entries={entries ?? []} deleteEntry={deleteEntry} />
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
