import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Lottie from 'lottie-react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PET_DEFINITIONS, STAGE_SCALE, hasPetEmotion, type PetEmotion } from './pets';
import { usePetAnimation } from './usePetAnimation';
import PetRewardParticles from './PetRewardParticles';
import { pickPetWordIndex, type PetRewardSignal } from './petRewards';
import { cn } from '../../lib/utils';

export type PetAvatarSize = 'sm' | 'md' | 'lg';

// Подсветка-подсказка скрытых бонусов: тёплый ореол утром (6-12),
// синий ореол вечером (20-23).
export type PetGlow = 'warm' | 'cool' | null;

const SIZE_CLASS: Record<PetAvatarSize, { box: string; icon: string }> = {
  sm: { box: 'w-[60px] h-[60px]', icon: 'text-2xl' },
  md: { box: 'w-[72px] h-[72px]', icon: 'text-3xl' },
  lg: { box: 'w-24 h-24', icon: 'text-5xl' },
};

const FEED_ITEM_COUNT = 6;

// Слова-пиллы летят медленно — чтобы успеть прочитать текст.
const LABEL_LIFETIME_MS = 5200;

// Слова-эмоции: на кликах 1-2 цикла с этим шансом вылетает слово-пилла;
// остальные тапы — только физическая реакция (squash), без пузыря.
// Клик 3 — уже показывает реальную награду через PetRewardParticles.
const WORD_CHANCE = 0.35;

// «Пробежка» компаньона (скрылся влево/вправо → вернулся с другой стороны со словом).
const DASH_CHANCE = 0.08;
const DASH_OUT_MS = 350;
const DASH_TOTAL_MS = 900;

// Время жизни анимации награды зависит от типа (дольше у «утро»/«возвращение»).
const SIGNAL_LIFETIME_MS: Record<PetRewardSignal['kind'], number> = {
  none: 1200,
  standard: 1000,
  morning: 1800,
  evening: 1250,
  combo: 1600,
  welcome: 1900,
  empathy: 1500,
  adventure: 1600,
};

type BubbleDepth = 'over' | 'under';

interface BubbleTrajectory {
  swayA: number;
  swayB: number;
  tilt: number;
  by: number;
}

interface FloatItem {
  id: number;
  emoji?: string;
  /** Если задан — рендерится текстовый пузырь (например «+1 XP») вместо эмоджи */
  label?: string;
  offset: number;
  delay: number;
  depth: BubbleDepth;
  trajectory: BubbleTrajectory;
}

interface PetAvatarProps {
  petType?: string;
  size?: PetAvatarSize;
  emotion?: PetEmotion;
  interactive?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Смена значения запускает анимацию «кормления»: еда падает сверху на питомца */
  feedSignal?: number;
  /** Доп. обработчик тапа по питомцу (вызывается вместе с декоративными пузырями) */
  onTap?: () => void;
  /** Позиция текущего клика в цикле 1-2-3: на 1-2 — изредка слово-пилла, на 3 — награда */
  cyclePosition?: number;
  /** Сигнал награды от сервера (каждый клик): запускает уникальную анимацию частиц */
  reward?: PetRewardSignal | null;
  /** Подсветка-подсказка: «warm» — бодрое утро, «cool» — спокойный вечер */
  glow?: PetGlow;
  /** Обрезает еду/пузыри по кругу аватара (для тостов и шапки теста — ничего не вылетает наружу) */
  contained?: boolean;
  /** Убирает фон-кружок (питомец на прозрачной подложке) */
  plain?: boolean;
  /** Смена значения показывает одноразовое слово-пиллу (например «Тут я!» после отлучки) */
  greetSignal?: number;
  /** При включении — одноразовая анимация появления (pop-in) на монтировании */
  reappear?: boolean;
  /** Ограничивает нижний разлёт частиц награды (px) — для питомца у края экрана */
  particleFallLimit?: number;
  /** Максимальный радиус разлёта частиц награды (px) — ограничивает границей контейнера */
  particleBoundary?: number;
  /** Поднимает точку старта пузырей выше кнопки (px) — чтобы эмодзи не
      показывались внутри круга контейнера с аватаром */
  bubbleClearance?: number;
  /** Стадия эволюции (baby/kid/adult/max) — визуально масштабирует аватар
      и добавляет свечение на финальной стадии (см. STAGE_SCALE) */
  stage?: string;
}

