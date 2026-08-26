import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import ResponsibilityPieChart from './ResponsibilityPieChart';
import FactorSliderRow from './FactorSliderRow';
import AddFactorInput from './AddFactorInput';
import { rebalanceFactors, addFactor, removeFactor } from './responsibilityPieRebalance';
import type { ResponsibilityFactor } from './responsibilityPieRebalance';
import type { useCreateResponsibilityPieEntry } from './useResponsibilityPie';

interface ResponsibilityPieFormProps {
  createEntry: ReturnType<typeof useCreateResponsibilityPieEntry>;
}

const DEFAULT_FACTOR_IDS = ['me', 'colleagues', 'external', 'forceMajeure'] as const;
const MAX_FACTORS = 8;
const ME_FACTOR_ID = 'me';

let customFactorCounter = 0;
function nextCustomFactorId() {
  customFactorCounter += 1;
  return `custom-${customFactorCounter}`;
}

export default function ResponsibilityPieForm({ createEntry }: ResponsibilityPieFormProps) {
  const { t } = useTranslation();
  const [situationText, setSituationText] = useState('');
  const [factors, setFactors] = useState<ResponsibilityFactor[]>(() =>
    DEFAULT_FACTOR_IDS.map((id) => ({
      id,
      label: t(`responsibilityPie.factor.${id}`),
      percent: 25,
    })),
  );

  const meFactor = factors.find((f) => f.id === ME_FACTOR_ID);
  const canSave = situationText.trim().length > 0;

  const handleSliderChange = (id: string, value: number) => {
    setFactors((prev) => rebalanceFactors(prev, id, value));
  };

  const handleAddFactor = (label: string) => {
    setFactors((prev) => addFactor(prev, nextCustomFactorId(), label));
  };

  const handleRemoveFactor = (id: string) => {
    setFactors((prev) => removeFactor(prev, id));
  };

  const handleSave = () => {
    if (!canSave) return;
    createEntry.mutate(
      {
        situationText: situationText.trim(),
        factors: factors.map((f) => ({ label: f.label, percent: f.percent })),
      },
      {
        onSuccess: () => {
          setSituationText('');
          setFactors(
            DEFAULT_FACTOR_IDS.map((id) => ({
              id,
              label: t(`responsibilityPie.factor.${id}`),
              percent: 25,
            })),
          );
        },
      },
    );
  };

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t('responsibilityPie.formTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{t('responsibilityPie.situationLabel')}</p>
          <Textarea
            value={situationText}
            onChange={(e) => setSituationText(e.target.value)}
            placeholder={t('responsibilityPie.situationPlaceholder')}
            rows={2}
            enterKeyHint="done"
            inputMode="text"
          />
        </div>

        <ResponsibilityPieChart factors={factors} />

        <div className="space-y-3">
          {factors.map((f) => (
            <FactorSliderRow
              key={f.id}
              label={f.label}
              percent={f.percent}
              onChange={(v) => handleSliderChange(f.id, v)}
              onRemove={
                DEFAULT_FACTOR_IDS.includes(f.id as (typeof DEFAULT_FACTOR_IDS)[number])
                  ? undefined
                  : () => handleRemoveFactor(f.id)
              }
            />
          ))}
        </div>

        <AddFactorInput onAdd={handleAddFactor} disabled={factors.length >= MAX_FACTORS} />

        {meFactor && (
          <p className="text-sm text-foreground bg-muted/50 rounded-xl p-3">
            {t('responsibilityPie.takeaway', { percent: meFactor.percent })}
          </p>
        )}

        <Button className="w-full" disabled={!canSave || createEntry.isPending} onClick={handleSave}>
          {createEntry.isPending ? t('common.saving') : t('responsibilityPie.saveCta')}
        </Button>
      </CardContent>
    </Card>
  );
}
