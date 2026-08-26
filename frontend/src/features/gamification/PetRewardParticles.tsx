import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Star,
  Heart,
  Sun,
  Trophy,
  ThumbsUp,
  Sunrise,
  SunMedium,
  HeartHandshake,
  Gem,
  Droplets,
  Gift,
  Compass,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PetRewardSignal } from './petRewards';
import { emitEnergyPulse } from './energyPulse';

// Компонент «частиц награды»: рендерит уникальную анимацию для каждого типа
// клика по компаньону (см. docs/companion-gamified-rewards.svg). Частицы
// вылетают из центра аватара (точка (0,0) — центр).

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

// Тихий кабинет: без фиолетового/маджента — только токены палитры
// (olive/terracotta/chart-*), совпадающие с остальным приложением.
const GOLD = 'hsl(var(--chart-4))';
const SUN = 'hsl(var(--accent))';
const ROSE = 'hsl(var(--chart-5))';
const BLUE = 'hsl(var(--info))';
const SAGE = 'hsl(var(--primary-muted))';
const XP_GREEN = 'hsl(var(--success))';
const TEAL = 'hsl(var(--chart-2))';
const COMBO_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-4))',
  'hsl(var(--info))',
  'hsl(var(--chart-5))',
];
const COMBO_ICONS: Array<typeof Sparkles> = [Sparkles, Star, Heart, Trophy, Sun];

// Микс-пулы «иконка + цвет»: внутри одного залпа частицы не повторяются,
// чтобы не было 3-5 одинаковых иконок одновременно.
const STANDARD_MIX: Array<{ icon: typeof Sparkles; color: string }> = [
  { icon: Sparkles, color: GOLD },
  { icon: Trophy, color: ROSE },
  { icon: ThumbsUp, color: SAGE },
];
const MORNING_MIX: Array<{ icon: typeof Sparkles; color: string }> = [
  { icon: Sunrise, color: SUN },
  { icon: Sparkles, color: GOLD },
  { icon: Star, color: 'hsl(var(--warning))' },
  { icon: SunMedium, color: 'hsl(var(--accent-strong))' },
  { icon: Sparkles, color: 'hsl(var(--chart-4) / 0.8)' },
];
const WELCOME_MIX: Array<{ icon: typeof Sparkles; color: string }> = [
  { icon: HeartHandshake, color: ROSE },
  { icon: Sparkles, color: SAGE },
  { icon: Star, color: GOLD },
  { icon: Heart, color: 'hsl(var(--accent-strong))' },
  { icon: Gem, color: 'hsl(var(--primary-strong))' },
];
// «Прогулка»: подарок/компас — тема «принёс находку», не сердечки welcome.
const ADVENTURE_MIX: Array<{ icon: typeof Sparkles; color: string }> = [
  { icon: Gift, color: TEAL },
  { icon: Compass, color: GOLD },
  { icon: Sparkles, color: SAGE },
  { icon: Gift, color: 'hsl(var(--success))' },
  { icon: Compass, color: 'hsl(var(--warning))' },
];

// Фиксированные количества частиц (ровно, без случайных диапазонов — без перебора).
const PARTICLE_COUNTS = {
  standard: 3, // +1 XP, золотые звёздочки
  morning: 5, // «Бодрое утро», солнечные зайчики
  combo: 8, // «Комбо», взрыв искр
  welcome: 5, // «Возвращение», сердечки
  eveningWaves: 5, // волны вечера
  empathyDrops: 4, // капли → звёзды
  adventure: 5, // «Прогулка», подарок/компас
} as const;

// Tier 2 (docs/gamification-phase1-visuals.svg, ряд 4): интенсивность
// 'welcome' растёт по comeback-тиру. Без comebackDays (обычное «Возвращение»
// после паузы в поглаживаниях) — прежнее фиксированное количество.
function welcomeParticleCount(comebackDays?: 7 | 14 | 30): number {
  if (comebackDays === 7) return 3;
  if (comebackDays === 30) return 6;
  return PARTICLE_COUNTS.welcome;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  delay: number;
}

