import { useTranslation } from 'react-i18next';
import { useSleepHygieneEntry } from '../hooks/useSleepHygieneEntry';
import { SleepHygieneChecklist } from '../features/check-in';

export default function SleepHygienePage() {
  const { t } = useTranslation();
  const { parameterId, hygieneEntries, createEntry, updateEntry } = useSleepHygieneEntry();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t('sleepHygiene.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('sleepHygiene.subtitle')}</p>
      </div>

      <SleepHygieneChecklist
        parameterId={parameterId}
        hygieneEntries={hygieneEntries}
        createEntry={createEntry}
        updateEntry={updateEntry}
      />
    </div>
  );
}
