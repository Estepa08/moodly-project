import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PetAvatar from './PetAvatar';
import { PET_DEFINITIONS, petMoodToEmotion } from './pets';
import { usePets } from './useCreature';
import { usePetReward } from './usePetReward';
import { usePetEnergyPulse } from './energyPulse';
import { StreakIndicator } from './index';
import { ProgressBar } from '../../components/ui/progress-bar';
import { Button } from '../../components/ui/button';
import { EXP_PER_LEVEL, ENERGY_COLOR } from '../../lib/constants';
import { PET_CYCLE } from '@moodly/shared';
import { TITLE_MAP, TITLE_EMOJI } from './TitleSelector';
import { cn } from '../../lib/utils';
import { shareStoryCard } from '../../lib/shareStoryCard';
import type { CreatureState } from '../../lib/api';

interface ProgressHeroProps {
  creature: CreatureState;
}

export default function ProgressHero({ creature }: ProgressHeroProps) {
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const { reward, glow, handlePet } = usePetReward();
  const energyPulsing = usePetEnergyPulse();
  const [isSharingStory, setIsSharingStory] = useState(false);

  const petType = pets?.activePetType ?? 'puff';
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? 'pets.puff');
  const nextLevelExp = creature.level * EXP_PER_LEVEL;
  const expPercent = Math.min(100, Math.round((creature.experience / nextLevelExp) * 100));

  const petCount = creature.petCount ?? 0;
  const cyclePosition = (petCount % PET_CYCLE) + 1;
  const title = creature.activeTitle ?? null;
  const titleEmoji = title ? (TITLE_EMOJI[title] ?? '🎖️') : null;
  const titleLabel = title ? t(TITLE_MAP[title] ?? 'progress.noTitle') : null;

  const energy = creature.energy ?? 100;
  const energyPercent = Math.max(0, Math.min(100, energy));

  const handleTap = () => {
    handlePet();
  };

  // Сессия 9 (three-personas-design-gaps.md): «одно действие с экрана
  // прогресса» — вертикальная (9:16) карточка стрика для Stories, тем же
  // бэкенд-рендером, что и обычная OG-карточка (см. lib/shareStoryCard.ts).
  // Показываем кнопку только когда есть чем поделиться — стрик 0 выглядел бы
  // странно в сторис.
  const handleShareStory = async () => {
    if (isSharingStory || creature.streak <= 0) return;
    setIsSharingStory(true);
    try {
      const result = await shareStoryCard(creature.streak, petType);
      if (result === 'downloaded') {
        toast.success(t('progress.shareStoryDownloaded'));
      } else if (result === 'failed') {
        toast.error(t('progress.shareStoryError'));
      }
    } finally {
      setIsSharingStory(false);
    }
  };

  return (
    <div className="rounded-xl bg-card shadow-neumorphic p-5">
      <div className="flex items-center gap-4">
        {/* Аватар */}
        <div className="shrink-0">
          <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center relative">
            <PetAvatar
              petType={petType}
              size="lg"
              plain
              interactive
              ariaLabel={petName}
              emotion={petMoodToEmotion(creature.petMood)}
              cyclePosition={cyclePosition}
              reward={reward}
              glow={glow}
              stage={creature.stage ?? 'baby'}
              className="animate-pet-float"
              particleBoundary={36}
              particleFallLimit={0}
              onTap={handleTap}
            />
          </div>
        </div>

        {/* Информация о питомце */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-primary/10 text-xs font-bold text-primary">
              {t('creature.level', { level: creature.level })}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 text-xs font-semibold text-accent">
              <Sparkles aria-hidden="true" className="w-3 h-3" />
              {t(`petStage.${creature.stage ?? 'baby'}`)}
            </span>
            {title && titleEmoji && (
              <span
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-info/10 text-xs font-semibold text-info"
                title={titleLabel ?? undefined}
              >
                <span aria-hidden="true" className="text-sm leading-none">
                  {titleEmoji}
                </span>
                <span className="hidden sm:inline">{titleLabel}</span>
              </span>
            )}
            <StreakIndicator streak={creature.streak} freezeCount={creature.streakFreezeCount} />
            <span
              data-role="pet-energy-badge"
              className={cn(
                'ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-card shadow-neumorphic-sm',
                energyPulsing && 'animate-energy-pulse',
              )}
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
          </div>

          {/* Прогресс XP */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar
                segments={[
                  {
                    value: expPercent,
                    className:
                      'rounded-full bg-primary shadow-neumorphic-sm transition-[width] duration-300',
                  },
                ]}
                height={4}
                trackClassName="bg-muted"
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums font-medium whitespace-nowrap">
              {creature.experience}/{nextLevelExp} XP
            </span>
          </div>
        </div>
      </div>

      {creature.streak > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          disabled={isSharingStory}
          onClick={handleShareStory}
        >
          {isSharingStory ? (
            <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
          ) : (
            <Share2 aria-hidden="true" className="w-4 h-4" />
          )}
          {t('progress.shareStory')}
        </Button>
      )}
    </div>
  );
}