// Равномерное распределение частиц по дуге/кругу с лёгким jitter (±8°):
// углы не сбиваются в кучу, дальность растёт по спирали с небольшим шумом.
// `cap` (px) ограничивает максимальный разлёт — частицы останавливаются
// на границе контейнера, а не улетают за него.
function makeParticles(
  count: number,
  minDist: number,
  maxDist: number,
  arcUp = false,
  cap?: number,
): Particle[] {
  const hi = cap === undefined ? maxDist : Math.min(maxDist, cap);
  const lo = Math.min(minDist, hi);
  return Array.from({ length: count }, (_, i) => {
    const start = arcUp ? Math.PI * 0.12 : 0;
    const span = arcUp ? Math.PI * 0.76 : Math.PI * 2;
    const angle = start + (span * i) / count + rand(-0.14, 0.14);
    const dist =
      lo +
      ((hi - lo) * i) / Math.max(1, count - 1) +
      rand(-Math.min(10, (hi - lo) * 0.25), Math.min(10, (hi - lo) * 0.25));
    // Жёсткий кламп: даже с jitter частица не уходит за границу контейнера.
    const clamped = Math.max(lo, Math.min(hi, dist));
    return {
      id: i,
      x: Math.cos(angle) * clamped,
      y: Math.sin(angle) * clamped,
      scale: rand(0.6, 1.25),
      rotate: rand(-60, 60),
      delay: i * 0.03,
    };
  });
}

interface PetRewardParticlesProps {
  signal: PetRewardSignal;
  reducedMotion?: boolean;
  /** Максимальная дистанция полёта частиц вниз (px). Нужен плавающему
      компаньону у нижнего края экрана — чтобы иконки не улетали за экран */
  fallLimit?: number;
  /** Максимальный радиус разлёта частиц (px). Если задан — частицы
      не улетают за границу контейнера */
  boundaryRadius?: number;
}

