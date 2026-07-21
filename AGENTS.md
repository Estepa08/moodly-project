# AGENTS.md

## Project

Moodly — трекер ментального здоровья. Единственная реализованная часть — API-контракт.

## Directory layout

- `api-contract/` — TypeSpec-контракт API (источник истины)
- `backend/` — Fastify + TypeScript + Prisma (PostgreSQL)
- `frontend/` — Vite + React + Tailwind + shadcn/ui + TanStack Query
- `skills/` — OpenCode-скиллы проекта

## Commands

### API contract

```sh
cd api-contract
npm install
npm run build          # tsp compile . → generated/openapi.yaml
```

### Backend

```sh
cd backend
npm install
npx prisma generate    # Prisma Client из schema.prisma
npx prisma db push     # создать/синхронизировать таблицы в БД
npm run db:seed        # наполнить справочники: параметры, тесты, онбординг
npm run dev            # tsx watch → localhost:3001
```

Перед первым запуском: создать БД `moodly` в PostgreSQL, настроить `.env`.

### Frontend

```sh
cd frontend
npm install
npm run generate:api   # openapi-typescript → src/lib/api-types.ts
npm run dev            # Vite → localhost:5173, прокси на /api → :3001
npm run build          # tsc + vite build → dist/
```

Порядок сборки: `api-contract build → frontend generate:api → frontend build`.

### Testing

```sh
make test               # backend + frontend
make test-backend       # только backend
make test-frontend      # только фронтенд
make test-watch         # watch mode
make test-coverage      # с отчётом покрытия
```

Backend-тесты используют БД `moodly_test` (указана в `.env.test`). Перед первым запуском: `createdb moodly_test`. Фронтенд-тесты мокают API-вызовы.

Примечание: PostgreSQL использует peer-аутентификацию (системного пользователя). Если соединение не подхватилось, укажи явно `DATABASE_URL="postgresql://<username>@localhost:5432/moodly"` в `.env`.

## API contract (api-contract/)

3 файла:
- `main.tsp` — точка входа: `@service`, `@useAuth(BearerAuth)` для всего API
- `models.tsp` — модели данных
- `routes.tsp` — интерфейсы (routes), сгруппированные по сущности

`tsp compile` → `generated/openapi.yaml` (OpenAPI 3). Править только `.tsp`-файлы, не YAML напрямую.

## Entity reference

- `User` — аккаунт пользователя (единственная роль)
- `Parameter` — справочник параметров, read-only для пользователя
- `Entry` — запись значения параметра, привязана к User и Parameter
- `Test` / `TestResult` — шаблон теста (read-only) и попытка пользователя с баллом/рекомендацией
- `Feedback` — обратная связь
- `OnboardingStory` — read-only контент для онбординга
- `Report` — генерация PDF/CSV отчёта (врач не актор системы)

Parameter, Test, OnboardingStory не имеют пользовательского CRUD на MVP.

## Conventions

- Коммиты: Conventional Commits (`feat:`, `fix:`, `chore:`)
- Когда появится `frontend/`: типы API генерировать из `openapi.yaml` через `openapi-typescript`, не писать вручную
