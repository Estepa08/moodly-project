import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import PetAvatar from './PetAvatar';
import { usePets, useCreatureState, useClaimAdventure } from './useCreature';
import { usePetReward } from './usePetReward';
import { buildAdventureSignal, type PetRewardSignal } from './petRewards';
import { playRewardSound } from './rewardSound';
import { PET_DEFINITIONS, petMoodToEmotion } from './pets';
import { PET_CYCLE } from '@moodly/shared';
import { isCompanionHidden, subscribeCompanionVisibility } from './companionVisibility';
import { adventurePhase, formatReturnTime } from './petAway';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useInterfaceMode } from '../../hooks/useInterfaceMode';
import { cn } from '../../lib/utils';

const HIDDEN_PATHS = ['/tests/', '/practices/breathing', '/onboarding'];

// Как часто перепроверять «время пришло» для активной прогулки (см.
// docs/gamification-phase2-visuals.svg, ряд 1) — сервер не пушит обновление
// состояния сам, поэтому просто периодически пересчитываем adventurePhase().
const ADVENTURE_TICK_MS = 30_000;

export default function FloatingCompanion() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isClassic } = useInterfaceMode();
  const { data: pets } = usePets();
  const { data: creature } = useCreatureState();
  const { reward, glow, handlePet } = usePetReward();
  const claimAdventure = useClaimAdventure();
  const isReducedMotion = useReducedMotion();
  const [hidden, setHidden] = useState(isCompanionHidden);
  const [justReturned, setJustReturned] = useState(false);
  const [greetSignal, setGreetSignal] = useState(0);
  const [adventureReward, setAdventureReward] = useState<PetRewardSignal | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => subscribeCompanionVisibility(() => setHidden(isCompanionHidden)), []);

  // Перерисовка раз в 30с, пока есть активная прогулка — иначе флаг «время
  // пришло» появится только после следующего невязанного ре-рендера.
  useEffect(() => {
    if (!creature?.adventureReturnAt) return;
    const id = setInterval(() => forceTick((n) => n + 1), ADVENTURE_TICK_MS);
    return () => clearInterval(id);
  }, [creature?.adventureReturnAt]);

  if (isClassic) return null;
  if (hidden) return null;
  if (HIDDEN_PATHS.some((path) => location.pathname.startsWith(path))) return null;

  const petType = pets?.activePetType ?? 'puff';
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? 'pets.puff');
  const petCount = creature?.petCount ?? 0;
  const cyclePosition = (petCount % PET_CYCLE) + 1;
  const phase = adventurePhase(creature?.adventureReturnAt);

  // Забрать награду за прогулку: отдельный повод от клика по компаньону —
  // 'adventure' кадр (подарок/компас), не переиспользует 'welcome'.
  const handleClaimAdventure = () => {
    if (claimAdventure.isPending) return;
    claimAdventure.mutate(undefined, {
      onSuccess: () => {
        setAdventureReward(buildAdventureSignal());
        playRewardSound();
        setJustReturned(true);
        setGreetSignal(Date.now());
        setTimeout(() => setJustReturned(false), 700);
        setTimeout(() => setAdventureReward(null), 1800);
      },
    });
  };

  return (
    <div
      className={cn(
        'fixed right-[1cm] bottom-[calc(5rem+var(--sab))] md:bottom-20 md:right-[1cm] z-40',
        !isReducedMotion && phase !== 'active' && 'animate-pet-float',
      )}
      role="presentation"
    >
      {phase === 'active' && creature?.adventureReturnAt ? (
        <div className="flex flex-col items-center gap-2" aria-hidden="true">
          <span className="flex items-center justify-center w-[72px] h-[72px] rounded-full border-2 border-dashed border-muted-foreground/40 bg-secondary/60 text-3xl">
            🎒
          </span>
          <span className="mt-2 max-w-[170px] rounded-2xl bg-card shadow-neumorphic-sm px-3 py-2 text-center text-xs font-semibold text-foreground">
            {t('companion.adventureActiveHint')}
            <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
              {t('companion.adventureActiveSub', {
                time: formatReturnTime(creature.adventureReturnAt),
              })}
            </span>
          </span>
        </div>
      ) : phase === 'ready' ? (
        <button
          type="button"
          onClick={handleClaimAdventure}
          disabled={claimAdventure.isPending}
          aria-label={t('companion.adventureReadyAria')}
          className="flex flex-col items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-[transform] duration-150 active:scale-95 disabled:opacity-70"
        >
          <span
            aria-hidden="true"
            className="relative flex items-center justify-center w-[72px] h-[72px] rounded-full bg-warning/15 text-3xl"
          >
            <span className="absolute -inset-1.5 rounded-full bg-warning/30 blur-md animate-glow-warm" />
            <span className="relative">🎁</span>
          </span>
          <span className="mt-2 max-w-[170px] rounded-2xl bg-card shadow-neumorphic-sm px-3 py-2 text-center text-xs font-semibold text-foreground">
            {t('companion.adventureReadyHint')}
            <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
              {t('companion.adventureReadySub')}
            </span>
          </span>
        </button>
      ) : (
        <PetAvatar
          petType={petType}
          size="md"
          interactive
          ariaLabel={petName}
          emotion={petMoodToEmotion(creature?.petMood)}
          cyclePosition={cyclePosition}
          reward={adventureReward ?? reward}
          glow={glow}
          greetSignal={greetSignal}
          reappear={justReturned}
          particleFallLimit={80}
          onTap={() => handlePet()}
        />
      )}
    </div>
  );
}
