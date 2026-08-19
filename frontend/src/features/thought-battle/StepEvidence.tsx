import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EvidenceItem {
  text: string;
  isFact: boolean;
}

interface StepEvidenceProps {
  items: EvidenceItem[];
  onHit: () => void;
  onComplete: (comboMax: number) => void;
}

type Feedback = 'correct' | 'wrong' | null;

export default function StepEvidence({ items, onHit, onComplete }: StepEvidenceProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboMax, setComboMax] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const current = items[index];

  const advance = (nextCombo: number) => {
    const max = Math.max(comboMax, nextCombo);
    setComboMax(max);
    const next = index + 1;
    if (next >= items.length) {
      onComplete(max);
      return;
    }
    setIndex(next);
    setFeedback(null);
  };

  const handleAnswer = (answerIsFact: boolean) => {
    if (feedback) return;
    const correct = answerIsFact === current.isFact;
    if (correct) {
      onHit();
      setFeedback('correct');
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setTimeout(() => advance(nextCombo), 400);
    } else {
      setFeedback('wrong');
      setCombo(0);
      setTimeout(() => advance(0), 700);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">{t('thoughtBattle.step2Title')}</h3>
          <p className="text-xs text-muted-foreground">{t('thoughtBattle.step2Hint')}</p>
        </div>
        {combo > 0 && (
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold">
            {t('thoughtBattle.comboLabel', { count: combo })}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: feedback === 'wrong' ? 0 : -24,
            y: feedback === 'wrong' ? 20 : 0,
          }}
          transition={{ duration: 0.25 }}
          className={cn(
            'rounded-xl p-4 text-sm font-medium text-foreground bg-card shadow-neumorphic-sm min-h-[64px] flex items-center justify-center text-center',
            feedback === 'correct' && 'bg-success/10',
            feedback === 'wrong' && 'bg-destructive/10',
          )}
        >
          {feedback === 'correct' && (
            <Check aria-hidden="true" className="w-4 h-4 text-success mr-2 shrink-0" />
          )}
          {feedback === 'wrong' && (
            <X aria-hidden="true" className="w-4 h-4 text-destructive mr-2 shrink-0" />
          )}
          {current.text}
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!!feedback}
          onClick={() => handleAnswer(true)}
          className="rounded-xl px-4 py-3 text-sm font-bold bg-success/10 text-success shadow-neumorphic-sm active:scale-[0.97] transition-transform disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('thoughtBattle.factLabel')}
        </button>
        <button
          type="button"
          disabled={!!feedback}
          onClick={() => handleAnswer(false)}
          className="rounded-xl px-4 py-3 text-sm font-bold bg-info/10 text-info shadow-neumorphic-sm active:scale-[0.97] transition-transform disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('thoughtBattle.interpretationLabel')}
        </button>
      </div>

      <div className="flex justify-center gap-1">
        {items.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-[width,background-color] duration-200',
              i === index ? 'w-6 bg-primary' : i < index ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}