export default function PetRewardParticles({
  signal,
  reducedMotion = false,
  fallLimit,
  boundaryRadius,
}: PetRewardParticlesProps) {
  const { t } = useTranslation();
  const particles = useMemo(() => {
    switch (signal.kind) {
      case 'standard':
        return makeParticles(PARTICLE_COUNTS.standard, 40, 150, false, boundaryRadius);
      case 'morning':
        return makeParticles(PARTICLE_COUNTS.morning, 60, 150, true, boundaryRadius);
      case 'combo':
        return makeParticles(PARTICLE_COUNTS.combo, 60, 180, false, boundaryRadius);
      case 'welcome':
        return makeParticles(
          welcomeParticleCount(signal.comebackDays),
          40,
          110,
          true,
          boundaryRadius,
        );
      case 'adventure':
        return makeParticles(PARTICLE_COUNTS.adventure, 45, 120, false, boundaryRadius);
      default:
        return [];
    }
  }, [signal.kind, signal.comebackDays, boundaryRadius]);

  const comboCount = signal.comboCount ?? 0;
  const showComboBadge = comboCount >= 3;

  // Долёт XP до бейджа энергии (⚡ NN) в шапке, если он есть на экране —
  // см. energyPulse.ts. Считаем смещение раз на новый signal.id, до отрисовки
  // (useLayoutEffect), чтобы не было кадра с неверной траекторией. Нет
  // бейджа на этом экране (FloatingCompanion, диалоги, лендинг) — flyOffset
  // остаётся null, и текст плывёт по старому сценарию (вверх и тает).
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [flyOffset, setFlyOffset] = useState<{ dx: number; dy: number } | null>(null);

  useLayoutEffect(() => {
    if (!signal.xpText || reducedMotion || typeof document === 'undefined') {
      setFlyOffset(null);
      return;
    }
    const anchor = anchorRef.current;
    const target = document.querySelector<HTMLElement>('[data-role="pet-energy-badge"]');
    if (!anchor || !target) {
      setFlyOffset(null);
      return;
    }
    const anchorRect = anchor.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    setFlyOffset({
      dx: targetRect.left + targetRect.width / 2 - (anchorRect.left + anchorRect.width / 2),
      dy: targetRect.top + targetRect.height / 2 - (anchorRect.top + anchorRect.height / 2),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal.id, reducedMotion]);

  return (
    <span
      ref={anchorRef}
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 pointer-events-none"
    >
      {/* Плавающий текст награды: долетает до бейджа энергии, если он есть
          на экране, иначе — по-старому вверх и тает. */}
      {signal.xpText &&
        !reducedMotion &&
        (flyOffset ? (
          <motion.span
            className="absolute -translate-x-1/2 -translate-y-1/2 font-extrabold text-base whitespace-nowrap drop-shadow"
            style={{
              color:
                signal.kind === 'welcome' ? ROSE : signal.kind === 'adventure' ? TEAL : XP_GREEN,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
            animate={{
              // Держим текст читаемым у стартовой точки почти весь клип
              // (0–70%) и только в последней трети «засасываем» к бейджу —
              // раньше долёт занимал весь клип целиком, и +N XP мелькал,
              // не успевая прочитаться.
              x: [0, 0, flyOffset.dx * 0.2, flyOffset.dx],
              y: [0, 0, Math.min(flyOffset.dy * 0.2, -10), flyOffset.dy],
              opacity: [0, 1, 1, 0.15],
              scale: [0.6, 1.08, 1, 0.45],
            }}
            transition={{ duration: 1.1, times: [0, 0.18, 0.7, 1], ease: [0.3, 0, 0.4, 1] }}
            onAnimationComplete={() => emitEnergyPulse()}
          >
            {signal.xpText}
            {signal.kind === 'welcome' && ' 💖'}
            {signal.kind === 'adventure' && ' 🎁'}
          </motion.span>
        ) : (
          <motion.span
            className="absolute -translate-x-1/2 -translate-y-1/2 font-extrabold text-base whitespace-nowrap drop-shadow"
            style={{
              color:
                signal.kind === 'welcome' ? ROSE : signal.kind === 'adventure' ? TEAL : XP_GREEN,
            }}
            initial={{ y: 0, opacity: 0, scale: 0.7 }}
            animate={{ y: -64, opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 1.2, delay: 0.05, ease: 'easeOut' }}
          >
            {signal.xpText}
            {signal.kind === 'welcome' && ' 💖'}
            {signal.kind === 'adventure' && ' 🎁'}
          </motion.span>
        ))}

      {/* Подзаголовок «С возвращением!» */}
      {signal.kind === 'welcome' && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap"
          style={{ color: ROSE }}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: -30, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.25, ease: 'easeOut' }}
        >
          {t('companion.petReward.welcome')}
        </motion.span>
      )}

      {/* Подзаголовок «Принёс подарок!» */}
      {signal.kind === 'adventure' && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap"
          style={{ color: TEAL }}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: -30, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.25, ease: 'easeOut' }}
        >
          {t('companion.petReward.adventure')}
        </motion.span>
      )}

      {/* Счётчик комбо */}
      {showComboBadge && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-lg"
          style={{
            background:
              comboCount >= 5 ? 'hsl(var(--accent-strong))' : 'hsl(var(--primary-strong))',
          }}
          initial={{ y: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: -28, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 1.1, delay: 0.05, ease: 'easeOut' }}
        >
          {comboCount >= 5
            ? t('companion.petReward.comboBig', { count: comboCount })
            : t('companion.petReward.combo', { count: comboCount })}
        </motion.span>
      )}

      {/* Волны вечера */}
      {signal.kind === 'evening' &&
        !reducedMotion &&
        Array.from({ length: PARTICLE_COUNTS.eveningWaves }, (_, i) => {
          const waveScale = boundaryRadius ? Math.min(3, boundaryRadius / 17) : 3;
          return (
            <motion.span
              key={`wave-${i}`}
              className="absolute left-0 top-0 rounded-full border-2"
              style={{
                width: 34,
                height: 34,
                borderColor: i % 2 === 0 ? BLUE : SAGE,
              }}
              initial={{ x: -17, y: -17, scale: 0.3, opacity: 0.7 }}
              animate={{ x: -17, y: -17, scale: waveScale, opacity: 0 }}
              transition={{ duration: 1, delay: i * 0.06, ease: 'easeOut' }}
            />
          );
        })}

      {/* Капли → звёзды (эмпатия) */}
      {signal.kind === 'empathy' &&
        !reducedMotion &&
        Array.from({ length: PARTICLE_COUNTS.empathyDrops }, (_, i) => {
          const cap = boundaryRadius ? boundaryRadius - 12 : 90;
          const x = rand(-cap, cap);
          return (
            <span key={`rain-${i}`} className="contents">
              <motion.span
                className="absolute left-0 top-0"
                style={{ color: BLUE }}
                initial={{ x, y: -100, opacity: 0 }}
                animate={{ y: cap, opacity: [0, 1, 1] }}
                transition={{ duration: 0.65, delay: i * 0.05, ease: 'easeIn' }}
              >
                <Droplets className="pet-particle-icon w-5 h-5" />
              </motion.span>
              <motion.span
                className="absolute left-0 top-0"
                style={{ color: GOLD }}
                initial={{ x, y: 56, opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 0.8, 0] }}
                transition={{ duration: 0.55, delay: 0.65 + i * 0.05, ease: 'easeOut' }}
              >
                <Sparkles className="pet-particle-icon w-4 h-4" />
              </motion.span>
            </span>
          );
        })}

      {/* Солнечные зайчики утра (микс: солнце/звёзды в тёплых цветах) */}
      {signal.kind === 'morning' &&
        !reducedMotion &&
        particles.map((p, i) => {
          const { icon: Icon, color } = MORNING_MIX[i % MORNING_MIX.length];
          return (
            <motion.span
              key={`sun-${p.id}`}
              className="pet-particle-icon absolute left-0 top-0"
              style={{ color }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{
                x: [0, p.x * 0.4, p.x],
                y: [0, -46, p.y],
                opacity: [0, 1, 1, 0],
                scale: [0.4, 1.15, 0.85, 0],
                rotate: p.rotate,
              }}
              transition={{ duration: 1.6, delay: p.delay, ease: 'easeOut' }}
            >
              <Icon className="w-5 h-5" />
            </motion.span>
          );
        })}

      {/* Сердечки возвращения (микс: сердца/звёзды) */}
      {signal.kind === 'welcome' &&
        !reducedMotion &&
        particles.map((p, i) => {
          const { icon: Icon, color } = WELCOME_MIX[i % WELCOME_MIX.length];
          return (
            <motion.span
              key={`heart-${p.id}`}
              className="pet-particle-icon absolute left-0 top-0"
              style={{ color }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
              animate={{
                x: p.x,
                y: -Math.abs(p.y) - 70,
                scale: [0.5, 1.15, 0.9, 1.1, 1],
                opacity: [0, 1, 1, 1, 0],
                rotate: p.rotate,
              }}
              transition={{ duration: 1.6, delay: p.delay, ease: 'easeOut' }}
            >
              <Icon className="w-5 h-5" fill="currentColor" />
            </motion.span>
          );
        })}

      {/* Возврат с прогулки: подарок/компас, радиальный залп — не арка welcome */}
      {signal.kind === 'adventure' &&
        !reducedMotion &&
        particles.map((p, i) => {
          const { icon: Icon, color } = ADVENTURE_MIX[i % ADVENTURE_MIX.length];
          const y = fallLimit === undefined ? p.y : Math.min(p.y, fallLimit);
          return (
            <motion.span
              key={`adventure-${p.id}`}
              className="pet-particle-icon absolute left-0 top-0"
              style={{ color }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: p.x,
                y,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.15, 0.9, 1, 0],
                rotate: p.rotate,
              }}
              transition={{ duration: 1, delay: p.delay, ease: 'easeOut' }}
            >
              <Icon className="w-5 h-5" />
            </motion.span>
          );
        })}

      {/* Звёздочки стандартного клика (микс: искры/звёзды/сердца — без повторов) */}
      {signal.kind === 'standard' &&
        !reducedMotion &&
        particles.map((p, i) => {
          const { icon: Icon, color } = STANDARD_MIX[i % STANDARD_MIX.length];
          const y = fallLimit === undefined ? p.y : Math.min(p.y, fallLimit);
          return (
            <motion.span
              key={`star-${p.id}`}
              className="pet-particle-icon absolute left-0 top-0"
              style={{ color }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: p.x,
                y,
                opacity: [0, 1, 1, 0],
                scale: p.scale,
                rotate: p.rotate,
              }}
              transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' }}
            >
              <Icon className="w-5 h-5" />
            </motion.span>
          );
        })}

      {/* Взрыв комбо — самый интенсивный залп, поэтому единственный получает
          шлейф: полупрозрачный «призрак» той же частицы с небольшой задержкой
          и более быстрым угасанием, читается как ощущение скорости. */}
      {signal.kind === 'combo' &&
        !reducedMotion &&
        particles.map((p, i) => {
          const Icon = COMBO_ICONS[i % COMBO_ICONS.length];
          const color = COMBO_COLORS[i % COMBO_COLORS.length];
          const y = fallLimit === undefined ? p.y : Math.min(p.y, fallLimit);
          return (
            <span key={`combo-wrap-${p.id}`} className="contents">
              <motion.span
                aria-hidden="true"
                className="absolute left-0 top-0 rounded-full"
                style={{ width: 7, height: 7, background: color, filter: 'blur(2px)' }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{ x: p.x * 0.85, y: y * 0.85, opacity: [0, 0.45, 0], scale: 0.8 }}
                transition={{ duration: 0.75, delay: p.delay + 0.07, ease: 'easeOut' }}
              />
              <motion.span
                className="pet-particle-icon absolute left-0 top-0"
                style={{ color }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: p.x,
                  y,
                  opacity: [0, 1, 1, 0],
                  scale: p.scale,
                  rotate: rand(-360, 360),
                }}
                transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
              >
                <Icon className="w-5 h-5" />
              </motion.span>
            </span>
          );
        })}
    </span>
  );
}