export default function PetAvatar({
  petType = 'puff',
  size = 'md',
  emotion = 'idle',
  interactive = false,
  ariaLabel,
  className,
  feedSignal,
  onTap,
  contained = false,
  plain = false,
  cyclePosition = 1,
  reward = null,
  glow = null,
  greetSignal,
  reappear = false,
  particleFallLimit,
  particleBoundary,
  bubbleClearance = 0,
  stage,
}: PetAvatarProps) {
  const { t } = useTranslation();
  const isReducedMotion = useReducedMotion();
  const animationData = usePetAnimation(petType, emotion);
  const [bubbles, setBubbles] = useState<FloatItem[]>([]);
  const [feedItems, setFeedItems] = useState<FloatItem[]>([]);
  const [signals, setSignals] = useState<PetRewardSignal[]>([]);
  const [squashing, setSquashing] = useState(false);
  const [dash, setDash] = useState<null | 'out' | 'in'>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dashDirRef = useRef<'left' | 'right'>('left');
  const lastWordIndexRef = useRef<number | null>(null);

  const words =
    (t('companion.petReward.words', { returnObjects: true }) as unknown as string[]) ?? [];

  const definition = PET_DEFINITIONS.find((p) => p.type === petType);
  const feedEmojis = definition?.feed ?? ['🫧'];

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  // Каждый новый сигнал награды добавляется в очередь частиц и удаляется
  // после завершения своей анимации (можно спамить клики — награды наслаиваются).
  useEffect(() => {
    if (!reward) return;
    setSignals((prev) => [...prev, reward]);
    const lifetime = SIGNAL_LIFETIME_MS[reward.kind];
    const timer = setTimeout(() => {
      setSignals((prev) => prev.filter((s) => s.id !== reward.id));
    }, lifetime);
    timersRef.current.push(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward?.id]);

  const pickWord = () => {
    if (words.length === 0) return undefined;
    const idx = pickPetWordIndex(words.length, lastWordIndexRef.current);
    lastWordIndexRef.current = idx;
    return words[idx];
  };

  // «Пробежка»: питомец прыгает за край экрана влево/вправо, затем возвращается
  // с противоположной стороны + слово-пилла (см. docs/companion-rewards-v4.svg, B.4).
  const runDash = () => {
    if (dash) return;
    const dir: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
    dashDirRef.current = dir;
    const word = pickWord();
    setDash('out');
    const outTimer = setTimeout(() => {
      setDash('in');
      if (word) spawnBubble(word);
    }, DASH_OUT_MS);
    const inTimer = setTimeout(() => setDash(null), DASH_TOTAL_MS);
    timersRef.current.push(outTimer, inTimer);
  };

  // Одноразовое слово-приветствие (например «Тут я!» после возврата из отлучки).
  useEffect(() => {
    if (!greetSignal || isReducedMotion) return;
    spawnBubble(t('companion.petReward.returnWord'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greetSignal]);

  const spawnBubble = (label?: string) => {
    if (!interactive) return;
    // С ~8% вместо обычного пузыря — «пробежка» (не для contained и reduced-motion).
    if (!label && !contained && !isReducedMotion && Math.random() < DASH_CHANCE) {
      runDash();
      return;
    }
    // Клик 3 уже показывает реальную награду через PetRewardParticles —
    // декоративный пузырь здесь не нужен, чтобы не дублировать сигнал.
    if (!label && cyclePosition === 3) return;
    if (!label) {
      if (words.length === 0 || Math.random() >= WORD_CHANCE) return;
      label = pickWord();
      if (!label) return;
    }
    const id = Date.now() + Math.random();
    const depth: BubbleDepth = Math.random() > 0.5 ? 'over' : 'under';
    const trajectory: BubbleTrajectory = {
      swayA: Math.random() * 40 - 20,
      swayB: Math.random() * 60 - 30,
      tilt: (Math.random() - 0.5) * 36,
      // Слова поднимаются выше и медленнее — за 5.2s, чтобы успеть прочитать.
      by: -(300 + Math.random() * 90),
    };
    setBubbles((prev) => [
      ...prev,
      { id, label, offset: Math.random() * 60 - 30, delay: 0, depth, trajectory },
    ]);
    const timer = setTimeout(
      () => setBubbles((prev) => prev.filter((b) => b.id !== id)),
      LABEL_LIFETIME_MS,
    );
    timersRef.current.push(timer);
  };

  const triggerSquash = () => {
    if (isReducedMotion) return;
    setSquashing(false);
    requestAnimationFrame(() => setSquashing(true));
    const timer = setTimeout(() => setSquashing(false), 380);
    timersRef.current.push(timer);
  };

  useEffect(() => {
    if (!feedSignal || isReducedMotion) return;
    clearTimers();

    const items: FloatItem[] = Array.from({ length: FEED_ITEM_COUNT }, (_, i) => ({
      id: Date.now() + i,
      emoji: feedEmojis[i % feedEmojis.length],
      offset: (i % 5) * 10 - 20,
      delay: i * 130,
      depth: 'under',
      trajectory: { swayA: 0, swayB: 0, tilt: 0, by: -260 },
    }));
    setFeedItems(items);

    items.forEach((item, i) => {
      const removeTimer = setTimeout(
        () => setFeedItems((prev) => prev.filter((f) => f.id !== item.id)),
        1500 + item.delay,
      );
      timersRef.current.push(removeTimer);
      const squashTimer = setTimeout(triggerSquash, 220 + i * 150);
      timersRef.current.push(squashTimer);
    });

    const clearTimer = setTimeout(() => setFeedItems([]), 2300);
    timersRef.current.push(clearTimer);

    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedSignal]);

  const fallback = PET_DEFINITIONS.find((p) => p.type === petType)?.emoji ?? '🫧';
  const { box, icon } = SIZE_CLASS[size];
  const stageScale = stage ? (STAGE_SCALE[stage] ?? 1) : 1;
  const isMaxStage = stage === 'max';

  const showPetBounce =
    emotion === 'happy' && !hasPetEmotion(petType, 'happy') && !isReducedMotion && !!animationData;

  return (
    <button
      type="button"
      onClick={() => {
        spawnBubble();
        onTap?.();
      }}
      aria-label={ariaLabel}
      className={cn(
        'relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        contained && 'overflow-hidden',
        interactive && 'cursor-pointer active:scale-95 transition-[transform] duration-150',
        squashing && 'animate-pet-squash',
        !isReducedMotion && reappear && 'animate-pet-pop-in',
        !isReducedMotion &&
          dash === 'out' &&
          (dashDirRef.current === 'left'
            ? 'animate-pet-dash-out-left'
            : 'animate-pet-dash-out-right'),
        !isReducedMotion &&
          dash === 'in' &&
          (dashDirRef.current === 'left'
            ? 'animate-pet-dash-in-right'
            : 'animate-pet-dash-in-left'),
        className,
      )}
    >
      {/* Ореол-подсказка скрытых бонусов (утро/вечер) */}
      {glow && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -inset-2 rounded-full blur-md pointer-events-none',
            glow === 'warm'
              ? 'bg-amber-300/40 animate-glow-warm'
              : 'bg-sky-400/40 animate-glow-cool',
          )}
        />
      )}

      {/* F1: свечение финальной стадии эволюции (max) — не связано с glow (время суток) */}
      {isMaxStage && !isReducedMotion && (
        <span
          aria-hidden="true"
          className="absolute -inset-2 rounded-full blur-md pointer-events-none bg-warning/30 animate-glow-warm"
        />
      )}

      {/* F1: масштаб визуального слоя по стадии эволюции — сам бокс (и хит-área
          кнопки) размер не меняет, растёт/уменьшается только содержимое внутри */}
      <span
        className={cn('relative block rounded-full transition-transform duration-500', box)}
        style={stageScale !== 1 ? { transform: `scale(${stageScale})` } : undefined}
      >
        <span
          className={cn('absolute inset-0 rounded-full', plain ? 'bg-transparent' : 'bg-secondary')}
        />
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            icon,
            showPetBounce && 'animate-pet-happy',
          )}
        >
          {isReducedMotion || !animationData ? (
            <span aria-hidden="true">{fallback}</span>
          ) : (
            <Lottie animationData={animationData} loop autoplay />
          )}
        </span>
      </span>

      {bubbles.map((b) => (
        <span
          key={b.id}
          aria-hidden="true"
          className={cn(
            'absolute left-1/2 flex items-center justify-center pointer-events-none min-w-[3rem] h-7 px-1 animate-word-up',
            b.depth === 'over' && 'z-20',
          )}
          style={
            {
              top: bubbleClearance ? -bubbleClearance : 0,
              marginLeft: b.offset,
              '--by': `${b.trajectory.by}px`,
            } as CSSProperties
          }
        >
          <span
            className="animate-bubble-sway inline-block whitespace-nowrap px-2 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-xs font-bold text-white shadow-neumorphic-sm"
            style={
              {
                '--sway-a': `${b.trajectory.swayA}px`,
                '--sway-b': `${b.trajectory.swayB}px`,
                '--tilt': `${b.trajectory.tilt}deg`,
              } as CSSProperties
            }
          >
            {b.label}
          </span>
        </span>
      ))}

      {feedItems.map((item) => (
        <span
          key={item.id}
          aria-hidden="true"
          className="absolute left-1/2 top-[30%] w-6 h-6 flex items-center justify-center text-lg animate-feed-fall pointer-events-none"
          style={{ marginLeft: item.offset, animationDelay: `${item.delay}ms` }}
        >
          {item.emoji}
        </span>
      ))}

      {signals.map((s) => (
        <PetRewardParticles
          key={s.id}
          signal={s}
          reducedMotion={isReducedMotion}
          fallLimit={particleFallLimit}
          boundaryRadius={particleBoundary}
        />
      ))}
    </button>
  );
}
