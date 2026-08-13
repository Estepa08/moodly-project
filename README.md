# Moodly

**Продукт:** https://mymoodly.ru/ — «дневник настроения, который заботится о вас: 30 секунд в день».

Moodly — это PWA-приложение для ежедневного отслеживания состояния (настроение, энергия, сон, тревога) с игровыми механиками, тестами самопознания, практиками ментального здоровья и сквозным (E2E) шифрованием личных записей. Продукт рассчитан на RU-рынок (152-ФЗ, серверы в РФ), модель Freemium.

---

## 1. Стек

| Слой | Технологии |
|------|------------|
| Frontend | React 19 + TypeScript + Vite 8, Tailwind CSS, React Router 7, TanStack Query, i18next (ru/en), Framer Motion, Lottie, Recharts/@nivo, react-hook-form + zod |
| Backend | Fastify 5 + TypeScript (Node 22), Prisma ORM, Zod |
| База данных | PostgreSQL (Prisma, миграции) |
| Shared | `@moodly/shared` — общие типы/константы/утилиты для backend и frontend |
| API-контракт | `api-contract/` — TypeSpec → OpenAPI (источник истины) |
| PWA / offline | vite-plugin-pwa (injectManifest, `src/sw.ts`), Dexie (IndexedDB) + фоновая синхронизация |
| Push | web-push (VAPID), сервис-воркер |
| Email | Resend |
| Аналитика | Яндекс.Метрика (клиентская, `lib/metrika.ts`) |
| Инфраструктура | Docker (монолитный multi-stage `Dockerfile`: frontend + backend + Caddy), деплой на DockHost |
| CI/CD | GitHub Actions (`ci.yml`, `e2e.yml`) |
| E2E | Playwright (`e2e/`) |

---

## 2. Структура монорепо

```
moodly-project/
├── api-contract/      # TypeSpec-контракт → OpenAPI (источник истины: main.tsp, models.tsp, routes.tsp)
├── shared/            # @moodly/shared — типы/константы/утилиты, общие для backend и frontend
├── backend/           # Fastify + TypeScript + Prisma (PostgreSQL)
├── frontend/          # Vite + React + Tailwind PWA (i18n, vitest)
├── e2e/               # Playwright-сценарии (запускаются из CI, не в докер-образе)
├── infra/             # Caddyfile, сертификаты, бэкап-скрипт moodly-backup.sh
├── docs/              # документация (НЕ в git, см. §7)
├── .github/           # GitHub Actions (workflows/ci.yml, workflows/e2e.yml, instructions/)
├── .opencode/         # конфигурация opencode: AGENTS.md, scripts/, skills/, settings.json
├── .agents/           # контекст продукта для маркетинг-агентов (product-marketing.md)
├── .husky/            # git-хуки (husky)
│
├── Dockerfile         # монолитный прод-образ (frontend + backend + Caddy), 5 стадий
├── Makefile           # единый интерфейс команд (setup/dev/build/test/db-*)
├── opencode.json      # провайдер/модель opencode (aitunnel/deepseek-v4-flash)
├── package.json       # корневой npm-пакет (husky)
├── .env.example       # пример переменных прод-окружения
├── .gitignore         # игнор корня + правило !docs/DB_MIGRATION.md
├── .dockerignore
├── .prettierrc.json   # единый стиль кода
├── .prettierignore
├── robots.txt
├── check-seo.sh       # проверка SEO-страниц
└── AGENTS.md          # инструкции для агентов (стек, git-workflow, отчёты)
```

Что где держать:

- **Код продукта** — `backend/`, `frontend/`, `shared/`, `api-contract/`, `e2e/`.
- **Инфраструктура/деплой** — `infra/`, корневой `Dockerfile`, `Makefile`.
- **Документация** — `docs/` (планы, решения, аудиты, SVG-макеты) — локальная, в git только `docs/DB_MIGRATION.md`.
- **Автоматизация агентов** — `AGENTS.md`, `.opencode/`, `.agents/`.
- **Служебные конфиги инструментов остаются в корне** (git, docker, prettier, opencode, make, husky читают их именно там). Не переносить без переписывания сборки.

---

## 3. Контракт API и типы

Пайплайн генерации контракта (source of truth → типы):

