import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';

// Tier 1 (см. docs/gamification-phase1-visuals.svg, ряды 2-3): лёгкий
// particle-всплеск для частых событий — клейм миссии, разблокировка ачивки.
// Тот же идиом, что PetRewardParticles.tsx, но без привязки к PetRewardSignal
// и без canvas-confetti (Tier 3 остаётся отдельным, редким эффектом).

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const ICONS = [Sparkles, Star];
const COLORS = [
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary-muted))',
  'hsl(var(--success))',
];

interface ClaimBurstProps {
  /** Инкрементируется при каждом новом всплеске — меняет `key` частиц, чтобы анимация переигралась. */
  triggerKey: number;
  /** Радиус разлёта частиц (px). 28 — клейм миссии, 34 — разблокировка ачивки. */
  radius?: number;
  count?: number;
  reducedMotion?: boolean;
}

export default function ClaimBurst({
  triggerKey,
  radius = 28,
  count = 4,
  reducedMotion = false,
}: ClaimBurstProps) {
  const particles = useMemo(() => {
    if (triggerKey === 0 || reducedMotion) return [];
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + rand(-0.2, 0.2);
      return {
        id: i,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        Icon: ICONS[i % ICONS.length],
        color: COLORS[i % COLORS.length],
        delay: i * 0.03,
      };
    });
  }, [triggerKey, count, radius, reducedMotion]);

  if (particles.length === 0) return null;

  return (
    <span aria-hidden="true" className="absolute left-1/2 top-1/2 pointer-events-none">
      {particles.map((p) => (
        <motion.span
          key={`${triggerKey}-${p.id}`}
          className="absolute left-0 top-0"
          style={{ color: p.color }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: [0, 1, 1, 0], scale: [0, 1, 0.85, 0] }}
          transition={{ duration: 0.6, delay: p.delay, ease: 'easeOut' }}
        >
          <p.Icon className="w-3.5 h-3.5" />
        </motion.span>
      ))}
    </span>
  );
}
