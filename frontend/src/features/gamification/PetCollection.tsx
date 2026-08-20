import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import Lottie from 'lottie-react';
import { Check, Gift, Pencil } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePets, useSetPet, useAchievements } from './useCreature';
import { PET_DEFINITIONS, type PetDefinition } from './pets';
import { usePetAnimation } from './usePetAnimation';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';

const PREVIEW_COUNT = 6;

// B1: силуэт вместо иконки-замка — приглушённый контур формы, который
// держит интригу («что это?») вместо явного «доступ закрыт».
function PetSilhouette() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 text-muted-foreground/50"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 3c-2 0-3.2 1.6-3.6 3.4-1.6.4-3 2-3 4.3 0 .9.4 1.7 1 2.3-.6.6-1 1.6-1 2.6 0 2.3 2 4.4 4.6 4.4h4c2.6 0 4.6-2.1 4.6-4.4 0-1-.4-2-1-2.6.6-.6 1-1.4 1-2.3 0-2.3-1.4-3.9-3-4.3C15.2 4.6 14 3 12 3z" />
    </svg>
  );
}

interface PetCardProps {
  pet: PetDefinition;
  isUnlocked: boolean;
  isActive: boolean;
  onSelect: (type: string) => void;
}

function PetCard({ pet, isUnlocked, isActive, onSelect }: PetCardProps) {
  const { t } = useTranslation();
  const isReducedMotion = useReducedMotion();
  const animationData = usePetAnimation(pet.type, 'idle');

  return (
    <button
      onClick={() => isUnlocked && !isActive && onSelect(pet.type)}
      disabled={!isUnlocked || isActive}
      className={cn(
        'relative w-full rounded-xl p-3 flex flex-col items-center gap-1.5 transition-[background-color,box-shadow,opacity,transform] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'min-h-[92px]',
        isActive
          ? 'bg-card shadow-neumorphic-inset border-2 border-primary'
          : isUnlocked
            ? 'bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.97]'
            : 'bg-muted/40 opacity-70 cursor-not-allowed',
      )}
      aria-label={t(pet.labelKey)}
      aria-pressed={isActive}
    >
      {isActive && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check aria-hidden="true" className="w-3 h-3" strokeWidth={3} />
        </span>
      )}
      <div
        className={cn(
          'w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-xl shrink-0',
          isActive ? pet.color : isUnlocked ? 'bg-secondary' : 'bg-muted',
        )}
      >
        {isUnlocked ? (
          animationData && !isReducedMotion ? (
            <Lottie animationData={animationData} loop autoplay className="w-full h-full" />
          ) : (
            pet.emoji
          )
        ) : (
          <PetSilhouette />
        )}
      </div>
      <span className="text-xs font-medium text-center leading-tight line-clamp-1">
        {t(pet.labelKey)}
      </span>
    </button>
  );
}

export default function PetCollection() {
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const { data: achievements } = useAchievements();
  const setPet = useSetPet();
  const [showAll, setShowAll] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [draftName, setDraftName] = useState('');

  const unlocked = pets?.unlockedPetTypes ?? ['puff', 'fox'];
  const active = pets?.activePetType ?? 'puff';
  const activeDefinition = PET_DEFINITIONS.find((p) => p.type === active);
  const activeName = pets?.petName?.trim() || (activeDefinition ? t(activeDefinition.labelKey) : '');

  const openRename = () => {
    setDraftName(activeName);
    setRenameOpen(true);
  };

  const saveName = () => {
    setPet.mutate(
      { petType: undefined, petName: draftName.trim() || null },
      { onSuccess: () => setRenameOpen(false) },
    );
  };

  const visiblePets = showAll ? PET_DEFINITIONS : PET_DEFINITIONS.slice(0, PREVIEW_COUNT);
  const hiddenCount = PET_DEFINITIONS.length - PREVIEW_COUNT;

  const totalCount = PET_DEFINITIONS.length;
  const unlockedCount = unlocked.length;
  const unlockedPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // B1: «Следующий питомец» — ближайшее по прогрессу нераскрытое достижение
  // с наградой-питомцем (petTypeReward). Если таких нет — карточка скрыта.
  const nextPetAchievement = (achievements ?? [])
    .filter((a) => a.petTypeReward && !a.unlocked)
    .sort((a, b) => b.progress - a.progress)[0];
  const nextPetDefinition = nextPetAchievement
    ? PET_DEFINITIONS.find((p) => p.type === nextPetAchievement.petTypeReward)
    : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {t('pets.collectionLabel')}
        </span>
        <span className="text-xs font-bold text-primary tabular-nums">
          {t('pets.collectionCount', { current: unlockedCount, total: totalCount })} ·{' '}
          {unlockedPercent}%
        </span>
      </div>

      {activeName && (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground truncate">{activeName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={openRename}
            aria-label={t('companion.renameTitle')}
            className="shrink-0"
          >
            <Pencil aria-hidden="true" className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${unlockedPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {visiblePets.map((pet) => {
          const isUnlocked = unlocked.includes(pet.type);
          const isActive = active === pet.type;
          return (
            <PetCard
              key={pet.type}
              pet={pet}
              isUnlocked={isUnlocked}
              isActive={isActive}
              onSelect={setPet.mutate}
            />
          );
        })}
      </div>

      {!showAll && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl p-2.5 text-sm font-semibold text-foreground bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.99] transition-[box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('pets.showAll', { count: hiddenCount })}
        </button>
      )}

      {nextPetAchievement && (
        <div className="rounded-xl p-3 flex items-center gap-3 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
            <PetSilhouette />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {t('pets.nextPetLabel')}
            </p>
            <p className="text-xs font-semibold text-foreground truncate">
              {t(nextPetAchievement.titleKey)}
            </p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${nextPetAchievement.progress}%` }}
              />
            </div>
          </div>
          {nextPetDefinition && (
            <span className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-full bg-card text-[10px] font-bold text-primary">
              <Gift aria-hidden="true" className="w-3 h-3" />
              {nextPetDefinition.emoji}
            </span>
          )}
        </div>
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('companion.renameTitle')}</DialogTitle>
            <DialogDescription>{t('companion.renameDescription')}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveName();
            }}
          >
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={24}
              aria-label={t('companion.renameTitle')}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRenameOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={setPet.isPending}>
                {t('companion.renameSave')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