```
api-contract/*.tsp (TypeSpec)  →  tsp compile →  generated/openapi.yaml  →  openapi-typescript  →  frontend/src/lib/api-types.ts
```

- Описание API — только в `api-contract/` (TypeSpec): `models.tsp` (модели), `routes.tsp` (эндпоинты), `main.tsp` (обвязка).
- После правок в `.tsp` перегенерировать: `make generate` (контракт → shared → `api-types.ts`).
- Изменять `api-types.ts` вручную нельзя — файл генерируется.

Разделы контракта: Auth, Users, Parameters, Entries, Tests, TestResults, Feedback, OnboardingStories, Reports, Creature (компаньон), Cba, EmotionLab, Admin, Content.

---

## 4. Модель безопасности

- **E2E-шифрование данных:** записи (Entry), результаты тестов и часть других данных шифруются на клиенте (Web Crypto, AES-GCM). Сервер хранит только `wrappedKey` + соли (`keySalt`, `recoverySalt`) и **не может расшифровать** данные пользователя (`backend/prisma/schema.prisma`, `User`). Код — `frontend/src/lib/crypto/` (keys, kdf, codec, records, session, auth-keys).
- **DEK/KEK-модель:** Data Encryption Key генерируется на клиенте, оборачивается ключом из пароля (KEK) и recovery-кодом (KEK_recovery). Потеря DEK (новая вкладка/очищенный sessionStorage) → принудительный повторный вход (`/login` с `unlock-required`), лендинг залогиненным не показывается.
- **Аутентификация:** JWT access + refresh-токен в httpOnly cookie (`@fastify/jwt`, `@fastify/cookie`), ротация refresh, устройства (Device), `@fastify/rate-limit` (чтение/write-лимиты, продакшн 100/10 в минуту), helmet со строгим CSP.
- **Роли:** `user` / `admin` (+ `content`-доступ к контент-роутам). Админка — `/admin`.
- **Приватность 152-ФЗ:** согласия `ageConfirmed`/`pdpConsent` фиксируются при регистрации, страницы `privacy`, `terms`.
- **Восстановление пароля:** forgot/reset через Resend-письма; recovery-материал (wrappedKey/salt) отдаётся клиенту по токену сброса.

---

## 5. Основные сущности БД (Prisma)

`backend/prisma/schema.prisma` (источник — миграции в `backend/prisma/migrations/`, история — `docs/DB_MIGRATION.md`):

- **User** — аккаунт, роли, согласия, E2E-ключи, подписка (tier).
- **Parameter** — отслеживаемые параметры: Anxiety, Mood, Energy, Sleep, Gratitude, Sleep Hygiene, Distortion Quiz, Thought Release, Day Activities (гарантируются `ensureDefaultParameters`).
- **Entry** — запись трекера: числовое значение/заметка, **E2E-шифрованное** поле `encryptedData` (значение + заметка + теги когнитивных ловушек `distortions`).
- **Test / TestResult** — тесты самопознания (настроение, тревога, привычки мышления) и результаты (тоже E2E-шифруются).
- **CreatureState** — состояние компаньона: calmness, energy, level, experience, streak, скины/титулы/типы питомцев, поглаживания (petCount/lastPetAt, лимит 100/сутки), комфорт, времена поглаживаний для «Комбо».
- **Achievement / UserAchievement** — достижения и их разблокировки.
- **DailyMission** — ежедневные задания с XP.
- **EmotionLabProgress** — игровой прогресс «Лаборатории эмоций» (диады колеса Плутчика, дневной лимит попыток).
- **CbaEntry / CbaExample / CbaCommonItem** — КПТ-анализ мыслей (Cost-Benefit Analysis).
- **PracticeCompletion / BreathingSession** — выполненные практики и дыхательные сессии.
- **PushSubscription** — подписки на push-уведомления.
- **Device / RefreshToken / ResetToken / SyncCursor** — сессии, устройства, офлайн-синк.
- **Feedback / OnboardingStory / MotivationMessage** — обратная связь, онбординг, контент «пожеланий дня».
- **Report** — формируемые отчёты (в контракте).

---

## 6. Функциональность (маршруты приложения)

Маршрутизация — `frontend/src/App.tsx` (lazy-load страниц, Protected/Public/Admin-обёртки).

