import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ModalShell } from '../../components/ui/modal-shell';
import { Button } from '../../components/ui/button';
import PetAvatar from './PetAvatar';
import { usePets } from './useCreature';
import { PET_DEFINITIONS } from './pets';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

interface EvolutionMomentProps {
  open: boolean;
  fromStage: string | null;
  toStage: string | null;
  onDismiss: () => void;
}

const CONFETTI = [
  { top: '6%', left: '14%', delay: '0ms', color: 'text-warning' },
  { top: '10%', left: '82%', delay: '80ms', color: 'text-accent' },
  { top: '18%', left: '48%', delay: '150ms', color: 'text-primary' },
  { top: '4%', left: '62%', delay: '220ms', color: 'text-warning' },
  { top: '22%', left: '24%', delay: '60ms', color: 'text-accent' },
];

// F1: полноэкранный оверлей на переход питомца на новую стадию эволюции
// (baby → kid → adult → max). Показывается один раз за переход
// (см. useEvolutionMoment) — «было → стало» без языка поражения/сравнения.
export default function EvolutionMoment({
  open,
  fromStage,
  toStage,
  onDismiss,
}: EvolutionMomentProps) {
  const { t } = useTranslation();
  const isReducedMotion = useReducedMotion();
  const { data: pets } = usePets();

  const petType = pets?.activePetType ?? 'puff';
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? 'pets.puff');

  if (!fromStage || !toStage) return null;

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      title={t('evolution.title', { name: petName })}
      description={t('evolution.body', { stage: t(`petStage.${toStage}`) })}
      className="max-w-sm overflow-hidden"
    >
      <div className="relative py-2">
        {!isReducedMotion &&
          CONFETTI.map((c, i) => (
            <Sparkles
              key={i}
              aria-hidden="true"
              className={cn('absolute w-4 h-4 animate-evolution-confetti', c.color)}
              style={{ top: c.top, left: c.left, animationDelay: c.delay }}
            />
          ))}

        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <PetAvatar petType={petType} size="sm" plain ariaLabel={petName} />
            <span className="text-[11px] font-semibold text-muted-foreground">
              {t('evolution.was')} {t(`petStage.${fromStage}`)}
            </span>
          </div>

          <ArrowRight aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />

          <div className="flex flex-col items-center gap-1.5">
            <span className="relative">
              {!isReducedMotion && (
                <span
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-full bg-warning/30 blur-md animate-glow-warm"
                />
              )}
              <PetAvatar petType={petType} size="md" plain ariaLabel={petName} />
            </span>
            <span className="text-[11px] font-bold text-foreground">
              {t('evolution.became')} {t(`petStage.${toStage}`)}
            </span>
          </div>
        </div>
      </div>

      <Button variant="default" className="w-full mt-2" onClick={onDismiss}>
        {t('evolution.cta')}
      </Button>
    </ModalShell>
  );
}
