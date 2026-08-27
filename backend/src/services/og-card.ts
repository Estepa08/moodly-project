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

// Два формата поверх одного и того же satori/resvg-пайплайна (Сессия 9,
// three-personas-design-gaps.md): 'og' — классический 1200×630 для
// мессенджеров/соцкраулеров (уже был), 'story' — 1080×1920 (9:16) для
// сохранения/шеринга в Instagram/TikTok Stories через Web Share API с
// файлом. Никакой второй рендер-библиотеки — те же satori()/Resvg, тот же
// шрифт и те же emoji-графемы, отличаются только размеры canvas и React-
// дерево разметки (вертикальная раскладка вместо горизонтальной).
export type StreakCardFormat = 'og' | 'story';

const CARD_DIMENSIONS: Record<StreakCardFormat, { width: number; height: number }> = {
  og: { width: 1200, height: 630 },
  story: { width: 1080, height: 1920 },
};

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
  format?: StreakCardFormat;
}

export function petEmoji(petType: string): string {
  return PET_EMOJI[petType] ?? DEFAULT_PET_EMOJI;
}

const flex = (style: React.CSSProperties, ...children: React.ReactNode[]) =>
  React.createElement('div', { style: { display: 'flex', ...style } }, ...children);

// Горизонтальная раскладка (1200×630) — исходная OG-карточка для превью в
// мессенджерах, без изменений.
function buildOgElement(days: number, emoji: string): React.ReactElement {
  return flex(
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
}

// Вертикальная раскладка (1080×1920, 9:16) — та же информация (логотип,
// питомец, число дней, футер), но centered-in-column для формата
// Instagram/TikTok Stories вместо side-by-side.
function buildStoryElement(days: number, emoji: string): React.ReactElement {
  return flex(
    {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#5C6E4E',
      fontFamily: 'Source Serif 4',
      position: 'relative',
    },
    flex(
      { position: 'absolute', top: 72, alignItems: 'center', gap: 14 },
      React.createElement(
        'span',
        { style: { fontSize: 44, fontWeight: 600, color: '#FFFFFF' } },
        '🦊 Moodly',
      ),
    ),
    flex(
      { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 56 },
      flex(
        {
          width: 380,
          height: 380,
          borderRadius: 190,
          backgroundColor: 'rgba(255,255,255,0.16)',
          border: '6px solid rgba(255,255,255,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 220,
        },
        React.createElement('span', {}, emoji),
      ),
      flex(
        { flexDirection: 'column', alignItems: 'center' },
        React.createElement(
          'span',
          { style: { fontSize: 220, fontWeight: 600, color: '#FFFFFF', lineHeight: 1 } },
          String(days),
        ),
        React.createElement(
          'span',
          {
            style: {
              fontSize: 60,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
              marginTop: 20,
              textAlign: 'center',
            },
          },
          `${pluralDaysLabel(days)} 🔥`,
        ),
      ),
    ),
    flex(
      { position: 'absolute', bottom: 72 },
      React.createElement(
        'span',
        { style: { fontSize: 38, fontWeight: 600, color: 'rgba(255,255,255,0.85)' } },
        'mymoodly.ru',
      ),
    ),
  );
}

export async function renderStreakCardPng({
  days,
  petType,
  format = 'og',
}: StreakCardParams): Promise<Buffer> {
  await ensureWasm();
  const font = loadFont();
  const emoji = petEmoji(petType);
  const { width, height } = CARD_DIMENSIONS[format];

  const element = format === 'story' ? buildStoryElement(days, emoji) : buildOgElement(days, emoji);

  const svg = await satori(element, {
    width,
    height,
    fonts: [{ name: 'Source Serif 4', data: font, weight: 600, style: 'normal' }],
    graphemeImages: loadGraphemeImages(),
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}
