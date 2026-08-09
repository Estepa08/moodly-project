# Moodly

https://mymoodly.ru/

Простой дневник настроения — замечайте, как меняется ваше состояние день за днём.

## Структура

Монорепо: backend и frontend живут в отдельных пакетах, конфиги сборки — в корне.

```
moodly-project/
├── api-contract/      # TypeSpec-контракт API → OpenAPI (источник истины)
├── shared/            # @moodly/shared — общие типы/утилиты для backend и frontend
├── backend/           # Fastify + TypeScript + Prisma (PostgreSQL)
├── frontend/          # Vite + React + Tailwind PWA (i18n, PWA, vitest)
├── e2e/               # Playwright-сценарии (запускаются из CI)
├── infra/             # Caddyfile, сертификаты, бэкап-скрипт
├── docs/              # планы, решения, SVG-макеты, аудиты (не в git, кроме DB_MIGRATION.md)
├── .github/           # GitHub Actions (ci.yml, e2e.yml)
├── .opencode/         # конфигурация opencode (агенты, skills)
├── .husky/            # git-хуки (husky)
├── .agents/           # контекст продукта для маркетинг-агентов
│
├── Dockerfile         # монолитный прод-образ (frontend + backend + Caddy)
├── Makefile           # единый интерфейс команд (make setup/dev/build/test/...)
├── opencode.json      # провайдер/модель opencode
├── package.json       # корневой npm-пакет (husky и рабочий процесс)
├── .env.example       # пример переменных прод-окружения
│
├── .gitignore         # игнор для корня + правило !docs/DB_MIGRATION.md
├── .dockerignore      # контекст докера
├── .prettierrc.json   # единый стиль кода
├── .prettierignore    # что не форматируем
└── AGENTS.md          # инструкции для агентов (стек, workflow, отчёты)
```

Что где держать:

- **Код продукта** — `backend/`, `frontend/`, `shared/`, `api-contract/`, `e2e/`.
- **Инфраструктура/деплой** — `infra/`, корневой `Dockerfile`, `Makefile`.
- **Документация** — `docs/` (планы `docs/plans/`, решения `docs/decisions/`); `docs/DB_MIGRATION.md` — история миграций БД.
- **Автоматизация агентов** — `AGENTS.md`, `.opencode/`, `.agents/`.
- **Служебные конфиги инструментов остаются в корне по требованию самих инструментов** (git, docker, prettier, opencode, make, husky читают их именно там). Не переносить без переписывания сборки.

## Быстрый старт

```sh
make setup      # npm install во всех пакетах + генерация контракта/shared + подготовка БД
make dev        # параллельно запускает backend и frontend
```

- Backend API: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## Полезные команды

```sh
make build              # сборка всех пакетов (контракт → shared → backend → frontend)
make test               # vitest на backend и frontend
make lint               # eslint backend и frontend
make format-check       # проверка форматирования (prettier)
make bundle:check       # бюджет бандла фронтенда   (см. frontend/scripts/check-bundle.mjs)
make db-studio          # Prisma Studio
make db-backup          # дамп прод-БД в backups/
make db-restore FILE=path.sql
```

## Деплой

Прод-образ собирается из корневого `Dockerfile` (single-stage-мультистёйдж) и разворачивается
на RU-хостинге (DockHost) через панель: образ тянет git-репозиторий и пересобирается на push
в ветку `main` (автодеплой). Контейнер: non-root `node`, Caddy на :80 (через file-capability), бэкенд на
внутреннем :3001, `HEALTHCHECK` по `/health`. Подробнее — `docs/audit/deploy-dockhost-tz.md`.

CI/CD — GitHub Actions: `ci.yml` (backend + frontend: tsc, lint, тесты, сборка, бюджет бандла)
и `e2e.yml` (e2e-тесты).

## Рабочий процесс с ветками

В репозитории одна постоянная ветка:

- **`main`** — единственная: фичи сливаются через PR, и `main` же является прод-релизной веткой,
  push в неё триггерит автодеплой на DockHost.

Процесс:

1. Фича → отдельная ветка → **PR в `main`** → merge → автодеплой.

`main` защищена на GitHub (только через PR; force-push запрещён). Ранее существовавшая ветка
`russia` (прод-релизная) больше не используется и удалена — отдельного релизного PR нет.

## Описание функций

- **Регистрация:** Позволяет пользователям создавать учетные записи.
- **Аутентификация:** Поддержка jwt для безопасного входа.
- **Управление настроением:** Пользователи могут записывать свое настроение и отслеживать изменения.

## Будущие возможности

- Расширение функционала до учета физических и психологических факторов.
- Аналитика и советы для пользователей на основе собранных данных.
