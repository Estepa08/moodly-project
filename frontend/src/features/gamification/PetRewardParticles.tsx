import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkle, Star, Heart, Sun, Flower, CloudRain } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PetRewardSignal } from "./petRewards";

// Компонент «частиц награды»: рендерит уникальную анимацию для каждого типа
// клика по компаньону (см. docs/companion-gamified-rewards.svg). Частицы
// вылетают из центра аватара (точка (0,0) — центр).

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const GOLD = "#F5A623";
const SUN = "#FF9F0A";
const PINK = "#E0509C";
const BLUE = "#5E8FD8";
const PURPLE = "#8F5ED8";
const COMBO_COLORS = ["#7B5BF2", "#D63A85", "#F5A623", "#4CC38A", "#5E8FD8", "#8F5ED8"];
const COMBO_ICONS: Array<typeof Sparkle> = [Sparkle, Star, Heart, Flower, Sun];

// Микс-пулы «иконка + цвет»: внутри одного залпа частицы не повторяются,
// чтобы не было 3-5 одинаковых иконок одновременно.
const STANDARD_MIX: Array<{ icon: typeof Sparkle; color: string }> = [
  { icon: Sparkle, color: GOLD },
  { icon: Star, color: PINK },
  { icon: Heart, color: PURPLE },
];
const MORNING_MIX: Array<{ icon: typeof Sparkle; color: string }> = [
  { icon: Sun, color: SUN },
  { icon: Sparkle, color: GOLD },
  { icon: Star, color: "#F2A71B" },
  { icon: Sun, color: "#FFC53D" },
  { icon: Sparkle, color: "#F0803C" },
];
const WELCOME_MIX: Array<{ icon: typeof Sparkle; color: string }> = [
  { icon: Heart, color: PINK },
  { icon: Sparkle, color: PURPLE },
  { icon: Star, color: GOLD },
  { icon: Heart, color: "#D63A85" },
  { icon: Sparkle, color: "#B26AE8" },
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
function makeParticles(count: number, minDist: number, maxDist: number, arcUp = false): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const start = arcUp ? Math.PI * 0.12 : 0;
    const span = arcUp ? Math.PI * 0.76 : Math.PI * 2;
    const angle = start + (span * i) / count + rand(-0.14, 0.14);
    const dist =
      minDist +
      ((maxDist - minDist) * i) / Math.max(1, count - 1) +
      rand(-Math.min(10, (maxDist - minDist) * 0.25), Math.min(10, (maxDist - minDist) * 0.25));
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      scale: rand(0.6, 1.25),
      rotate: rand(-60, 60),
      delay: i * 0.03,
    };
  });
}

interface PetRewardParticlesProps {
  signal: PetRewardSignal;
  reducedMotion?: boolean;
}

