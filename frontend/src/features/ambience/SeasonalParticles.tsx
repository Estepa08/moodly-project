import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getCurrentSeason } from '../../lib/season';
import { SEASON_PARTICLE_CONFIG, type SeasonParticleLayer } from './seasonParticleConfig';
import {
  isSeasonalParticlesHidden,
  subscribeSeasonalParticlesVisibility,
} from './seasonalParticlesVisibility';

// Фоновый слой сезонных частиц (лепестки/капли/листья/снег) — «Времена
// года». Летают ЗА контентом, не поверх: сам слой — fixed, z-index:auto
// (position:fixed без явного z-index — это «positioned, tier z:auto» в
// stacking order, ниже обычных статических блоков вроде <main>/карточек он
// не окажется сам по себе). Чтобы реальный UI (Sidebar, шапка/main/карточки
// внутри content-column) визуально перекрывал частицы, оба контейнера в
// Layout.tsx получили `relative z-0` — явный (не auto) z-index на
// position-элементе создаёт у каждого свой stacking context, который
// «упаковывает» все свои дети (включая обычные статичные карточки) в один
// блок, красящийся выше частиц.
//
// «Стекло» — не имитация капли (пробовали, не читалось), а параллакс-глубина
// по образцу Apple Weather: дальний план мельче/тусклее/чуть расфокусирован
// и едет медленно, ближний — чёткий и живее. Разница в скорости и резкости
// сама продаёт ощущение «смотришь сквозь окно на объёмную сцену», без
// эффектов на самой иконке.

interface ParticleSpec {
  id: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  rotate: number;
  opacity: number;
  blurPx: number;
  color: string;
  Icon: (typeof SEASON_PARTICLE_CONFIG)['spring']['variants'][number]['icon'];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildLayer(
  layer: SeasonParticleLayer,
  variants: SeasonParticleConfigVariants,
  prefix: string,
): ParticleSpec[] {
  const [minSize, maxSize] = layer.sizeRangePx;
  const [minDuration, maxDuration] = layer.durationRangeS;
  return Array.from({ length: layer.count }, (_, i) => {
    const variant = variants[i % variants.length];
    return {
      id: `${prefix}-${i}`,
      left: rand(0, 100),
      size: rand(minSize, maxSize),
      duration: rand(minDuration, maxDuration),
      // Разброс задержки до длительности цикла — иначе все частицы стартуют
      // одновременно единым «залпом» вместо непрерывного дрейфа.
      delay: -rand(0, maxDuration),
      sway: rand(-layer.swayAmplitudePx, layer.swayAmplitudePx),
      rotate: layer.rotate ? rand(-180, 180) : 0,
      opacity: layer.opacity,
      blurPx: layer.blurPx,
      color: variant.colorVar,
      Icon: variant.icon,
    };
  });
}

type SeasonParticleConfigVariants = (typeof SEASON_PARTICLE_CONFIG)['spring']['variants'];

export default function SeasonalParticles() {
  const isReducedMotion = useReducedMotion();
  const [hidden, setHidden] = useState(isSeasonalParticlesHidden);

  useEffect(
    () => subscribeSeasonalParticlesVisibility(() => setHidden(isSeasonalParticlesHidden())),
    [],
  );

  const season = useMemo(() => getCurrentSeason(), []);
  const config = SEASON_PARTICLE_CONFIG[season];

  const particles = useMemo<ParticleSpec[]>(() => {
    const [far, near] = config.layers;
    // Дальний слой рендерится первым — в общем DOM-порядке той же fixed-
    // обёртки это даёт ближнему слою paint order выше при пересечении.
    return [
      ...buildLayer(far, config.variants, 'far'),
      ...buildLayer(near, config.variants, 'near'),
    ];
  }, [config]);

  if (isReducedMotion || hidden) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-season-drift"
          style={
            {
              left: `${p.left}%`,
              '--duration': `${p.duration}s`,
              '--delay': `${p.delay}s`,
              '--sway': `${p.sway}px`,
              '--rot': `${p.rotate}deg`,
            } as CSSProperties
          }
        >
          <p.Icon
            aria-hidden="true"
            style={{
              width: p.size,
              height: p.size,
              color: `hsl(var(--${p.color}))`,
              opacity: p.opacity,
              filter: p.blurPx > 0 ? `blur(${p.blurPx}px)` : undefined,
            }}
          />
        </span>
      ))}
    </div>
  );
}
