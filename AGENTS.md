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
npm run db:studio      # Prisma Studio → localhost:5555 (UI для просмотра/правки данных)
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

### Коммиты и пуши

- Не коммитить и не пушить без явной команды пользователя.
- Conventional Commits (`feat:`, `fix:`, `chore:`).
- Commit только по команде "сохрани" или "готово".

### Нейминг

- `camelCase` — переменные, функции, методы, параметры.
- `PascalCase` — типы, интерфейсы, React-компоненты.
- `UPPER_SNAKE` — константы, env-переменные.
- Булевы — с префиксом `is`/`has`/`should` (`isLoading`, `hasError`).
- Без сокращений (кроме `id`, `url`, `ref`, `idx`).
- Без транслита.
- Одна буква — только в циклах/колбэках.

### Архитектура

**Backend — трёхслойная:**
- `routes/` — только разбор запроса, вызов сервиса, ответ. Никакой бизнес-логики.
- `services/` — бизнес-логика и Prisma-запросы. Единственное место, где импортируется `prisma`.
- `lib/` — PrismaClient, утилиты, Middleware (error handler).

**Frontend:**
- `routes/` — страницы (композиция компонентов + хуки).
- `components/` — переиспользуемые UI-компоненты.
- `hooks/` — кастомные React-хуки (бизнес-логика, TanStack Query).
- `lib/` — API-клиент, утилиты.
- `api` — единственный модуль для HTTP-запросов. Никакого `fetch()` в компонентах.

### Чистота кода

- Early return вместо вложенных `if`.
- Одна ответственность на функцию, один уровень абстракции.
- Мёртвый код удалять, не оставлять закомментированным.
- Магические числа → именованные константы.
- Правило трёх: одинаковый код появился 3+ раза → вынести в функцию/компонент/хук.

### Обработка ошибок

- Backend: `AppError` (code, statusCode, message) → глобальный `setErrorHandler`.
- Frontend: TanStack Query `onError` на уровне QueryClient.
- Ошибки валидации — Zod-схемы (не дублировать вручную).

### Безопасность

- `@fastify/helmet` — HTTP-заголовки безопасности.
- `@fastify/rate-limit` — 100 запросов/мин, на `/auth/*` — жёстче.
- JWT access token (15 мин) + refresh token (7 дней).
- Пароли — `bcrypt` (cost 10).
- Prisma — параметризованные запросы (SQL injection невозможен).
- `.env` и secrets — в `.gitignore`, не коммитить.
- HTTP-only cookie (prod) вместо localStorage для токена.

### Тестирование

- Тестировать поведение, не реализацию.
- Один тест — один assert (или группа логически связанных).
- Mock только внешних зависимостей (API, БД), не внутренних функций.
