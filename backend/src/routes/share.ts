import type { FastifyInstance } from 'fastify';
import { AppError } from '../lib/errors.js';
import {
  renderStreakCardPng,
  pluralDaysLabel,
  type StreakCardFormat,
} from '../services/og-card.js';

// Публичные, неавторизованные роуты для rich-preview карточек при шеринге
// (см. docs/gamification-og-card-visuals.svg) — соцкраулеры (Telegram/VK/
// WhatsApp) не присылают токен, поэтому эти два эндпоинта не проходят через
// fastify.authenticate. Единственное исключение из правила «этот бэкенд
// отдаёт только JSON» (см. комментарий у регистрации @fastify/helmet в
// index.ts) — намеренно, отключают helmet точечно только тут.

const MAX_DAYS = 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function parseDays(raw: unknown): number | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number.parseInt(raw, 10);
  if (n <= 0 || n > MAX_DAYS) return null;
  return n;
}

function parsePetType(raw: unknown): string {
  return typeof raw === 'string' && raw.length > 0 && raw.length <= 40 ? raw : 'fox';
}

// Сессия 9 (three-personas-design-gaps.md): вертикальный 9:16-вариант той же
// карточки для сохранения/шеринга в Stories, поверх того же satori/resvg-
// пайплайна (services/og-card.ts) — см. комментарий там. 'og' остаётся
// дефолтом, чтобы существующие ссылки/кэш мессенджеров не менялись.
function parseFormat(raw: unknown): StreakCardFormat {
  return raw === 'story' ? 'story' : 'og';
}

const CARD_DIMS: Record<StreakCardFormat, { width: number; height: number }> = {
  og: { width: 1200, height: 630 },
  story: { width: 1080, height: 1920 },
};

// Экранируем всё, что попадает в разметку, даже уже провалидированные поля —
// вторым рубежом на случай, если валидация выше когда-нибудь ослабнет.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSharePage(params: {
  title: string;
  imageUrl: string;
  pageUrl: string;
  format: StreakCardFormat;
}): string {
  const description =
    'Дневник настроения, который заботится о вас: отмечайте состояние, практикуйте техники, растите компаньона.';
  const title = escapeHtml(params.title);
  const imageUrl = escapeHtml(params.imageUrl);
  const pageUrl = escapeHtml(params.pageUrl);
  const { width, height } = CARD_DIMS[params.format];
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Moodly</title>
<meta name="description" content="${description}">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Moodly">
<meta property="og:title" content="${title} — Moodly">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="${width}">
<meta property="og:image:height" content="${height}">
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} — Moodly">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">
<style>
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; font-family:-apple-system,'Segoe UI',Roboto,sans-serif; background:#5C6E4E; color:#fff; text-align:center; padding:24px; box-sizing:border-box; }
  img { max-width:min(560px,90vw); border-radius:10px; box-shadow:0 12px 30px rgba(0,0,0,0.25); }
  a { display:inline-block; margin-top:8px; padding:12px 28px; border-radius:8px; background:#fff; color:#5C6E4E; font-weight:600; text-decoration:none; }
</style>
</head>
<body>
  <img src="${imageUrl}" alt="${title}">
  <a href="${FRONTEND_URL}/">Открыть Moodly →</a>
</body>
</html>`;
}

export default async function shareRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { days?: string; pet?: string; format?: string } }>(
    '/share/streak',
    { helmet: false },
    async (request, reply) => {
      const days = parseDays(request.query.days);
      if (days === null) {
        throw new AppError('VALIDATION_ERROR', 400, 'days must be a positive integer');
      }
      const petType = parsePetType(request.query.pet);
      const format = parseFormat(request.query.format);
      const formatQuery = format === 'story' ? '&format=story' : '';
      // Не берём base из request.protocol/headers.host — Host управляется
      // клиентом и раньше подставлялся в HTML, который кэшируется на час
      // (см. аудит). /api/* всегда проксируется на бэкенд с того же
      // публичного домена, что и FRONTEND_URL (см. infra/Caddyfile).
      const imageUrl = `${FRONTEND_URL}/api/share/streak/card.png?days=${days}&pet=${encodeURIComponent(petType)}${formatQuery}`;
      const pageUrl = `${FRONTEND_URL}/api/share/streak?days=${days}&pet=${encodeURIComponent(petType)}${formatQuery}`;

      reply.type('text/html; charset=utf-8');
      reply.header('Cache-Control', 'public, max-age=3600');
      return renderSharePage({ title: pluralDaysLabel(days), imageUrl, pageUrl, format });
    },
  );

  fastify.get<{ Querystring: { days?: string; pet?: string; format?: string } }>(
    '/share/streak/card.png',
    { helmet: false },
    async (request, reply) => {
      const days = parseDays(request.query.days);
      if (days === null) {
        throw new AppError('VALIDATION_ERROR', 400, 'days must be a positive integer');
      }
      const petType = parsePetType(request.query.pet);
      const format = parseFormat(request.query.format);
      const png = await renderStreakCardPng({ days, petType, format });

      reply.type('image/png');
      // Полностью детерминировано по query-параметрам — можно кэшировать
      // агрессивно и надолго (мессенджеры часто перезапрашивают og:image).
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      return reply.send(png);
    },
  );
}
