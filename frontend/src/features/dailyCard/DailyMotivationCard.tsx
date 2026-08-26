import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { useDailyCard } from './useDailyCard';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import ClaimBurst from '../gamification/ClaimBurst';
import { cn } from '../../lib/utils';
import { getRevealVariant, type MotivationPrinciple } from './dailyCard';

// «Карточка дня»: вариант B+C из product-strategy обсуждения — персональный
// день-индекс (useDailyCard) + открытие явным тапом. Анимация открытия
// чередуется по дню между тремя вариантами из Card Reveal Lab, выбранными
// пользователем (bloom / flip / tear) — см. getRevealVariant. При повторном
// визите в тот же день карточка показывается сразу, без повтора анимации.

const PRINCIPLE_LABEL_KEY: Record<MotivationPrinciple, string> = {
  autonomy: 'dailyCard.principle.autonomy',
  competence: 'dailyCard.principle.competence',
  relatedness: 'dailyCard.principle.relatedness',
  process_praise: 'dailyCard.principle.processPraise',
  effort_over_talent: 'dailyCard.principle.effortOverTalent',
  challenge_reframe: 'dailyCard.principle.challengeReframe',
};

const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
};

export default function DailyMotivationCard() {
  const { t } = useTranslation();
  const { card, isRevealed, justOpened, open } = useDailyCard();
  const reducedMotion = useReducedMotion();
  const variant = getRevealVariant(card.day);

  const principle = (
    <span className="mt-2 inline-block text-[11px] font-semibold text-muted-foreground">
      {t(PRINCIPLE_LABEL_KEY[card.principle])}
    </span>
  );

  return (
    <section
      aria-label={t('dailyCard.title')}
      className="relative rounded-3xl bg-card shadow-neumorphic p-5 overflow-hidden"
    >
      <p className="text-xs font-semibold text-muted-foreground mb-3">{t('dailyCard.title')}</p>
      <div className="relative flex items-center justify-center min-h-[92px]">
        {variant === 'flip' && (
          <RevealFlip
            text={card.text}
            isRevealed={isRevealed}
            justOpened={justOpened}
            reducedMotion={reducedMotion}
            onOpen={open}
            principle={principle}
            t={t}
          />
        )}
        {variant === 'tear' && (
          <RevealTear
            text={card.text}
            isRevealed={isRevealed}
            justOpened={justOpened}
            reducedMotion={reducedMotion}
            onOpen={open}
            principle={principle}
            t={t}
          />
        )}
        {variant === 'bloom' && (
          <RevealBloom
            text={card.text}
            isRevealed={isRevealed}
            justOpened={justOpened}
            reducedMotion={reducedMotion}
            onOpen={open}
            principle={principle}
            t={t}
          />
        )}
      </div>
    </section>
  );
}

interface VariantProps {
  text: string;
  isRevealed: boolean;
  justOpened: boolean;
  reducedMotion: boolean;
  onOpen: () => void;
  principle: React.ReactNode;
  t: (key: string) => string;
}

// --- 1. Light Bloom: свечение → вспышка → искры → всплытие текста ---
function RevealBloom({
  text,
  isRevealed,
  justOpened,
  reducedMotion,
  onOpen,
  principle,
  t,
}: VariantProps) {
  const [burstKey, setBurstKey] = useState(0);
  const playIntro = justOpened && !reducedMotion;

  const handleOpen = () => {
    onOpen();
    setBurstKey((k) => k + 1);
    if (!reducedMotion) vibrate(12);
  };

  return (
    <>
      {playIntro && (
        <motion.span
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 160,
            height: 160,
            background:
              'radial-gradient(circle, hsl(var(--accent) / 0.55) 0%, hsl(var(--accent) / 0) 70%)',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.9, 0.9, 0], scale: [0.5, 0.7, 1.6, 1.9] }}
          transition={{ duration: 0.85, times: [0, 0.32, 0.55, 1], ease: 'easeOut' }}
        />
      )}

      <AnimatePresence mode="sync">
        {!isRevealed && (
          <motion.button
            key="locked"
            type="button"
            onClick={handleOpen}
            whileTap={reducedMotion ? undefined : { scale: 0.94 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'group flex flex-col items-center gap-2 rounded-2xl px-6 py-5',
              'bg-gradient-to-br from-primary/15 to-accent/15 border border-border/60',
              'transition-[filter] duration-150 hover:brightness-105',
              'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center w-11 h-11 rounded-full bg-card shadow-neumorphic-sm text-accent',
                !reducedMotion && 'animate-glow-warm',
              )}
            >
              <Sparkles aria-hidden="true" className="w-5 h-5" />
            </span>
            <span className="text-sm font-bold text-foreground">{t('dailyCard.cta')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {isRevealed && (
        <motion.div
          initial={playIntro ? { opacity: 0, scale: 0.9, y: 6 } : false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: playIntro ? 0.2 : 0, ease: 'easeOut' }}
          className="relative text-center px-2 py-1"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
          {principle}
        </motion.div>
      )}

      {playIntro && (
        <ClaimBurst triggerKey={burstKey} radius={70} count={6} reducedMotion={reducedMotion} />
      )}
    </>
  );
}

