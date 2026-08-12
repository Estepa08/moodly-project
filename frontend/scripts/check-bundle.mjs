#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const rootDir = process.argv[2] ?? process.cwd();
const distDir = path.join(rootDir, 'dist/assets');

const LIMITS = {
  entryGzipKB: 150,
  initialTotalGzipKB: 520,
};

const files = (await readdir(distDir)).filter((f) => f.endsWith('.js'));

const gzipKB = (buf) => gzipSync(buf).byteLength / 1024;

const chunks = await Promise.all(
  files.map(async (f) => {
    const buf = await readFile(path.join(distDir, f));
    return { name: f, rawKB: buf.byteLength / 1024, gzipKB: gzipKB(buf) };
  }),
);

let initialNames;
try {
  const html = await readFile(path.join(rootDir, 'dist/index.html'), 'utf8');
  initialNames = new Set(
    [
      ...html.matchAll(/src=["'](\/?assets\/[^"']+\.js)["']/g),
      ...html.matchAll(/href=["'](\/?assets\/[^"']+\.js)["']/g),
    ].map((m) => path.basename(m[1])),
  );
} catch {
  initialNames = new Set(
    chunks.filter((c) => /^index-/.test(c.name) || /^vendor-/.test(c.name)).map((c) => c.name),
  );
}

const byName = new Map(chunks.map((c) => [c.name, c]));
const initial = [...initialNames].map((n) => byName.get(n)).filter(Boolean);
const entry = initial.find((c) => /^index-/.test(c.name));
const initialTotal = initial.reduce((s, c) => s + c.gzipKB, 0);

for (const c of initial.sort((a, b) => b.gzipKB - a.gzipKB)) {
  console.log(
    `${c.gzipKB.toFixed(1).padStart(7)} KB gzip | ${c.rawKB.toFixed(1).padStart(7)} KB raw | ${c.name}`,
  );
}

const problems = [];
if (entry && entry.gzipKB > LIMITS.entryGzipKB) {
  problems.push(
    `Entry chunk ${entry.name} = ${entry.gzipKB.toFixed(1)} KB gzip > ${LIMITS.entryGzipKB} KB`,
  );
}
if (initialTotal > LIMITS.initialTotalGzipKB) {
  problems.push(
    `Initial total = ${initialTotal.toFixed(1)} KB gzip > ${LIMITS.initialTotalGzipKB} KB`,
  );
}

if (problems.length) {
  console.error('\nBundle budget exceeded:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `\nBundle budget OK (entry ${entry?.gzipKB.toFixed(1) ?? '?'} KB gzip, initial ${initialTotal.toFixed(1)} KB gzip)`,
);