export default function PetRewardParticles({
  signal,
  reducedMotion = false,
}: PetRewardParticlesProps) {
  const { t } = useTranslation();
  const particles = useMemo(() => {
    switch (signal.kind) {
      case "standard":
        return makeParticles(PARTICLE_COUNTS.standard, 40, 150);
      case "morning":
        return makeParticles(PARTICLE_COUNTS.morning, 60, 150, true);
      case "combo":
        return makeParticles(PARTICLE_COUNTS.combo, 60, 180);
      case "welcome":
        return makeParticles(PARTICLE_COUNTS.welcome, 40, 110, true);
      default:
        return [];
    }
  }, [signal.kind]);

  const comboCount = signal.comboCount ?? 0;
  const showComboBadge = comboCount >= 3;

  return (
    <span aria-hidden="true" className="absolute left-1/2 top-1/2 pointer-events-none">
      {/* Плавающий текст награды */}
      {signal.xpText && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 font-extrabold text-base whitespace-nowrap drop-shadow"
          style={{ color: signal.kind === "welcome" ? PINK : GOLD }}
          initial={{ y: 0, opacity: 0, scale: 0.7 }}
          animate={{ y: -64, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 1.2, delay: 0.05, ease: "easeOut" }}
        >
          {signal.xpText}
          {signal.kind === "welcome" && " 💖"}
        </motion.span>
      )}

      {/* Подзаголовок «С возвращением!» */}
      {signal.kind === "welcome" && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-bold whitespace-nowrap text-pink-500"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: -30, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.25, ease: "easeOut" }}
        >
          {t("companion.petReward.welcome")}
        </motion.span>
      )}

      {/* Счётчик комбо */}
      {showComboBadge && !reducedMotion && (
        <motion.span
          className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-lg"
          style={{
            background:
              comboCount >= 5
                ? "linear-gradient(90deg, #7B5BF2, #D63A85)"
                : "linear-gradient(90deg, #B26AE8, #7B5BF2)",
          }}
          initial={{ y: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: -28, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 1.1, delay: 0.05, ease: "easeOut" }}
        >
          {comboCount >= 5
            ? t("companion.petReward.comboBig", { count: comboCount })
            : t("companion.petReward.combo", { count: comboCount })}
        </motion.span>
      )}

      {/* Волны вечера */}
      {signal.kind === "evening" &&
        !reducedMotion &&
        Array.from({ length: PARTICLE_COUNTS.eveningWaves }, (_, i) => (
          <motion.span
            key={`wave-${i}`}
            className="absolute left-0 top-0 rounded-full border-2"
            style={{
              width: 34,
              height: 34,
              borderColor: i % 2 === 0 ? BLUE : PURPLE,
            }}
            initial={{ x: -17, y: -17, scale: 0.3, opacity: 0.7 }}
            animate={{ x: -17, y: -17, scale: 3, opacity: 0 }}
            transition={{ duration: 1, delay: i * 0.06, ease: "easeOut" }}
          />
        ))}

      {/* Капли → звёзды (эмпатия) */}
      {signal.kind === "empathy" &&
        !reducedMotion &&
        Array.from({ length: PARTICLE_COUNTS.empathyDrops }, (_, i) => {
          const x = rand(-90, 90);
          return (
            <span key={`rain-${i}`} className="contents">
              <motion.span
                className="absolute left-0 top-0"
                style={{ color: BLUE }}
                initial={{ x, y: -100, opacity: 0 }}
                animate={{ y: 56, opacity: [0, 1, 1] }}
                transition={{ duration: 0.65, delay: i * 0.05, ease: "easeIn" }}
              >
                <CloudRain className="w-4 h-4" />
              </motion.span>
              <motion.span
                className="absolute left-0 top-0"
                style={{ color: GOLD }}
                initial={{ x, y: 56, opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 0.8, 0] }}
                transition={{ duration: 0.55, delay: 0.65 + i * 0.05, ease: "easeOut" }}
              >
                <Sparkle className="w-3 h-3" />
              </motion.span>
            </span>
          );
        })}

      {/* Солнечные зайчики утра (микс: солнце/звёзды в тёплых цветах) */}
      {signal.kind === "morning" &&
        !reducedMotion &&
        particles.map((p, i) => {
          const { icon: Icon, color } = MORNING_MIX[i % MORNING_MIX.length];
          return (
            <motion.span
              key={`sun-${p.id}`}
              className="absolute left-0 top-0"
              style={{ color, filter: "drop-shadow(0 0 6px rgba(255, 159, 10, 0.45))" }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
              animate={{
                x: [0, p.x * 0.4, p.x],
                y: [0, -46, p.y],
                opacity: [0, 1, 1, 0],
                scale: [0.4, 1.15, 0.85, 0],
                rotate: p.rotate,
              }}
              transition={{ duration: 1.6, delay: p.delay, ease: "easeOut" }}
            >
              <Icon className="w-5 h-5" />
            </motion.span>
          );
        })}

      {/* Сердечки возвращения (микс: сердца/звёзды) */}
      {signal.kind === "welcome" &&
        !reducedMotion &&
        particles.map((p, i) => {
          const { icon: Icon, color } = WELCOME_MIX[i % WELCOME_MIX.length];
          return (
            <motion.span
              key={`heart-${p.id}`}
              className="absolute left-0 top-0"
              style={{ color, filter: "drop-shadow(0 0 5px rgba(224, 80, 156, 0.45))" }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
              animate={{
                x: p.x,
                y: -Math.abs(p.y) - 70,
                scale: [0.5, 1.15, 0.9, 1.1, 1],
                opacity: [0, 1, 1, 1, 0],
                rotate: p.rotate,
              }}
              transition={{ duration: 1.6, delay: p.delay, ease: "easeOut" }}
            >
              <Icon className="w-4 h-4" fill="currentColor" />
            </motion.span>
          );
        })}

      {/* Звёздочки стандартного клика (микс: искры/звёзды/сердца — без повторов) */}
      {signal.kind === "standard" &&
        !reducedMotion &&
        particles.map((p, i) => {
          const { icon: Icon, color } = STANDARD_MIX[i % STANDARD_MIX.length];
          return (
            <motion.span
              key={`star-${p.id}`}
              className="absolute left-0 top-0"
              style={{ color }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [0, 1, 1, 0],
                scale: p.scale,
                rotate: p.rotate,
              }}
              transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
            >
              <Icon className="w-4 h-4" />
            </motion.span>
          );
        })}

      {/* Взрыв комбо */}
      {signal.kind === "combo" &&
        !reducedMotion &&
        particles.map((p, i) => {
          const Icon = COMBO_ICONS[i % COMBO_ICONS.length];
          return (
            <motion.span
              key={`combo-${p.id}`}
              className="absolute left-0 top-0"
              style={{ color: COMBO_COLORS[i % COMBO_COLORS.length] }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: [0, 1, 1, 0],
                scale: p.scale,
                rotate: rand(-360, 360),
              }}
              transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
            >
              <Icon className="w-5 h-5" />
            </motion.span>
          );
        })}
    </span>
  );
}
