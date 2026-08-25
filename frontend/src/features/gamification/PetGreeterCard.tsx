import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { useCreatureState, usePets } from './useCreature';
import { usePetReward } from './usePetReward';
import { PET_DEFINITIONS, petMoodToEmotion } from './pets';
import { PET_CYCLE } from '@moodly/shared';
import PetAvatar from './PetAvatar';
import PlayButton from './PlayButton';
import { TITLE_MAP, TITLE_EMOJI } from './TitleSelector';
import { useDayPhase } from '../../hooks/useDayPhase';
import { useMessageOfDay } from '../../hooks/useMessageOfDay';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/utils';
import { ENERGY_COLOR } from '../../lib/constants';

interface PetGreeterCardProps {
  onCheckIn: () => void;
}

export default function PetGreeterCard({ onCheckIn }: PetGreeterCardProps) {
  const { t } = useTranslation();
  const { data: creature, isLoading } = useCreatureState();
  const { data: pets } = usePets();
  const { reward, glow, handlePet } = usePetReward();
  const phase = useDayPhase();
  const { data: message } = useMessageOfDay(phase);
  const isReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isLoading || !creature) return null;

  const activePetType = pets?.activePetType ?? creature.petType ?? 'puff';
  const petName = pets?.petName ?? creature.petName ?? null;
  const definition = PET_DEFINITIONS.find((p) => p.type === activePetType);
  const displayName = petName?.trim() || (definition ? t(definition.labelKey) : '');

  const petCount = creature.petCount ?? 0;
  const energy = creature.energy ?? 100;
  const playCount = creature.playCount ?? 0;
  const cyclePosition = (petCount % PET_CYCLE) + 1;
  const energyPercent = Math.max(0, Math.min(100, energy));

  const title = creature.activeTitle ?? null;
  const titleEmoji = title ? (TITLE_EMOJI[title] ?? '🎖️') : null;
  const titleLabel = title ? t(TITLE_MAP[title] ?? 'progress.noTitle') : null;

  const handleTap = () => {
    handlePet();
  };

  return (
    <section
      aria-label={displayName}
      className="pet-gradient-bg rounded-3xl shadow-neumorphic p-5 pt-4 space-y-3 text-foreground"
    >
      <div className="flex items-center gap-2 px-1">
        <p className="font-serif font-bold text-foreground text-lg leading-tight truncate min-w-0 flex-1">
          {displayName}
        </p>
        {title && titleEmoji && (
          <span
            className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-card shadow-neumorphic-sm text-xs font-semibold text-primary"
            title={titleLabel ?? undefined}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {titleEmoji}
            </span>
            <span className="hidden sm:inline">{titleLabel}</span>
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          <span
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card shadow-neumorphic-sm"
            title={t('companion.energy', { value: energy })}
          >
            <span className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
              <span
                className="block h-full rounded-full transition-[width] duration-300"
                style={{ width: `${energyPercent}%`, backgroundColor: ENERGY_COLOR }}
              />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              ⚡ {energy}
            </span>
          </span>
          {!isMobile && (
            <span className="px-2.5 py-1 rounded-full bg-card shadow-neumorphic-sm text-xs font-semibold text-primary">
              {t('companion.level', { level: creature.level })}
            </span>
          )}
        </span>
      </div>

      <div className="relative flex flex-col items-center gap-2 pt-6 pb-8">
        <div
          className={cn(
            'h-28 w-28 rounded-full bg-card/60 flex items-center justify-center',
            !isReducedMotion && 'animate-pet-float',
          )}
        >
          <PetAvatar
            petType={activePetType}
            size="lg"
            plain
            interactive
            emotion={petMoodToEmotion(creature.petMood)}
            cyclePosition={cyclePosition}
            reward={reward}
            glow={glow}
            stage={creature.stage}
            onTap={handleTap}
            ariaLabel={displayName}
            particleFallLimit={100}
            bubbleClearance={32}
          />
        </div>
      </div>

      {/* NEW: кнопка «Играть» — тратит энергию, даёт XP (A1) */}
      <div className="flex justify-center">
        <PlayButton
          energy={energy}
          playCount={playCount}
          playDailyLimit={creature.playDailyLimit}
        />
      </div>

      <button
        type="button"
        onClick={onCheckIn}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5',
          'text-sm font-bold text-primary-foreground shadow-neumorphic-sm',
          'transition-[transform,filter] duration-150 hover:brightness-105 active:scale-[0.98]',
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {t('petGreeter.cta')}
        <ArrowRight aria-hidden="true" className="w-4 h-4" />
      </button>
    </section>
  );
}
