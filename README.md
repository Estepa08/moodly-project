# Moodly

Простой дневник настроения — замечайте, как меняется ваше состояние день за днём.

## Структура

- `api-contract/` — TypeSpec-контракт API (источник истины)
- `shared/` — общий пакет `@moodly/shared` (типы/утилиты для backend и frontend)
- `backend/` — Fastify + TypeScript + Prisma (PostgreSQL) API-сервер
- `frontend/` — Vite + React + Tailwind PWA-приложение с i18n и тестами
- `infra/` — Caddyfile (reverse proxy, security-заголовки, CSP)
- `Dockerfile` — монолитный прод-образ (frontend + backend + Caddy)

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
в ветку `russia`. Контейнер: non-root `node`, Caddy на :80 (через file-capability), бэкенд на
внутреннем :3001, `HEALTHCHECK` по `/health`. Подробнее — `docs/deploy-dockhost-tz.md`.

CI/CD — GitHub Actions: `ci.yml` (backend + frontend: tsc, lint, тесты, сборка, бюджет бандла)
и `e2e.yml` (e2e-тесты).

## Описание функций

- **Регистрация:** Позволяет пользователям создавать учетные записи.
- **Аутентификация:** Поддержка jwt для безопасного входа.
- **Управление настроением:** Пользователи могут записывать свое настроение и отслеживать изменения.

## Будущие возможности

- Расширение функционала до учета физических и психологических факторов.
- Аналитика и советы для пользователей на основе собранных данных.
