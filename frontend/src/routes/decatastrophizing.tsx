import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useDecatastrophizingEntries,
  useCreateDecatastrophizingEntry,
  useDeleteDecatastrophizingEntry,
  DecatastrophizingWizard,
  DecatastrophizingHistory,
} from '../features/decatastrophizing';
import { useRewardPractice, PracticeSource } from '../features/gamification';
import Spinner from '../components/ui/spinner';
import { SegmentGroup, SegmentButton } from '../components/ui/segment-button';

const TABS = [
  { key: 'practice', labelKey: 'decatastrophizing.tabPractice' },
  { key: 'history', labelKey: 'decatastrophizing.tabHistory' },
] as const;

export default function DecatastrophizingPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('practice');

  const { data: entries, isLoading: entriesLoading } = useDecatastrophizingEntries();
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateDecatastrophizingEntry(() => {
    setTab('history');
    rewardPractice.mutate(PracticeSource.Decatastrophizing);
  });
  const deleteEntry = useDeleteDecatastrophizingEntry();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t('decatastrophizing.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('decatastrophizing.subtitle')}</p>
      </div>

      <div className="flex justify-center">
        <SegmentGroup
          role="tablist"
          aria-label={t('decatastrophizing.title')}
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
              aria-controls={`decatastrophizing-panel-${item.key}`}
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
        id="decatastrophizing-panel-practice"
        aria-labelledby="decatastrophizing-tab-practice"
        hidden={tab !== 'practice'}
      >
        {tab === 'practice' ? <DecatastrophizingWizard createEntry={createEntry} /> : null}
      </div>
      <div
        role="tabpanel"
        id="decatastrophizing-panel-history"
        aria-labelledby="decatastrophizing-tab-history"
        hidden={tab !== 'history'}
      >
        {tab === 'history' ? (
          entriesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <DecatastrophizingHistory entries={entries ?? []} deleteEntry={deleteEntry} />
          )
        ) : null}
      </div>
    </div>
  );
}