### Публичные маршруты
- Лендинг `/`, вход `/login`, регистрация `/register`, сброс пароля `/forgot-password`, `/reset-password`
- Юридические: `/privacy`, `/terms`
- SEO-лендинги: `/mood-diary`, `/anxiety-test`, `/thinking-habits-test`, `/sleep-hygiene-guide`, `/anxiety-self-help`
- Блог: `/blog`, `/blog/category/:category`, `/blog/:slug`

### Защищённые (после логина + наличия DEK)
- `/onboarding` — онбординг
- `/my-day` — «Мой день»: чек-ин, карточка компаньона (PetGreeterCard), активности дня, пожелание дня
- `/statistics` — статистика: тренды, радар «Профиль мышления», средние за неделю, корреляция активностей, карточка «Ловушки мышления» (DistortionStatsCard)
- `/practices` — практики: breathing, gratitude, thought-journal, distortions, sleep-hygiene, cost-benefit-analysis, emotion-lab (все вложенные маршруты `/practices/*`)
- `/tests` и `/tests/:testId` — тесты самопознания
- `/progress` — прогресс: серии (streak), heatmap, уровень/XP, достижения, ежедневные миссии, компаньон
- `/settings` — настройки (напоминания утро/день/вечер, профиль)
- `/admin` — админ-панель (роль admin)
- `/content` — контент-менеджер пожеланий

### Геймификация компаньона (`frontend/src/features/gamification/`)
- Поглаживание: цикл 1-2-3 (3-й клик = +1 XP, −1 ⚡ энергии), дневной лимит 100 XP-поглаживаний
- 5 скрытых бонусов начисления (сервер, `creatureService.pet()`): «Бодрое утро» (+2 XP), «Спокойный вечер» (+1 XP/+1 calmness), «Возвращение» после паузы >4 ч, «Эмпатия» (+1 XP/+2 comfort при грусти/тревоге за 24 ч), «Комбо» (+3 XP каждый 5-й быстрый клик)
- Слова-эмоции в стиле XP, «пробежка» компаньона, «отлучка» на заходе (💤), idle-цикл скрытия/появления внутри круга
- Коллекция питомцев (27 типов), скины, титулы, смена имени (`PATCH /creature/pet`)
- Энергия восстанавливается практиками и чек-ином; при ≤20% — баннер/CTA

### E2E-шифрование и офлайн
- Записи/тесты шифруются на устройстве (`frontend/src/lib/crypto/`)
- Offline-first: Dexie + фоновый синк (`frontend/src/lib/offline/`), статус синка в UI

---

## 7. Документация проекта

`docs/` — локальная (gitignored, в git только `docs/DB_MIGRATION.md`):

- `docs/plans/` — планы задач (обязательная фиксация после утверждения плана)
- `docs/decisions/decisions.md` — реестр реализованных решений; `docs/decisions/roadmap.md` — роадмэп (реализовано / в работе / планируется / идеи)
- `docs/audit/` — аудиты и ТЗ (деплой DockHost, JTBD, customer journey map, market readiness, тесты)
- `docs/content/messages.md` — тексты контента
- `docs/*.svg` — SVG-макеты визуальных компонентов (обязательны до реализации UI)
- `docs/DB_MIGRATION.md` — история миграций БД (единственный файл docs в git)

**Правила работы для агентов — `AGENTS.md`** (язык — русский, git-workflow: одна ветка `main`, PR-модель, деплой; отчёты о коде; реестр решений; SVG-макеты перед UI). Конфигурация opencode — `.opencode/AGENTS.md`, `.opencode/skills/` (react-vite-best-practices, vercel-react-best-practices, design-guide, маркетинговые скиллы). Контекст продукта для маркетинга — `.agents/product-marketing.md`.

---

## 8. Быстрый старт (локальная разработка)

```sh
make setup      # npm install во всех пакетах + генерация контракта/shared + подготовка БД
make dev        # параллельно запускает backend и frontend
```

- Backend API: `http://localhost:3002` (`backend/.env`, `PORT=3002`)
- Frontend: `http://localhost:5173` (Vite проксирует `/api` → `localhost:3002`)

> Примечание: внутри прод-контейнера бэкенд слушает `:3001` (см. Dockerfile/entrypoint), в dev — `3002`.

