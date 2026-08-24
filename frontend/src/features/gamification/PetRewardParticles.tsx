import { useMemo } from 'react';
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PetRewardSignal } from './petRewards';

// Компонент «частиц награды»: рендерит уникальную анимацию для каждого типа
// клика по компаньону (см. docs/companion-gamified-rewards.svg). Частицы
// вылетают из центра аватара (точка (0,0) — центр).

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const GOLD = '#F5A623';
const SUN = '#FF9F0A';
const PINK = '#E0509C';
const BLUE = '#5E8FD8';
const PURPLE = '#8F5ED8';
const XP_GREEN = '#22C55E';
const COMBO_COLORS = ['#7B5BF2', '#D63A85', '#F5A623', '#4CC38A', '#5E8FD8', '#8F5ED8'];
const COMBO_ICONS: Array<typeof Sparkles> = [Sparkles, Star, Heart, Trophy, Sun];

// Микс-пулы «иконка + цвет»: внутри одного залпа частицы не повторяются,
// чтобы не было 3-5 одинаковых иконок одновременно.
const STANDARD_MIX: Array<{ icon: typeof Sparkles; color: string }> = [
  { icon: Sparkles, color: GOLD },
  { icon: Trophy, color: PINK },
  { icon: ThumbsUp, color: PURPLE },
];
const MORNING_MIX: Array<{ icon: typeof Sparkles; color: string }> = [
  { icon: Sunrise, color: SUN },
  { icon: Sparkles, color: GOLD },
  { icon: Star, color: '#F2A71B' },
  { icon: SunMedium, color: '#FFC53D' },
  { icon: Sparkles, color: '#F0803C' },
];
const WELCOME_MIX: Array<{ icon: typeof Sparkles; color: string }> = [
  { icon: HeartHandshake, color: PINK },
  { icon: Sparkles, color: PURPLE },
  { icon: Star, color: GOLD },
  { icon: Heart, color: '#D63A85' },
  { icon: Gem, color: '#B26AE8' },
];

// Фиксированные количества частиц (ровно, без случайных диапазонов — без перебора).
const PARTICLE_COUNTS = {
  standard: 3, // +1 XP, золотые звёздочки
  morning: 5, // «Бодрое утро», солнечные зайчики
  combo: 8, // «Комбо», взрыв искр
  welcome: 5, // «Возвращение», сердечки
  eveningWaves: 5, // волны вечера
  empathyDrops: 4, // капли → звёзды
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
      default:
        return [];
    }
  }, [signal.kind, signal.comebackDays, boundaryRadius]);

  const comboCount = signal.comboCount ?? 0;
  const showComboBadge = comboCount >= 3;

  return (
    <span aria-hidden="true" className="absolute left-1/2 top-1/2 pointer-events-none">
      {/* Плавающий текст награды */}
      {signal.xpText && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 font-extrabold text-base whitespace-nowrap drop-shadow"
          style={{ color: signal.kind === 'welcome' ? PINK : XP_GREEN }}
          initial={{ y: 0, opacity: 0, scale: 0.7 }}
          animate={{ y: -64, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 1.2, delay: 0.05, ease: 'easeOut' }}
        >
          {signal.xpText}
          {signal.kind === 'welcome' && ' 💖'}
        </motion.span>
      )}

      {/* Подзаголовок «С возвращением!» */}
      {signal.kind === 'welcome' && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap text-pink-500"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: -30, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.25, ease: 'easeOut' }}
        >
          {t('companion.petReward.welcome')}
        </motion.span>
      )}

      {/* Счётчик комбо */}
      {showComboBadge && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-lg"
          style={{
            background:
              comboCount >= 5
                ? 'linear-gradient(90deg, #7B5BF2, #D63A85)'
                : 'linear-gradient(90deg, #B26AE8, #7B5BF2)',
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
                borderColor: i % 2 === 0 ? BLUE : PURPLE,
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

      {/* Взрыв комбо */}
      {signal.kind === 'combo' &&
        !reducedMotion &&
        particles.map((p, i) => {
          const Icon = COMBO_ICONS[i % COMBO_ICONS.length];
          const y = fallLimit === undefined ? p.y : Math.min(p.y, fallLimit);
          return (
            <motion.span
              key={`combo-${p.id}`}
              className="pet-particle-icon absolute left-0 top-0"
              style={{ color: COMBO_COLORS[i % COMBO_COLORS.length] }}
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
          );
        })}
    </span>
  );
}
