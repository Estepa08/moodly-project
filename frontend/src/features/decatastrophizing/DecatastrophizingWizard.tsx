import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import type { useCreateDecatastrophizingEntry } from './useDecatastrophizing';

interface DecatastrophizingWizardProps {
  createEntry: ReturnType<typeof useCreateDecatastrophizingEntry>;
}

type Step = 1 | 2 | 3 | 'summary';
const TOTAL_STEPS = 3;

const STEP_DOT_INDEX: Record<Step, number> = { 1: 0, 2: 1, 3: 2, summary: 2 };

export default function DecatastrophizingWizard({ createEntry }: DecatastrophizingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [worstCase, setWorstCase] = useState('');
  const [copingPlan, setCopingPlan] = useState('');
  const [mostLikely, setMostLikely] = useState('');

  const reset = () => {
    setStep(1);
    setWorstCase('');
    setCopingPlan('');
    setMostLikely('');
  };

  const handleSave = () => {
    createEntry.mutate(
      {
        worstCaseText: worstCase.trim(),
        copingPlanText: copingPlan.trim(),
        mostLikelyText: mostLikely.trim(),
      },
      { onSuccess: reset },
    );
  };

  return (
    <Card className="shadow-neumorphic">
      <CardContent className="pt-6 space-y-5">
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                i === STEP_DOT_INDEX[step] ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {t('decatastrophizing.step1Title')}
            </p>
            <Textarea
              value={worstCase}
              onChange={(e) => setWorstCase(e.target.value)}
              placeholder={t('decatastrophizing.step1Placeholder')}
              rows={5}
              autoFocus
            />
            <Button
              className="w-full"
              disabled={worstCase.trim().length === 0}
              onClick={() => setStep(2)}
            >
              {t('decatastrophizing.nextCta')}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="rounded-xl bg-muted/50 p-3 space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {t('decatastrophizing.worstCaseLabel')}
              </p>
              <p className="text-sm text-foreground">{worstCase}</p>
            </div>
            <p className="text-sm font-medium text-foreground">
              {t('decatastrophizing.step2Title')}
            </p>
            <Textarea
              value={copingPlan}
              onChange={(e) => setCopingPlan(e.target.value)}
              placeholder={t('decatastrophizing.step2Placeholder')}
              rows={5}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                {t('decatastrophizing.backCta')}
              </Button>
              <Button
                className="flex-1"
                disabled={copingPlan.trim().length === 0}
                onClick={() => setStep(3)}
              >
                {t('decatastrophizing.nextCta')}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {t('decatastrophizing.step3Title')}
            </p>
            <Textarea
              value={mostLikely}
              onChange={(e) => setMostLikely(e.target.value)}
              placeholder={t('decatastrophizing.step3Placeholder')}
              rows={5}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                {t('decatastrophizing.backCta')}
              </Button>
              <Button
                className="flex-1"
                disabled={mostLikely.trim().length === 0}
                onClick={() => setStep('summary')}
              >
                {t('decatastrophizing.compareCta')}
              </Button>
            </div>
          </div>
        )}

        {step === 'summary' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground text-center">
              {t('decatastrophizing.summaryTitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('decatastrophizing.worstCaseLabel')}
                </p>
                <p className="text-sm text-foreground">{worstCase}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t('decatastrophizing.copingPlanLabel')}
                </p>
                <p className="text-sm text-foreground">{copingPlan}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 space-y-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {t('decatastrophizing.mostLikelyLabel')}
                </p>
                <p className="text-sm text-foreground">{mostLikely}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(3)}>
                {t('decatastrophizing.backCta')}
              </Button>
              <Button className="flex-1" disabled={createEntry.isPending} onClick={handleSave}>
                {createEntry.isPending ? t('common.saving') : t('decatastrophizing.saveCta')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
