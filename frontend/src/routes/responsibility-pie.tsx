import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useResponsibilityPieEntries,
  useCreateResponsibilityPieEntry,
  useDeleteResponsibilityPieEntry,
  ResponsibilityPieForm,
  ResponsibilityPieHistory,
} from '../features/responsibility-pie';
import { useRewardPractice, PracticeSource } from '../features/gamification';
import Spinner from '../components/ui/spinner';
import { SegmentGroup, SegmentButton } from '../components/ui/segment-button';

const TABS = [
  { key: 'form', labelKey: 'responsibilityPie.tabForm' },
  { key: 'history', labelKey: 'responsibilityPie.tabHistory' },
] as const;

export default function ResponsibilityPiePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('form');

  const { data: entries, isLoading: entriesLoading } = useResponsibilityPieEntries();
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateResponsibilityPieEntry(() => {
    setTab('history');
    rewardPractice.mutate(PracticeSource.ResponsibilityPie);
  });
  const deleteEntry = useDeleteResponsibilityPieEntry();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t('responsibilityPie.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('responsibilityPie.subtitle')}</p>
      </div>

      <div className="flex justify-center">
        <SegmentGroup
          role="tablist"
          aria-label={t('responsibilityPie.title')}
          onKeyDown={(e) => {
            const idx = TABS.findIndex((item) => item.key === tab);
            if (e.key === 'ArrowLeft' && idx > 0) setTab(TABS[idx - 1].key);
            if (e.key === 'ArrowRight' && idx < TABS.length - 1) setTab(TABS[idx + 1].key);
          }}
        >
          {TABS.map((item) => (
            <SegmentButton
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              aria-controls={`responsibility-pie-panel-${item.key}`}
              active={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {t(item.labelKey)}
            </SegmentButton>
          ))}
        </SegmentGroup>
      </div>

      <div
        role="tabpanel"
        id="responsibility-pie-panel-form"
        aria-labelledby="responsibility-pie-tab-form"
        hidden={tab !== 'form'}
      >
        {tab === 'form' ? <ResponsibilityPieForm createEntry={createEntry} /> : null}
      </div>
      <div
        role="tabpanel"
        id="responsibility-pie-panel-history"
        aria-labelledby="responsibility-pie-tab-history"
        hidden={tab !== 'history'}
      >
        {tab === 'history' ? (
          entriesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <ResponsibilityPieHistory entries={entries ?? []} deleteEntry={deleteEntry} />
          )
        ) : null}
      </div>
    </div>
  );
}