// --- 2. Coin Flip 3D: переворот карты на 180° по Y ---
function RevealFlip({ text, isRevealed, reducedMotion, onOpen, principle, t }: VariantProps) {
  const handleOpen = () => {
    if (isRevealed) return;
    onOpen();
    if (!reducedMotion) vibrate(14);
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={isRevealed}
      aria-label={isRevealed ? undefined : t('dailyCard.cta')}
      className={cn(
        'relative w-full max-w-[280px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl',
        !isRevealed && 'cursor-pointer',
      )}
      style={{ perspective: 800 }}
    >
      <motion.div
        className="relative w-full min-h-[92px]"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        initial={false}
        transition={
          reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 15 }
        }
      >
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-5',
            'bg-gradient-to-br from-primary/15 to-accent/15 border border-border/60',
          )}
          style={{ backfaceVisibility: 'hidden' }}
          aria-hidden={isRevealed}
        >
          <span
            className={cn(
              'flex items-center justify-center w-11 h-11 rounded-full bg-card shadow-neumorphic-sm text-accent',
              !reducedMotion && 'animate-glow-warm',
            )}
          >
            <Sparkles aria-hidden="true" className="w-5 h-5" />
          </span>
          <span className="text-sm font-bold text-foreground">{t('dailyCard.cta')}</span>
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 py-3 rounded-2xl bg-card border border-border/60"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          aria-live="polite"
          aria-hidden={!isRevealed}
        >
          <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
          {principle}
        </div>
      </motion.div>
    </button>
  );
}

// --- 3. Lift & Tear: тап приподнимает карту, второй тап «распечатывает» её ---
// Разрыв на половинки анимируется через `animate` (не AnimatePresence/exit),
// потому что кнопка размонтируется, как только onOpen() переводит isRevealed
// в true — если положиться на exit, React уберёт AnimatePresence раньше, чем
// успеет доиграть анимация. Поэтому onOpen() вызывается с задержкой, равной
// длительности разлёта половинок, а не в момент тапа.
const TEAR_DURATION_MS = 380;

function RevealTear({ text, isRevealed, reducedMotion, onOpen, principle, t }: VariantProps) {
  const [stage, setStage] = useState<'idle' | 'lifted' | 'torn'>('idle');

  const handleClick = () => {
    if (isRevealed) return;

    if (reducedMotion) {
      onOpen();
      return;
    }

    if (stage === 'idle') {
      setStage('lifted');
      vibrate(6);
      return;
    }

    setStage('torn');
    vibrate(14);
    window.setTimeout(onOpen, TEAR_DURATION_MS);
  };

  const isTearing = stage !== 'idle';

  return (
    <div className="relative w-full max-w-[280px] min-h-[92px] flex items-center justify-center">
      {isRevealed ? (
        <div className="text-center px-4 py-3" aria-live="polite">
          <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
          {principle}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={stage === 'torn'}
          className="relative w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl cursor-pointer"
          style={{ perspective: 800 }}
        >
          <motion.div
            className={cn(
              'relative flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-5',
              'bg-gradient-to-br from-primary/15 to-accent/15 border border-border/60',
            )}
            animate={isTearing ? { y: -8, rotateX: 10 } : { y: 0, rotateX: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <span
              className={cn(
                'flex items-center justify-center w-11 h-11 rounded-full bg-card shadow-neumorphic-sm text-accent',
                !reducedMotion && 'animate-glow-warm',
              )}
            >
              <Sparkles aria-hidden="true" className="w-5 h-5" />
            </span>
            <span className="text-sm font-bold text-foreground">
              {stage === 'lifted' ? t('dailyCard.ctaTearAgain') : t('dailyCard.cta')}
            </span>
          </motion.div>

          {isTearing && (
            <>
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1/2 rounded-l-2xl bg-card border border-border/60 border-r-0"
                initial={{ x: 0, opacity: 1, rotate: 0 }}
                animate={
                  stage === 'torn'
                    ? { x: -18, opacity: 0, rotate: -3 }
                    : { x: 0, opacity: 1, rotate: 0 }
                }
                transition={{ duration: TEAR_DURATION_MS / 1000, ease: 'easeOut' }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 right-0 w-1/2 rounded-r-2xl bg-card border border-border/60 border-l-0"
                initial={{ x: 0, opacity: 1, rotate: 0 }}
                animate={
                  stage === 'torn'
                    ? { x: 18, opacity: 0, rotate: 3 }
                    : { x: 0, opacity: 1, rotate: 0 }
                }
                transition={{ duration: TEAR_DURATION_MS / 1000, ease: 'easeOut' }}
              />
            </>
          )}
        </button>
      )}
    </div>
  );
}
