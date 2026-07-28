import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useCbaExamples,
  useCbaCommonItems,
  useCbaEntries,
  useCreateCbaEntry,
  useDeleteCbaEntry,
} from "../hooks/useCba";
import CbaLibrary from "../components/CbaLibrary";
import CbaEntryForm from "../components/CbaEntryForm";
import CbaHistory from "../components/CbaHistory";
import Spinner from "../components/ui/spinner";

const TABS = [
  { key: "library", labelKey: "cba.tabLibrary" },
  { key: "form", labelKey: "cba.tabForm" },
  { key: "history", labelKey: "cba.tabHistory" },
] as const;

export default function CostBenefitAnalysisPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("library");

  const { data: examples, isLoading: examplesLoading } = useCbaExamples();
  const { data: commonItems, isLoading: commonItemsLoading } = useCbaCommonItems();
  const { data: entries, isLoading: entriesLoading } = useCbaEntries();
  const createEntry = useCreateCbaEntry(() => setTab("history"));
  const deleteEntry = useDeleteCbaEntry();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">{t("cba.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("cba.subtitle")}</p>
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
        examplesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size={32} />
          </div>
        ) : (
          <CbaLibrary examples={examples ?? []} />
        )
      ) : tab === "form" ? (
        commonItemsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size={32} />
          </div>
        ) : (
          <CbaEntryForm commonItems={commonItems ?? []} createEntry={createEntry} />
        )
      ) : entriesLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size={32} />
        </div>
      ) : (
        <CbaHistory entries={entries ?? []} deleteEntry={deleteEntry} />
      )}
    </div>
  );
}
