import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '../../lib/utils'; // <-- два уровня
import { EMOTION_META } from '../../lib/emotion-meta'; // <-- исправлено: ../../../
import { emotionDefinition } from './emotionLibrary';

interface EmotionWheelProps {
  selected: string[];
  onSelect: (key: string) => void;
}

const EMOTIONS = [
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
];

export default function EmotionWheel({ selected, onSelect }: EmotionWheelProps) {
  const { t } = useTranslation();
  const [infoKey, setInfoKey] = useState<string | null>(null);

  const infoMeta = infoKey ? EMOTION_META[infoKey] : undefined;
  const infoText = infoKey ? emotionDefinition(infoKey) : undefined;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-3">
        {EMOTIONS.map((key) => {
          const meta = EMOTION_META[key];
          const isSelected = selected.includes(key);
          const isDisabled = selected.length >= 2 && !isSelected;

          return (
            <div key={key} className="relative">
              <motion.button
                type="button"
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={() => onSelect(key)}
                disabled={isDisabled}
                className={cn(
                  'w-full relative p-3 rounded-lg transition-all duration-200',
                  'bg-white dark:bg-gray-800 shadow-sm hover:shadow-md',
                  'border-2 border-transparent',
                  isSelected && 'border-primary ring-2 ring-primary/20',
                  isDisabled && 'opacity-40 cursor-not-allowed',
                  !isDisabled && 'hover:border-gray-200 dark:hover:border-gray-600',
                )}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: meta.tint }}
                >
                  <meta.icon className="w-6 h-6" style={{ color: meta.color }} />
                </div>
                <div className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">
                  {t(meta.name)}
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {selected.indexOf(key) + 1}
                    </span>
                  </div>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => setInfoKey((prev) => (prev === key ? null : key))}
                aria-label={t('emotionLab.showDefinition', { name: t(meta.name) })}
                aria-pressed={infoKey === key}
                className={cn(
                  'absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center',
                  'bg-card border border-border text-muted-foreground shadow-sm transition-colors',
                  'hover:text-primary hover:border-primary/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  infoKey === key && 'text-primary border-primary bg-primary/10',
                )}
              >
                <Info aria-hidden="true" className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {infoMeta && infoText && (
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug px-1">
          <Info aria-hidden="true" className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold text-foreground">{t(infoMeta.name)}.</span> {infoText}
          </span>
        </p>
      )}
    </div>
  );
}
