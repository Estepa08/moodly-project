import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../test/helpers.js';
import type { FastifyInstance } from 'fastify';
import { pluralDaysLabel } from '../../services/og-card.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe('pluralDaysLabel', () => {
  it('1 → «день»', () => {
    expect(pluralDaysLabel(1)).toBe('1 день подряд');
  });

  it('21 → «день» (mod10=1, mod100 не 11)', () => {
    expect(pluralDaysLabel(21)).toBe('21 день подряд');
  });

  it('2-4 → «дня»', () => {
    expect(pluralDaysLabel(3)).toBe('3 дня подряд');
    expect(pluralDaysLabel(22)).toBe('22 дня подряд');
  });

  it('11-14 → «дней» (исключение из общего mod10 правила)', () => {
    expect(pluralDaysLabel(11)).toBe('11 дней подряд');
    expect(pluralDaysLabel(12)).toBe('12 дней подряд');
    expect(pluralDaysLabel(14)).toBe('14 дней подряд');
  });

  it('0, 5-20, 25-30, 100 → «дней»', () => {
    expect(pluralDaysLabel(7)).toBe('7 дней подряд');
    expect(pluralDaysLabel(30)).toBe('30 дней подряд');
    expect(pluralDaysLabel(100)).toBe('100 дней подряд');
  });
});

describe('GET /share/streak (публичный, без авторизации)', () => {
  it('200 с валидными days/pet — HTML с og:image, содержащим те же параметры', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak?days=30&pet=fox',
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('og:image');
    // '&' в URL-параметрах внутри HTML-атрибутов корректно экранируется в '&amp;'
    expect(res.body).toContain('days=30&amp;pet=fox');
    expect(res.body).toContain('30 дней подряд');
  });

  it('не зависит от заголовка Host — ссылки строятся из FRONTEND_URL', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak?days=30&pet=fox',
      headers: { host: 'evil.example.com' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain('evil.example.com');
  });

  it('неизвестный pet не падает — использует дефолтный тип в ссылке на картинку', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak?days=7&pet=totally-unknown-type',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('pet=totally-unknown-type');
  });

  it('без pet — подставляет fox по умолчанию', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak?days=7',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('pet=fox');
  });

  it('400 при нечисловом days', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak?days=abc',
    });
    expect(res.statusCode).toBe(400);
  });

  it('400 при days=0 и отрицательных', async () => {
    const zero = await app.inject({ method: 'GET', url: '/share/streak?days=0' });
    expect(zero.statusCode).toBe(400);
    const negative = await app.inject({ method: 'GET', url: '/share/streak?days=-5' });
    expect(negative.statusCode).toBe(400);
  });

  it('400 при days сверх разумного предела', async () => {
    const res = await app.inject({ method: 'GET', url: '/share/streak?days=999999999' });
    expect(res.statusCode).toBe(400);
  });

  it('400 при отсутствии days', async () => {
    const res = await app.inject({ method: 'GET', url: '/share/streak' });
    expect(res.statusCode).toBe(400);
  });

  it('format=story — вертикальные og:image:width/height (1080x1920) и format в ссылке на картинку', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak?days=30&pet=fox&format=story',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('og:image:width" content="1080"');
    expect(res.body).toContain('og:image:height" content="1920"');
    expect(res.body).toContain('format=story');
  });

  it('без format (или неизвестное значение) — остаётся классический 1200x630', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak?days=30&pet=fox&format=bogus',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('og:image:width" content="1200"');
    expect(res.body).not.toContain('format=story');
  });
});

describe('GET /share/streak/card.png (публичный, без авторизации)', () => {
  it('200 с валидными days/pet — image/png, кэшируется агрессивно', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak/card.png?days=30&pet=fox',
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toContain('immutable');
    // PNG signature
    expect(res.rawPayload.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(res.rawPayload.length).toBeGreaterThan(1000);
  }, 20_000);

  it('рендерится и для неизвестного типа питомца (дефолтный эмодзи)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak/card.png?days=100&pet=not-a-real-pet',
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  }, 20_000);

  it('400 при некорректном days', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak/card.png?days=nope',
    });
    expect(res.statusCode).toBe(400);
  });

  it('format=story — рендерит вертикальный 1080x1920 PNG тем же пайплайном', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/share/streak/card.png?days=100&pet=fox&format=story',
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.rawPayload.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(res.rawPayload.length).toBeGreaterThan(1000);
  }, 20_000);
});
