import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Zap, Waves, Flame, Sparkles, Activity, Heart, Pencil, ArrowRight } from 'lucide-react';
import { useCreatureState, usePets, useSetPet } from './useCreature';
import { usePetReward } from './usePetReward';
import { PET_DEFINITIONS } from './pets';
import { EXP_PER_LEVEL, ENERGY_COLOR } from '../../lib/constants';
import { PET_DAILY_CLICK_LIMIT, PET_CYCLE, ENERGY_LOW_THRESHOLD } from '@moodly/shared';
import { ProgressBar } from '../../components/ui/progress-bar';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { TITLE_MAP, TITLE_EMOJI } from './TitleSelector';
import PetAvatar from './PetAvatar';
import PlayButton from './PlayButton';

export default function CompanionCard() {
  const { t } = useTranslation();
  const { data: creature, isLoading } = useCreatureState();
  const { data: pets } = usePets();
  const { reward, glow, handlePet } = usePetReward();
  const setPet = useSetPet();
  const [renameOpen, setRenameOpen] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (isLoading || !creature) return null;

  const activePetType = pets?.activePetType ?? creature.petType ?? 'puff';
  const petName = pets?.petName ?? creature.petName ?? null;
  const definition = PET_DEFINITIONS.find((p) => p.type === activePetType);
  const displayName = petName?.trim() || (definition ? t(definition.labelKey) : '');

  const petMood = creature.petMood ?? 'calm';
  const stage = creature.stage ?? 'baby';

  // Цикл поглаживаний 1-2-3: позиция следующего клика.
  const petCount = creature.petCount ?? 0;
  const cyclePosition = (petCount % PET_CYCLE) + 1;
  const petCountRemaining = creature.petCountRemaining ?? PET_DAILY_CLICK_LIMIT - petCount;
  const limitReached = petCount >= PET_DAILY_CLICK_LIMIT;
  const energy = creature.energy ?? 100;
  const energyPercent = Math.max(0, Math.min(100, Math.round((energy / 100) * 100)));
  const isLowEnergy = energy <= ENERGY_LOW_THRESHOLD;
  const playCount = creature.playCount ?? 0;

  const nextLevelExp = creature.level * EXP_PER_LEVEL;
  const expPercent = Math.min(100, Math.round((creature.experience / nextLevelExp) * 100));

  const title = creature.activeTitle ?? null;
  const titleEmoji = title ? (TITLE_EMOJI[title] ?? '🎖️') : null;
  const titleLabel = title ? t(TITLE_MAP[title] ?? 'progress.noTitle') : null;

  const handleTap = () => {
    handlePet((data) => {
      if (data.limitReached) {
        toast.info(t('companion.petsLimitMessage', { limit: PET_DAILY_CLICK_LIMIT }));
      }
    });
  };

  const openRename = () => {
    setDraftName(displayName);
    setRenameOpen(true);
  };

  const saveName = () => {
    setPet.mutate(
      { petType: undefined, petName: draftName.trim() || null },
      { onSuccess: () => setRenameOpen(false) },
    );
  };

  return (
    <section
      aria-label={displayName}
      className="bg-card rounded-xl shadow-neumorphic p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <PetAvatar
            petType={activePetType}
            interactive
            ariaLabel={displayName}
            emotion={petMood === 'happy' ? 'happy' : 'idle'}
            cyclePosition={cyclePosition}
            reward={reward}
            glow={glow}
            stage={stage}
            onTap={handleTap}
          />
          {/* NEW: бар энергии прямо под аватаром */}
          <div className="w-[60px]">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${energyPercent}%`, backgroundColor: ENERGY_COLOR }}
              />
            </div>
            <p className="mt-0.5 text-center text-[10px] font-bold text-muted-foreground tabular-nums">
              ⚡ {energy}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-serif font-semibold text-foreground text-lg leading-tight truncate">
              {displayName}
            </p>
            {title && titleEmoji && (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-info/10 text-xs font-semibold text-info shrink-0"
                title={titleLabel ?? undefined}
              >
                <span aria-hidden="true" className="text-sm leading-none">
                  {titleEmoji}
                </span>
                <span className="hidden sm:inline">{titleLabel}</span>
              </span>
            )}
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
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {t('companion.level', { level: creature.level })}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-xs font-semibold text-warning">
              <Flame aria-hidden="true" className="w-3 h-3" />
              {creature.streak}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-xs font-semibold text-accent">
              <Sparkles aria-hidden="true" className="w-3 h-3" />
              {t(`petStage.${stage}`)}
            </span>
          </div>
        </div>
      </div>

      {/* NEW: кнопка «Играть» — тратит энергию, даёт XP (A1) */}
      <PlayButton energy={energy} playCount={playCount} />

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('companion.xpToLevel', { level: creature.level + 1 })}
          </span>
          <span className="text-xs text-muted-foreground font-semibold tabular-nums">
            {creature.experience}/{nextLevelExp}
          </span>
        </div>
        <ProgressBar
          segments={[
            {
              value: expPercent,
              className:
                'rounded-full bg-primary shadow-neumorphic-sm transition-[width] duration-300',
            },
          ]}
          height={6}
          trackClassName="bg-muted"
          className="mt-1.5"
        />
      </div>

      {/* Цикл поглаживаний: 1-2-3, на 3-м клике XP */}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
            limitReached
              ? 'bg-muted text-muted-foreground'
              : 'bg-gradient-to-r from-primary to-accent text-white shadow-neumorphic-sm',
          )}
        >
          <Heart aria-hidden="true" className="w-3.5 h-3.5" />
          {petCount}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('companion.petsRemainingLabel')}
          </p>
          <p className="text-xs text-muted-foreground font-semibold tabular-nums">
            {t('companion.petsProgress', {
              current: petCountRemaining,
              limit: PET_DAILY_CLICK_LIMIT,
            })}
          </p>
        </div>
      </div>

      {!limitReached && (
        <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
          {t('companion.cycleHint', { current: cyclePosition, total: PET_CYCLE })}
        </p>
      )}

      {limitReached && (
        <p
          role="status"
          className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
        >
          {t('companion.petsLimitMessage', { limit: PET_DAILY_CLICK_LIMIT })}
        </p>
      )}

      {/* NEW: баннер низкой энергии ≤ 20% */}
      {isLowEnergy && (
        <div role="alert" className="rounded-xl bg-destructive/10 p-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-destructive">
            <Zap aria-hidden="true" className="w-4 h-4" />
            {t('companion.energyLowTitle')}
          </p>
          <p className="text-xs font-medium text-muted-foreground leading-snug">
            {t('companion.energyLowHint')}
          </p>
          <Link
            to="/practices"
            className="flex items-center justify-between w-full rounded-lg bg-btn-gradient text-primary-foreground px-3 py-2 text-xs font-bold shadow-neumorphic-sm transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('companion.energyRestoreCta')}
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
          <span aria-hidden="true" className="text-sm leading-none">
            <Activity aria-hidden="true" className="w-3.5 h-3.5" />
          </span>
          {t(`petMood.${petMood}`)}
        </span>
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${ENERGY_COLOR}15` }}
        >
          <Zap aria-hidden="true" className="w-3.5 h-3.5" style={{ color: ENERGY_COLOR }} />
          <span style={{ color: ENERGY_COLOR }}>{t('companion.energy', { value: energy })}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
          <Waves aria-hidden="true" className="w-3.5 h-3.5" />
          {t('companion.calmness', { value: creature.calmness })}
        </span>
      </div>

      <div className="pt-2 border-t border-border">
        <Link
          to="/progress"
          className="flex items-center justify-between text-sm font-medium text-primary transition-[color,transform] duration-150 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          {t('companion.toCollection')}
          <span aria-hidden="true" className="text-base leading-none">
            ›
          </span>
        </Link>
      </div>

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
    </section>
  );
}
