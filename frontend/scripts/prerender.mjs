import { createServer } from 'node:http';
import { readFile, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { resolve, join, extname, dirname } from 'node:path';

const DIST = resolve(import.meta.dirname, '../dist');
const HOST = '127.0.0.1';
const PORT = 4573;
const BASE = `http://${HOST}:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

/**
 * Статический сервер dist с SPA-фолбеком на index.html.
 * Нужен только для локального рендера страниц в headless-браузере.
 */
function createStaticServer() {
  return createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url ?? '/', BASE).pathname);
    let file = join(DIST, pathname);
    if (pathname === '/' || !existsSync(file) || statSync(file).isDirectory()) {
      file = join(DIST, 'index.html');
    }
    const ext = extname(file).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    readFile(file, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end('500');
        return;
      }
      res.end(data);
    });
  });
}

/** Набор публичных маршрутов из sitemap.xml + auth-формы. */
function collectRoutes() {
  const routes = new Set(['/', '/login', '/register']);
  const sitemap = join(DIST, 'sitemap.xml');
  if (existsSync(sitemap)) {
    const xml = readFileSync(sitemap, 'utf8');
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      try {
        routes.add(new URL(match[1]).pathname);
      } catch {
        /* пропускаем невалидные loc */
      }
    }
  }
  return [...routes];
}

function outputPath(route) {
  return route === '/' ? join(DIST, 'index.html') : join(DIST, route, 'index.html');
}

async function renderRoute(browser, route) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  try {
    const response = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 20000 });
    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status()}`);
    }
    // Ждём, пока React смонтирует контент в #root.
    await page.waitForFunction(() => document.querySelector('#root')?.children.length > 0, {
      timeout: 15000,
    });
    // Ждём доставки ленивых чанков и эффектов (title/description/OG/JSON-LD).
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);
    const html = await page.content();
    if (html.length < 1200) throw new Error(`HTML слишком маленький: ${html.length} b`);
    return html;
  } finally {
    await page.close();
  }
}

/**
 * Убирает абсолютные localhost-URLы из сохранённого HTML.
 * Vite-рантайм при подгрузке ленивых чанков вставляет `modulepreload`/`script`
 * с абсолютным адресом вида `http://127.0.0.1:4573/assets/x.js` (origin статик-
 * сервера пререндера). Без нормализации эти URL уедут в прод-бандл, и браузер
 * попытается грузить ассеты с localhost — CSP (`script-src 'self'`) их заблокирует.
 * Заменяем их на корнеотносительные (`/assets/x.js`), которые на проде резолвятся
 * в `self`.
 */
function normalizeAssetUrls(html) {
  return html.split(`${BASE}/`).join('/');
}

function writeRoute(html, route) {
  const file = outputPath(route);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, normalizeAssetUrls(html));
  return file;
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.warn('[prerender] dist/index.html не найден — запускайте после `vite build`');
    process.exit(0);
  }

  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch (err) {
    console.warn('[prerender] @playwright/test недоступен — пререндер пропущен:', err?.message);
    process.exit(0);
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (err) {
    console.warn('[prerender] Chromium не запустился — пререндер пропущен:', err?.message);
    process.exit(0);
  }

  const server = createStaticServer();
  await new Promise((res) => server.listen(PORT, HOST, res));

  const routes = collectRoutes();
  const ok = [];
  const failed = [];

  for (const route of routes) {
    try {
      const html = await renderRoute(browser, route);
      writeRoute(html, route);
      ok.push(route);
      console.log('[prerender] OK  ', route);
    } catch (err) {
      failed.push({ route, error: err?.message });
      console.warn('[prerender] FAIL', route, '-', err?.message);
    }
  }

  await browser.close();
  await new Promise((res) => server.close(res));

  if (ok.length) {
    console.log(`[prerender] готово: ${ok.length}/${routes.length} маршрутов`);
  }
  if (failed.length) {
    console.warn('[prerender] не удались:', failed.map((f) => f.route).join(', '));
  }

  // Best-effort: одна неудачная страница не ломает деплой, но системный
  // сбой (0 отрендерено) валит сборку, чтобы не уехать в прод "тихо".
  process.exit(ok.length > 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('[prerender] fatal:', err);
  process.exit(1);
});
