import { useTranslation } from 'react-i18next';
import { Gamepad2 } from 'lucide-react';
import { PLAY_ENERGY_COST, PLAY_DAILY_LIMIT } from '@moodly/shared';
import { usePlay } from './useCreature';
import { cn } from '../../lib/utils';

interface PlayButtonProps {
  energy: number;
  playCount: number;
}

// A1: «Играть» — быстрый источник XP, тратит энергию (ресурс, который
// пополняют практики/чек-ин). Три состояния: доступно / мало энергии /
// дневной лимит игр — у каждого свой текст подсказки под кнопкой.
export default function PlayButton({ energy, playCount }: PlayButtonProps) {
  const { t } = useTranslation();
  const play = usePlay();

  const limitReached = playCount >= PLAY_DAILY_LIMIT;
  const notEnoughEnergy = energy < PLAY_ENERGY_COST;
  const disabled = limitReached || notEnoughEnergy || play.isPending;
  const remaining = Math.max(0, PLAY_DAILY_LIMIT - playCount);

  const hint = limitReached
    ? t('companion.playLimitHint')
    : notEnoughEnergy
      ? t('companion.playNoEnergyHint')
      : t('companion.playHint', { remaining });

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => play.mutate()}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shrink-0 transition-[filter,transform] duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-gradient-to-r from-primary to-accent text-white shadow-neumorphic-sm hover:brightness-105 active:scale-[0.97]',
        )}
      >
        <Gamepad2 aria-hidden="true" className="w-3.5 h-3.5" />
        {t('companion.playCta')}
      </button>
      <p className="text-[11px] font-semibold text-muted-foreground leading-tight">{hint}</p>
    </div>
  );
}
