import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DistortionKey } from '../../lib/distortionsQuiz';
import { cn } from '../../lib/utils';

interface StepDistortionProps {
  correct: DistortionKey;
  distractors: DistortionKey[];
  onCorrect: () => void;
}

export default function StepDistortion({ correct, distractors, onCorrect }: StepDistortionProps) {
  const { t } = useTranslation();
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [shakeSeq, setShakeSeq] = useState(0);

  const options = useMemo(() => {
    const all = [correct, ...distractors];
    return all
      .map((key) => ({ key, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((o) => o.key);
  }, [correct, distractors]);

  const handleTap = (key: DistortionKey) => {
    if (key === correct) {
      onCorrect();
      return;
    }
    setWrongKey(key);
    setShakeSeq((s) => s + 1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{t('thoughtBattle.step1Title')}</h3>
        <p className="text-xs text-muted-foreground">{t('thoughtBattle.step1Hint')}</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {options.map((key) => (
          <motion.button
            key={key}
            type="button"
            onClick={() => handleTap(key)}
            animate={wrongKey === key ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            onAnimationComplete={() => {
              if (wrongKey === key) setWrongKey(null);
            }}
            className={cn(
              'w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-[background-color,box-shadow] duration-150',
              'bg-card shadow-neumorphic-sm hover:shadow-elevation-2 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              wrongKey === key && 'bg-destructive/10 text-destructive',
            )}
          >
            {t(`cognitiveDistortions.${key}`)}
          </motion.button>
        ))}
      </div>
      {wrongKey && (
        <p key={shakeSeq} className="text-xs font-semibold text-destructive text-center">
          {t('thoughtBattle.step1Wrong')}
        </p>
      )}
    </div>
  );
}
