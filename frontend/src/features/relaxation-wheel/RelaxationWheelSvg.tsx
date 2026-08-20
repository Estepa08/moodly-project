import { motion } from 'framer-motion';
import { describeWedge } from './wheelMath';

// Один основной цвет проекта (--primary), различные сегменты — за счёт прозрачности,
// а не смены цвета: спокойное лавандовое колесо вместо пёстрой радуги chart-палитры.
const SEGMENT_OPACITIES = [1, 0.55, 0.78, 0.4, 0.9, 0.62];
const SEGMENT_COLORS = SEGMENT_OPACITIES.map((o) => `hsl(var(--primary) / ${o})`);

interface RelaxationWheelSvgProps {
  itemCount: number;
  rotation: number;
  /** Секунды; 0 — мгновенно, без анимации. */
  transitionDuration: number;
  size?: number;
}

export default function RelaxationWheelSvg({
  itemCount,
  rotation,
  transitionDuration,
  size = 240,
}: RelaxationWheelSvgProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const segmentAngle = itemCount > 0 ? 360 / itemCount : 360;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        aria-hidden="true"
        className="absolute left-1/2 -top-1 -translate-x-1/2 z-10 w-0 h-0"
        style={{
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '15px solid hsl(var(--accent))',
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shadow-clay-lg rounded-full"
        aria-hidden="true"
      >
        <motion.g
          style={{ originX: '50%', originY: '50%' }}
          animate={{ rotate: rotation }}
          transition={{ duration: transitionDuration, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          {itemCount === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="hsl(var(--muted))" />
          ) : (
            Array.from({ length: itemCount }).map((_, i) => (
              <path
                key={i}
                d={describeWedge(cx, cy, r, i * segmentAngle, (i + 1) * segmentAngle)}
                fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            ))
          )}
        </motion.g>
      </svg>
    </div>
  );
}
