import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils'; // <-- два уровня
import { EMOTION_META } from '../../lib/emotion-meta'; // <-- исправлено: ../../../

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

  return (
    <div className="grid grid-cols-4 gap-3">
      {EMOTIONS.map((key) => {
        const meta = EMOTION_META[key];
        const isSelected = selected.includes(key);
        const isDisabled = selected.length >= 2 && !isSelected;

        return (
          <motion.button
            key={key}
            whileHover={!isDisabled ? { scale: 1.05 } : {}}
            whileTap={!isDisabled ? { scale: 0.95 } : {}}
            onClick={() => onSelect(key)}
            disabled={isDisabled}
            className={cn(
              'relative p-3 rounded-lg transition-all duration-200',
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
                <span className="text-white text-xs font-bold">{selected.indexOf(key) + 1}</span>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
