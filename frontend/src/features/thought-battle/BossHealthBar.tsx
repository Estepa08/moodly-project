import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface BossHealthBarProps {
  percent: number;
  /** Меняется при каждом попадании — запускает вспышку на баре */
  hitSignal: number;
}

export default function BossHealthBar({ percent, hitSignal }: BossHealthBarProps) {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {t('thoughtBattle.bossHpLabel')}
        </span>
        <span className="text-xs font-bold text-accent tabular-nums">{clamped}%</span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden shadow-neumorphic-inset">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
          animate={{ width: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        />
        <motion.div
          key={hitSignal}
          className="absolute inset-0 bg-white pointer-events-none"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        />
      </div>
    </div>
  );
}
