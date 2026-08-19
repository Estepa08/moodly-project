import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Swords } from 'lucide-react';
import { PLAY_ENERGY_COST, PLAY_DAILY_LIMIT } from '@moodly/shared';
import { cn } from '../../lib/utils';

interface PlayButtonProps {
  energy: number;
  playCount: number;
}

// A1: «Играть» запускает игру «Битва с мыслями» (/practices/thought-battle).
// Награда (−10 энергии, +2 XP, лимит 5/день) начисляется по завершении
// раунда игры, а не по клику — сама кнопка только решает, доступен ли вход.
export default function PlayButton({ energy, playCount }: PlayButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const limitReached = playCount >= PLAY_DAILY_LIMIT;
  const notEnoughEnergy = energy < PLAY_ENERGY_COST;
  const disabled = limitReached || notEnoughEnergy;
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
        onClick={() => navigate('/practices/thought-battle')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shrink-0 transition-[filter,transform] duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-gradient-to-r from-primary to-accent text-white shadow-neumorphic-sm hover:brightness-105 active:scale-[0.97]',
        )}
      >
        <Swords aria-hidden="true" className="w-3.5 h-3.5" />
        {t('companion.playCta')}
      </button>
      <p className="text-[11px] font-semibold text-muted-foreground leading-tight">{hint}</p>
    </div>
  );
}
