#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_DIR = path.join(ROOT, "e2e", "tests");

const SPECS = {
  auth: "auth.spec.ts",
  "auth-register": "auth-register.spec.ts",
  dashboard: "dashboard.spec.ts",
  journey: "journey.spec.ts",
  missions: "missions.spec.ts",
  mobile: "mobile.spec.ts",
  navigation: "navigation.spec.ts",
  practices: "practices.spec.ts",
  settings: "settings.spec.ts",
  tests: "tests.spec.ts",
};

const SPEC_FILES = Object.values(SPECS).filter((f) => existsSync(path.join(TEST_DIR, f)));

const EXIT_NO_SPECS = 3;

function git(args) {
  return execSync(`git ${args}`, { cwd: ROOT, encoding: "utf8" }).trim();
}

function gitOk(args) {
  try {
    execSync(`git ${args}`, { cwd: ROOT, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function resolveBase(cliBase) {
  if (cliBase && gitOk(`rev-parse --verify ${cliBase}`)) return cliBase;
  const candidates = ["origin/develop", "origin/main"];
  for (const ref of candidates) {
    if (!gitOk(`rev-parse --verify ${ref}`)) continue;
    try {
      const base = git(`merge-base HEAD ${ref}`);
      if (base) return base;
    } catch {
      // переходим к следующему кандидату
    }
  }
  return "HEAD";
}

function changedFiles(base) {
  const out = new Set();
  const add = (buf) => {
    if (!buf) return;
    for (const line of buf.toString().split("\0")) {
      const f = line.trim();
      if (f) out.add(f);
    }
  };
  try {
    add(execSync(`git diff --name-only -z ${base}...HEAD --`, { cwd: ROOT }));
  } catch {
    // нет общего предка (shallow/несвязанная история) — двухточечный diff
    try {
      add(execSync(`git diff --name-only -z ${base} HEAD --`, { cwd: ROOT }));
    } catch {
      // ref недоступен — считаем по HEAD
      add(execSync("git diff --name-only -z HEAD^ HEAD --", { cwd: ROOT }));
    }
  }
  add(execSync("git diff --name-only -z", { cwd: ROOT }));
  add(execSync("git diff --cached --name-only -z", { cwd: ROOT }));
  add(execSync("git ls-files --others --exclude-standard -z", { cwd: ROOT }));
  return [...out];
}

const EXCLUDED = [
  /^\.husky\//,
  /^\.gitignore$/,
  /^\.dockerignore$/,
  /^\.env\.example$/,
  /^AGENTS\.md$/,
  /^DB_MIGRATION\.md$/,
  /^README\.md$/,
  /^Dockerfile$/,
  /^Makefile$/,
  /^backups\//,
  /^docs\//,
  /^infra\//,
  /^node_modules\//,
  /^opencode\.json$/,
  /^package(-lock)?\.json$/,
  /^render\.yaml$/,
  /\.md$/,
];

const FULL = [
  /^api-contract\//,
  /^\.prisma\//,
  /^backend\/src\/index\./,
  /^backend\/src\/app\./,
  /^backend\/src\/server\./,
  /^backend\/src\/lib\//,
  /^backend\/src\/utils\//,
  /^backend\/src\/test\//,
  /^backend\/src\/routes\/index\./,
  /^backend\/package(-lock)?\.json$/,
  /^e2e\/helpers\.ts$/,
  /^e2e\/playwright\.config\./,
  /^e2e\/package(-lock)?\.json$/,
  /^frontend\/package(-lock)?\.json$/,
  /^frontend\/src\/api\//,
  /^frontend\/src\/components\/ui\//,
  /^frontend\/src\/hooks\//,
  /^frontend\/src\/i18n\//,
  /^frontend\/src\/lib\//,
  /^frontend\/src\/services\//,
  /^frontend\/src\/widgets\/index\.ts$/,
  /^prisma\//,
];

const SPEC_RULES = [
  { match: /^backend\/src\/routes\/auth\.ts$/, specs: ["auth", "auth-register"] },
  { match: /^backend\/src\/routes\/users\.ts$/, specs: ["settings", "auth"] },
  {
    match: /^backend\/src\/routes\/(entries|parameters|digest)\.ts$/,
    specs: ["dashboard", "missions"],
  },
  {
    match: /^backend\/src\/routes\/(cba|journal)\.ts$/,
    specs: ["practices", "journey", "missions"],
  },
  { match: /^backend\/src\/routes\/(tests|test-results)\.ts$/, specs: ["tests", "missions"] },
  {
    match: /^backend\/src\/routes\/(creature|achievements)\.ts$/,
    specs: ["missions", "dashboard"],
  },
  { match: /^backend\/src\/routes\/onboarding-stories\.ts$/, specs: ["journey"] },

  {
    match: /^frontend\/src\/routes\/(login|register|forgot-password|reset-password)\.tsx$/,
    specs: ["auth", "auth-register"],
  },
  { match: /^frontend\/src\/routes\/dashboard\.tsx$/, specs: ["dashboard"] },
  { match: /^frontend\/src\/routes\/progress\.tsx$/, specs: ["dashboard", "missions"] },
  { match: /^frontend\/src\/routes\/settings\.tsx$/, specs: ["settings"] },
  { match: /^frontend\/src\/routes\/(tests|test-detail)\.tsx$/, specs: ["tests", "missions"] },
  {
    match:
      /^frontend\/src\/routes\/(practices|breathing|gratitude-journal|thought-journal|distortions|sleep-hygiene|cost-benefit-analysis)\.tsx$/,
    specs: ["practices", "journey", "missions"],
  },
  { match: /^frontend\/src\/routes\/onboarding\.tsx$/, specs: ["journey", "auth"] },

  { match: /^frontend\/src\/features\/auth\//, specs: ["auth", "auth-register"] },
  { match: /^frontend\/src\/features\/mood-entry\//, specs: ["dashboard", "missions"] },
  { match: /^frontend\/src\/features\/gamification\//, specs: ["missions", "dashboard"] },
  {
    match: /^frontend\/src\/features\/(breathing|journal|cost-benefit-analysis)\//,
    specs: ["practices", "journey", "missions"],
  },
  { match: /^frontend\/src\/features\/(check-in|dialogs)\//, specs: ["navigation", "dashboard"] },
  { match: /^frontend\/src\/features\/analytics\//, specs: ["dashboard"] },

  { match: /^frontend\/src\/components\/Layout\.tsx$/, specs: ["navigation", "mobile"] },
  { match: /^frontend\/src\/layout\//, specs: ["navigation", "mobile"] },
  {
    match: /^frontend\/src\/widgets\/(WellbeingCard|ThinkingPatternsCard|FirstTimeHint)\.tsx$/,
    specs: ["dashboard", "navigation"],
  },
  { match: /^frontend\/src\/widgets\/(MedicalDisclaimer|SkipLink)\.tsx$/, specs: ["navigation"] },
  { match: /^frontend\/src\/widgets\/TestsResultsSection\.tsx$/, specs: ["tests"] },

  { match: /^e2e\/tests\/([a-z0-9-]+)\.spec\.ts$/, specsFromMatch: 1 },
];

function classify(files) {
  let full = false;
  const specs = new Set();
  for (const f of files) {
    if (EXCLUDED.some((re) => re.test(f))) continue;
    if (FULL.some((re) => re.test(f))) {
      full = true;
      continue;
    }
    for (const rule of SPEC_RULES) {
      const m = rule.match.exec(f);
      if (!m) continue;
      const keys = rule.specsFromMatch ? [m[1]] : rule.specs;
      for (const k of keys) {
        if (SPECS[k] && existsSync(path.join(TEST_DIR, SPECS[k]))) specs.add(SPECS[k]);
      }
    }
  }
  return { full, specs: [...specs] };
}

function runPlaywright(args) {
  const fullArgs = ["playwright", "test", ...args];
  execSync(`npx ${fullArgs.join(" ")}`, { cwd: path.join(ROOT, "e2e"), stdio: "inherit" });
}

function print(header, files) {
  console.log(`\n${header}`);
  for (const f of files) console.log(`  ${f}`);
}

const argv = process.argv.slice(2);
let cliBase = null;
let listOnly = false;
const passthrough = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--base") {
    cliBase = argv[i + 1];
    i += 1;
  } else if (a === "--list" || a === "--dry-run") {
    listOnly = true;
  } else {
    passthrough.push(a);
  }
}

const base = resolveBase(cliBase);
const files = changedFiles(base);

if (!files.length) {
  console.log("Нет изменённых файлов — прогон не требуется.");
  process.exit(EXIT_NO_SPECS);
}

console.log(`База diff: ${base}`);
console.log(`Изменённых файлов: ${files.length}`);
for (const f of files) console.log(`  ${f}`);

const { full, specs } = classify(files);

let target;
if (passthrough.includes("--all")) {
  target = SPEC_FILES;
  console.log("\nРежим: полный прогон (--all).");
} else if (full) {
  target = SPEC_FILES;
  console.log("\nЗатронуты общие/глобальные файлы — запускаем весь набор спеков.");
} else if (specs.length) {
  target = specs;
  print("Затронутые спеки:", target);
} else {
  console.log("\nИзменения не связаны с e2e-сценариями — прогон не требуется.");
  process.exit(EXIT_NO_SPECS);
}

print("Итоговый список для запуска:", target);

if (listOnly) {
  console.log("\nТолько просмотр (--list) — запуск пропущен.");
  process.exit(0);
}

const filteredPassthrough = passthrough.filter((a) => a !== "--all");
runPlaywright([...target.map((f) => `tests/${f}`), ...filteredPassthrough]);
