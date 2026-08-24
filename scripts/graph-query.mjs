#!/usr/bin/env node
// CLI-утилита для запросов по графам зависимостей (graph/*.json, madge --json).
// Без внешних зависимостей — только fs.
//
// Использование:
//   node scripts/graph-query.mjs <graph.json> <имя-или-часть-пути> <dependents|imports>
//
// dependents — кто импортирует найденный(е) файл(ы)
// imports    — что импортирует сам найденный(ые) файл(ы)
//
// Вывод — плоский список путей (по одному на строку), без заголовков и пояснений.

import { readFileSync } from 'node:fs';

const [, , graphPath, query, mode] = process.argv;

if (!graphPath || !query || !mode) {
  console.error(
    'Usage: node scripts/graph-query.mjs <graph.json> <имя-или-часть-пути> <dependents|imports>'
  );
  process.exit(1);
}

if (mode !== 'dependents' && mode !== 'imports') {
  console.error(`Unknown mode "${mode}". Ожидается "dependents" или "imports".`);
  process.exit(1);
}

let graph;
try {
  graph = JSON.parse(readFileSync(graphPath, 'utf8'));
} catch (err) {
  console.error(`Не удалось прочитать граф "${graphPath}": ${err.message}`);
  process.exit(1);
}

const needle = query.toLowerCase();
const matches = Object.keys(graph).filter((file) => file.toLowerCase().includes(needle));

if (matches.length === 0) {
  console.error(`Файлы, соответствующие "${query}", в графе не найдены.`);
  process.exit(1);
}

const results = new Set();

if (mode === 'imports') {
  for (const file of matches) {
    for (const dep of graph[file] ?? []) {
      results.add(dep);
    }
  }
} else {
  for (const [file, deps] of Object.entries(graph)) {
    if (matches.some((m) => deps.includes(m))) {
      results.add(file);
    }
  }
}

for (const path of [...results].sort()) {
  console.log(path);
}
