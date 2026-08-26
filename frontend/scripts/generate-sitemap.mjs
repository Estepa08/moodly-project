#!/usr/bin/env node
/**
 * Генерирует public/sitemap.xml из POSTS (posts.ts) + списка статических
 * публичных страниц. Раньше sitemap.xml редактировался руками отдельно от
 * posts.ts, а prerender.mjs берёт список маршрутов для пререндера именно
 * из sitemap.xml — рассинхрон означал, что новый пост в блоге мог остаться
 * непререндеренным и невидимым для роботов. Держим один источник правды.
 *
 * lastmod у статических страниц проставляется вручную ниже (как updatedAt
 * у постов блога), а не текущей датой сборки — иначе lastmod менялся бы
 * при каждой сборке независимо от того, поменялся ли контент.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { POSTS, CATEGORIES } from '../src/routes/blog/posts.ts';

const BASE_URL = 'https://mymoodly.ru';

const STATIC_PAGES_BEFORE_BLOG = [
  { loc: '/', lastmod: '2026-08-12', changefreq: 'weekly', priority: 1.0 },
];

const STATIC_PAGES_AFTER_BLOG = [
  { loc: '/mood-diary', lastmod: '2026-08-24', changefreq: 'weekly', priority: 0.8 },
  { loc: '/anxiety-test', lastmod: '2026-08-12', changefreq: 'weekly', priority: 0.8 },
  { loc: '/thinking-habits-test', lastmod: '2026-08-12', changefreq: 'weekly', priority: 0.8 },
  { loc: '/sleep-hygiene-guide', lastmod: '2026-08-24', changefreq: 'weekly', priority: 0.8 },
  { loc: '/anxiety-self-help', lastmod: '2026-08-24', changefreq: 'weekly', priority: 0.8 },
  { loc: '/privacy', lastmod: '2026-08-12', changefreq: 'monthly', priority: 0.3 },
  { loc: '/terms', lastmod: '2026-08-12', changefreq: 'monthly', priority: 0.3 },
];

function latestOf(posts) {
  return posts.reduce((max, p) => {
    const d = p.updatedAt ?? p.date;
    return d > max ? d : max;
  }, posts[0].updatedAt ?? posts[0].date);
}

const blogIndexEntry = {
  loc: '/blog',
  lastmod: latestOf(POSTS),
  changefreq: 'weekly',
  priority: 0.9,
};

const categoryEntries = Object.keys(CATEGORIES).map((slug) => {
  const inCategory = POSTS.filter((p) => p.category === slug);
  return {
    loc: `/blog/category/${slug}`,
    lastmod: inCategory.length ? latestOf(inCategory) : blogIndexEntry.lastmod,
    changefreq: 'weekly',
    priority: 0.8,
  };
});

const postEntries = POSTS.map((p) => ({
  loc: `/blog/${p.slug}`,
  lastmod: p.updatedAt ?? p.date,
  changefreq: 'monthly',
  priority: 0.7,
}));

const all = [
  ...STATIC_PAGES_BEFORE_BLOG,
  blogIndexEntry,
  ...categoryEntries,
  ...postEntries,
  ...STATIC_PAGES_AFTER_BLOG,
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  all
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${BASE_URL}${e.loc}</loc>\n` +
        `    <lastmod>${e.lastmod}</lastmod>\n` +
        `    <changefreq>${e.changefreq}</changefreq>\n` +
        `    <priority>${e.priority.toFixed(1)}</priority>\n` +
        `  </url>`,
    )
    .join('\n') +
  '\n</urlset>\n';

const outPath = path.resolve(import.meta.dirname, '../public/sitemap.xml');
await writeFile(outPath, xml, 'utf8');
console.log(`[sitemap] ${all.length} URL записано → ${outPath}`);
