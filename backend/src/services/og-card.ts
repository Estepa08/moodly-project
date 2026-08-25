import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import React from 'react';
import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

// Карточка для соцсетей/мессенджеров при шеринге вехи стрика (см.
// docs/gamification-og-card-visuals.svg). satori строит React-дерево → SVG,
// @resvg/resvg-wasm — SVG → PNG. Намеренно WASM, а не нативный resvg-js:
// сборка бэкенда идёт на node:22-bookworm-slim (glibc), рантайм — на
// node:22-alpine (musl), нативный биндинг, установленный на этапе сборки,
// не загрузился бы в рантайме. WASM работает одинаково в обоих случаях.
//
// Карточка не содержит персональных данных (ни имени питомца, ни имени
// пользователя) — только число дней и species-эмодзи компаньона: эндпоинт
// публичный, без авторизации (соцкраулеры не присылают токен).

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

// Дублирует PET_META.emoji из frontend/src/features/gamification/pets.ts —
// сознательно: там это часть UI-конфига (labelKey/color/feed), тут нужен
// только маппинг type → emoji для рендера картинки на бэкенде.
const PET_EMOJI: Record<string, string> = {
  puff: '🦐',
  sloth: '🦥',
  fox: '🦊',
  giraffe: '🦒',
  dove: '🕊️',
  tiger: '🐯',
  turtle: '🐢',
  monkey: '🐒',
  bull: '🐂',
  koala: '🐨',
  cow: '🐮',
  robot: '🤖',
  robot2: '🦾',
  salad: '🥗',
  tucan: '🐦',
  liza: '👧',
  nastya: '🧒',
  ksyusha: '👧🏻',
  marina: '👩',
  alisa: '👩🏻',
  sofya: '👩🏼',
  vera: '👩🏽',
  nika: '👩🏾',
  mila: '👩🏿',
  lev: '👨',
  mark: '👨🏻',
  timur: '👨🏼',
  girl: '👩',
  girl2: '👩🏻',
  girl3: '👩🏼',
  rabbit: '🐰',
  monk: '🧘',
  man: '👨🏽',
  man2: '👨🏾',
  panda: '🐼',
  robot3: '🤖',
};
const DEFAULT_PET_EMOJI = '🐾';

let wasmReady: Promise<void> | null = null;
function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    const wasmPath = fileURLToPath(import.meta.resolve('@resvg/resvg-wasm/index_bg.wasm'));
    wasmReady = initWasm(readFileSync(wasmPath));
  }
  return wasmReady;
}

let fontDataCache: Buffer | null = null;
function loadFont(): Buffer {
  if (!fontDataCache) {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const fontPath = path.resolve(moduleDir, '../../assets/fonts/SourceSerif4-600.ttf');
    fontDataCache = readFileSync(fontPath);
  }
  return fontDataCache;
}

// Source Serif 4 — текстовый шрифт без emoji-глифов, satori без доп.
// настройки рендерит эмодзи как пустые квадраты. graphemeImages подставляет
// вместо каждого эмодзи локальный PNG (Twemoji, предзагружен один раз в
// assets/emoji/ — не идёт в сеть в рантайме, только читает файлы с диска).
let graphemeImagesCache: Record<string, string> | null = null;
function loadGraphemeImages(): Record<string, string> {
  if (!graphemeImagesCache) {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const emojiDir = path.resolve(moduleDir, '../../assets/emoji');
    const manifest = JSON.parse(
      readFileSync(path.join(emojiDir, 'manifest.json'), 'utf-8'),
    ) as Record<string, string>;
    const images: Record<string, string> = {};
    for (const [emoji, filename] of Object.entries(manifest)) {
      const bytes = readFileSync(path.join(emojiDir, filename));
      images[emoji] = `data:image/png;base64,${bytes.toString('base64')}`;
    }
    graphemeImagesCache = images;
  }
  return graphemeImagesCache;
}

export function pluralDaysLabel(days: number): string {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) return `${days} день подряд`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${days} дня подряд`;
  return `${days} дней подряд`;
}

export interface StreakCardParams {
  days: number;
  petType: string;
}

export function petEmoji(petType: string): string {
  return PET_EMOJI[petType] ?? DEFAULT_PET_EMOJI;
}

export async function renderStreakCardPng({ days, petType }: StreakCardParams): Promise<Buffer> {
  await ensureWasm();
  const font = loadFont();
  const emoji = petEmoji(petType);

  const flex = (style: React.CSSProperties, ...children: React.ReactNode[]) =>
    React.createElement('div', { style: { display: 'flex', ...style } }, ...children);

  const element = flex(
    {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      backgroundColor: '#5C6E4E',
      fontFamily: 'Source Serif 4',
      position: 'relative',
    },
    flex(
      { position: 'absolute', top: 40, left: 48, alignItems: 'center', gap: 10 },
      React.createElement(
        'span',
        { style: { fontSize: 32, fontWeight: 600, color: '#FFFFFF' } },
        '🦊 Moodly',
      ),
    ),
    flex(
      { flex: 1, alignItems: 'center', paddingLeft: 96, paddingRight: 96, gap: 64 },
      flex(
        {
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: 'rgba(255,255,255,0.16)',
          border: '4px solid rgba(255,255,255,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 150,
        },
        React.createElement('span', {}, emoji),
      ),
      flex(
        { flexDirection: 'column' },
        React.createElement(
          'span',
          { style: { fontSize: 176, fontWeight: 600, color: '#FFFFFF', lineHeight: 1 } },
          String(days),
        ),
        React.createElement(
          'span',
          {
            style: {
              fontSize: 48,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
              marginTop: 12,
            },
          },
          `${pluralDaysLabel(days)} 🔥`,
        ),
      ),
    ),
    flex(
      { position: 'absolute', bottom: 40, left: 48 },
      React.createElement(
        'span',
        { style: { fontSize: 30, fontWeight: 600, color: 'rgba(255,255,255,0.85)' } },
        'mymoodly.ru',
      ),
    ),
  );

  const svg = await satori(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [{ name: 'Source Serif 4', data: font, weight: 600, style: 'normal' }],
    graphemeImages: loadGraphemeImages(),
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}
