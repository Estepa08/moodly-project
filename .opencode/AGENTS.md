# AGENTS.md

## 1. Project Context
**Moodly** — дневник настроения с игровыми механиками.
- **Стек**: React (frontend) + Fastify/Prisma (backend) + PostgreSQL.
- **Структура**: монорепо (backend/, frontend/, shared/, api-contract/).
- **Код-стайл**: Prettier + ESLint. Для проверки используй `make format-check` и `make lint`.

## 2. Key Rules
- **Общение**: Отвечай на русском языке.
- **Язык кода**: Комментарии и названия в коде пиши на английском.
- **Документация**: Вся документация для проекта пишется на русском в папке `docs/`.

## 3. Database (Prisma)
Основные сущности: `User`, `Entry` (записи), `CreatureState` (состояние питомца), `DailyMission` (ежедневные задания).

## 4. Commands
Основные команды:
- `make setup` — установка зависимостей и генерация API-контракта.
- `make dev` — параллельный запуск бэкенда (порт 3001) и фронтенда (порт 5173).
- `make build` — сборка всего проекта.
- `make test` — запуск тестов.
- `make db-studio` — открыть Prisma Studio для работы с БД.

## 5. API Contract
- API описывается в `api-contract/` с использованием TypeSpec.
- После изменений в `api-contract/*.tsp` необходимо выполнить `npm run build` в папке `api-contract`, чтобы сгенерировать OpenAPI-файл.

## 6. Workflow
- **Ветка:** `main` — продакшн. Фичи разрабатываются в отдельных ветках.
- **Деплой:** Автоматический, через GitHub Actions, после пуша в `main`.