## Полезные команды (Makefile)

```sh
make build              # generate → backend → frontend (контракт/shared в порядке)
make test               # vitest backend и frontend (test-coverage — с покрытием)
make lint               # eslint backend и frontend
make format-check       # проверка форматирования (prettier)
make bundle:check       # бюджет бандла фронтенда (frontend/scripts/check-bundle.mjs)
make db-studio          # Prisma Studio (dev)
make admin dev|prod|ru  # Prisma Studio для нужного окружения (.env / .env.prod / .env.prod.ru.local)
make db-reset           # принудительный сброс + seed
make db-backup          # дамп прод-БД в backups/ (make db-restore FILE=path.sql)
make db-create-user ARGS="--email=... --password=... --admin"   # dev
make db-prod-create-user ARGS="--email=... --password=... --admin"   # прод
make start-feature      # старт фиче-ветки (bash .opencode/scripts/start-feature.sh)
make clean              # удалить node_modules/dist
```

Также вручную (в пакетах): `npm run dev/build/test/lint/format`, `npx prisma migrate dev`.

## Тестирование

- **Backend:** vitest (`backend/src/**/__tests__`), PostgreSQL в CI.
- **Frontend:** vitest + Testing Library (`frontend/src/**/__tests__`, `tsconfig.test.json`), моки IndexedDB (fake-indexeddb).
- **E2E:** Playwright (`e2e/`, baseURL `localhost:5173`, serviceWorker блокируется). Сценарии: auth, register, dashboard, journey, missions, navigation, practices, settings, tests, mobile. Триггер — `e2e.yml`.
- **Бюджет бандла:** `make bundle:check` — entry ~38 КБ gzip, initial ~337 КБ (бюджет 520).

---

## 9. Сборка и прод-образ (Dockerfile)

Монолитный multi-stage `Dockerfile` (5 стадий): `contract` (TypeSpec→OpenAPI) → `shared-build` → `frontend-build` (генерация api-types + Vite + пререндер через Playwright) → `backend-build` → `runtime` (node:22-alpine + Caddy + libcap).

Runtime-контейнер:
- Caddy на `:80` (не-root через `setcap cap_net_bind_service`), `auto_https off` — внешний TLS закрывает Traefik панели DockHost
- Отдаёт SPA из `/srv`, пререндеренные HTML маршрутов, проксирует `/api/*` → `127.0.0.1:3001`
- Бэкенд: `PORT=3001`, entrypoint (`docker-entrypoint.sh`), `prisma migrate deploy` на старте
- `HEALTHCHECK` по `/health` бэкенда
- **Build-переменная (важно):** `VITE_VAPID_PUBLIC_KEY` передаётся как ARG на стадию frontend-build (Vite инлайнит на сборке). Задаётся в панели как **build variable**, иначе push-уведомления покажут «временно недоступны».
- Контейнер работает от пользователя `node` (не root)

## Деплой

- **Хостинг:** DockHost (`my.dockhost.ru`), PostgreSQL на том же хостинге (контейнер postgres). TLS — Traefik панели, домен `mymoodly.ru`.
- **Автодеплой:** push в `main` → DockHost пересобирает образ из git-репо.
- **Домены:** основной `mymoodly.ru`; `mymoodly.online` → 301 на канонический (в Caddyfile).
- **Документация:** `docs/audit/deploy-dockhost-tz.md`; конфиг — `infra/Caddyfile`, бэкапы — `infra/moodly-backup.sh`.

## CI/CD (GitHub Actions)

- `ci.yml` — на PR/push в `main`/`develop`: для backend (tsc, lint, format-check, vitest на Postgres 16, build) и frontend (tsc, lint, format-check, vitest, сборка с Chromium для пререндера, `bundle:check`).
- `e2e.yml` — Playwright-сценарии.

---

## 10. Рабочий процесс с ветками

В репозитории **одна постоянная ветка**: `main`.

- Фича → отдельная ветка → **PR в `main`** → merge → автодеплой на DockHost.
- `main` защищена на GitHub (только через PR; force-push запрещён).
- Ранее существовавшая прод-ветка `russia` удалена и больше не используется.
- Ветки после merge удаляются; новых постоянных веток не создавать.
