import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import PetAvatar from './PetAvatar';
import { usePets, useCreatureState } from './useCreature';
import { usePetReward } from './usePetReward';
import { PET_DEFINITIONS } from './pets';
import { PET_CYCLE } from '@moodly/shared';
import { isCompanionHidden, subscribeCompanionVisibility } from './companionVisibility';
import { PET_AWAY_KEY, shouldPetBeAway, todayKey } from './petAway';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

const HIDDEN_PATHS = ['/tests/', '/practices/breathing', '/onboarding'];

export default function FloatingCompanion() {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: pets } = usePets();
  const { data: creature } = useCreatureState();
  const { reward, glow, handlePet } = usePetReward();
  const isReducedMotion = useReducedMotion();
  const [hidden, setHidden] = useState(isCompanionHidden);
  const [away, setAway] = useState(() =>
    shouldPetBeAway(
      typeof localStorage !== 'undefined' ? localStorage.getItem(PET_AWAY_KEY) : null,
      isReducedMotion,
    ),
  );
  const [justReturned, setJustReturned] = useState(false);
  const [greetSignal, setGreetSignal] = useState(0);

  useEffect(() => subscribeCompanionVisibility(() => setHidden(isCompanionHidden)), []);

  if (hidden) return null;
  if (HIDDEN_PATHS.some((path) => location.pathname.startsWith(path))) return null;

  const petType = pets?.activePetType ?? 'puff';
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? 'pets.puff');
  const petCount = creature?.petCount ?? 0;
  const cyclePosition = (petCount % PET_CYCLE) + 1;

  // Возврат из «отлучки»: помечаем день, показываем pop-in + слово «Тут я!»
  // и начисляем обычную награду первого клика.
  const handleReturn = () => {
    localStorage.setItem(PET_AWAY_KEY, todayKey());
    setAway(false);
    setJustReturned(true);
    setGreetSignal(Date.now());
    handlePet();
    setTimeout(() => setJustReturned(false), 700);
  };

  return (
    <div
      className={cn(
        'fixed right-[1cm] bottom-[calc(5rem+var(--sab))] md:bottom-6 md:right-[1cm] z-40',
        !isReducedMotion && !away && 'animate-pet-float',
      )}
      role="presentation"
    >
      {away ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleReturn}
            aria-label={t('companion.petAwayAria')}
            className="flex flex-col items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer transition-[transform] duration-150 active:scale-95"
          >
            <span
              aria-hidden="true"
              className="flex items-center justify-center w-[72px] h-[72px] rounded-full border-2 border-dashed border-muted-foreground/40 bg-secondary/60 text-3xl"
            >
              💤
            </span>
            <span className="mt-2 max-w-[170px] rounded-2xl bg-card shadow-neumorphic-sm px-3 py-2 text-center text-xs font-semibold text-foreground">
              {t('companion.petAwayHint')}
              <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                {t('companion.petAwaySub')}
              </span>
            </span>
          </button>
        </div>
      ) : (
        <PetAvatar
          petType={petType}
          size="md"
          interactive
          ariaLabel={petName}
          cyclePosition={cyclePosition}
          reward={reward}
          glow={glow}
          greetSignal={greetSignal}
          reappear={justReturned}
          onTap={() => handlePet()}
        />
      )}
    </div>
  );
}
