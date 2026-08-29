import { CloudSnow, Droplet, Flower2, Leaf, Snowflake, Sparkle, Sprout, Wind } from 'lucide-react';
import type { ComponentType, CSSProperties } from 'react';
import type { Season } from '../../lib/season';

type ParticleIconComponent = ComponentType<{
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

export interface SeasonParticleVariant {
  icon: ParticleIconComponent;
  /** Переиспользуемый тон компаньона (--pet-N), не новый цветовой бюджет —
   *  см. подбор в артефакте дизайн-системы «Времена года». */
  colorVar: string;
}

/** Один слой глубины — как в Apple Weather: дальний план мельче, тусклее,
 *  чуть расфокусирован и едет медленнее; ближний — чёткий, крупнее, живее.
 *  Разница в скорости и есть параллакс, никакой имитации капли не нужно. */
export interface SeasonParticleLayer {
  count: number;
  sizeRangePx: [number, number];
  durationRangeS: [number, number];
  swayAmplitudePx: number;
  opacity: number;
  blurPx: number;
  rotate: boolean;
}

export interface SeasonParticleConfig {
  /** Ровно 2 иконки-референса на сезон, частицы чередуют их через одну. */
  variants: [SeasonParticleVariant, SeasonParticleVariant];
  /** [дальний слой, ближний слой] */
  layers: [SeasonParticleLayer, SeasonParticleLayer];
}

export const SEASON_PARTICLE_CONFIG: Record<Season, SeasonParticleConfig> = {
  spring: {
    variants: [
      { icon: Flower2, colorVar: 'pet-2' },
      { icon: Sprout, colorVar: 'pet-4' },
    ],
    layers: [
      {
        count: 10,
        sizeRangePx: [9, 13],
        durationRangeS: [17, 23],
        swayAmplitudePx: 30,
        opacity: 0.32,
        blurPx: 1.2,
        rotate: true,
      },
      {
        count: 8,
        sizeRangePx: [17, 25],
        durationRangeS: [9, 13],
        swayAmplitudePx: 45,
        opacity: 0.7,
        blurPx: 0,
        rotate: true,
      },
    ],
  },
  summer: {
    // Ничего физически не «падает» летом — оба слоя сильно замедлены
    // (durationRangeS), чтобы читаться как дрейф, а не падение.
    variants: [
      { icon: Sparkle, colorVar: 'pet-7' },
      { icon: Droplet, colorVar: 'pet-3' },
    ],
    layers: [
      {
        count: 8,
        sizeRangePx: [7, 11],
        durationRangeS: [27, 35],
        swayAmplitudePx: 40,
        opacity: 0.28,
        blurPx: 1.4,
        rotate: false,
      },
      {
        count: 7,
        sizeRangePx: [13, 20],
        durationRangeS: [17, 23],
        swayAmplitudePx: 60,
        opacity: 0.65,
        blurPx: 0,
        rotate: false,
      },
    ],
  },
  autumn: {
    variants: [
      { icon: Leaf, colorVar: 'pet-9' },
      { icon: Wind, colorVar: 'pet-15' },
    ],
    layers: [
      {
        count: 10,
        sizeRangePx: [9, 13],
        durationRangeS: [14, 19],
        swayAmplitudePx: 45,
        opacity: 0.32,
        blurPx: 1.3,
        rotate: true,
      },
      {
        count: 9,
        sizeRangePx: [17, 25],
        durationRangeS: [7, 11],
        swayAmplitudePx: 75,
        opacity: 0.75,
        blurPx: 0,
        rotate: true,
      },
    ],
  },
  winter: {
    variants: [
      { icon: Snowflake, colorVar: 'pet-5' },
      { icon: CloudSnow, colorVar: 'pet-8' },
    ],
    layers: [
      {
        count: 12,
        sizeRangePx: [5, 8],
        durationRangeS: [19, 27],
        swayAmplitudePx: 20,
        opacity: 0.32,
        blurPx: 1.2,
        rotate: true,
      },
      {
        count: 9,
        sizeRangePx: [10, 16],
        durationRangeS: [10, 15],
        swayAmplitudePx: 30,
        opacity: 0.75,
        blurPx: 0,
        rotate: true,
      },
    ],
  },
};
