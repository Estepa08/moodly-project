# AGENTS.md

## Project

Moodly — трекер ментального здоровья. Единственная реализованная часть — API-контракт.

## Language

Отвечать на русском языке. Все комментарии, сообщения, объяснения — только на русском, если пользователь не попросил иначе.

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

### Интернационализация (i18n)

- Весь пользовательский текст — только через `react-i18next` (`t()`) или `useTestTranslation`.
- Никаких хардкодных строк в JSX.
- Новый ключ в EN → сразу добавить в RU.
- Контент тестов (вопросы, опции, интерпретации) — EN в seed, RU в `test-content.ts`.
- Backend-тексты (интерпретации, рекомендации) — lookup в `useTestTranslation` по словарю.

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

## UI Design System — Beyond Neumorphism

Стиль: **Neumorphism** (soft UI) для mental health трекера на лавандово-фиолетовой основе с зелёным акцентом.

### Style

- Neumorphism — мягкие тени (dual shadow: светлая сверху-слева, тёмная снизу-справа), выпуклые/вдавленные поверхности, без резких границ
- Border-radius: `12px` на карточках (`rounded-xl`), `8px` на кнопках/инпутах (`rounded-lg`)
- Анимации нажатия: `150ms`, scale `0.97`
- Dark mode: не использовать с neumorphism (ломает физику света). Если нужен тёмный режим — перейти на Soft UI Evolution

### Light palette

| Роль | HEX | HSL | CSS-var |
|---|---|---|---|
| Background | `#f5f0ff` | `270 100% 98%` | `--background` |
| Foreground | `#4C1D95` | `264 67% 35%` | `--foreground` |
| Primary | `#8B5CF6` | `261 90% 66%` | `--primary` |
| Secondary | `#d6c6f5` | `261 90% 85%` | `--secondary` |
| Accent | `#059669` | `161 94% 30%` | `--accent` |
| Card | `#ffffff` | `0 0% 100%` | `--card` |
| Muted | `#f1f2f9` | `230 33% 96%` | `--muted` |
| Muted fg | `#64748b` | `215 16% 45%` | `--muted-foreground` |
| Border | `#e0d4f5` | `261 75% 90%` | `--border` |
| Destructive | `#ea1515` | `0 84% 50%` | `--destructive` |

### Typography

- Заголовки (h1-h6): `Lora` (Georgia, serif fallback) — `font-serif`
- Body: `Raleway` (system-ui, -apple-system, sans-serif fallback) — `font-sans`
- Base: 16px, line-height 1.5

### Shadows

```css
--shadow-neumorphic: 6px 6px 12px rgba(180, 160, 200, 0.3), -6px -6px 12px rgba(255, 255, 255, 0.8);
--shadow-neumorphic-sm: 3px 3px 6px rgba(180, 160, 200, 0.25), -3px -3px 6px rgba(255, 255, 255, 0.8);
--shadow-neumorphic-inset: inset 3px 3px 6px rgba(180, 160, 200, 0.25), inset -3px -3px 6px rgba(255, 255, 255, 0.8);
```

### Conventions

- Все hex-цвета определять только через CSS-переменные в `index.css`, в компонентах использовать Tailwind-классы (`text-primary`, `bg-card`, `text-muted-foreground`)
- Иконки: SVG (Lucide) через наследование `text-muted-foreground` / `text-primary`. Никаких emoji как иконок.
- Акцентный цвет (`--accent`) — для прогресс-баров, CTA, активных индикаторов. Не использовать для текста (низкий контраст на светлом фоне).
- Neumorphic тени — на карточках и кнопках. Инпуты — `shadow-neumorphic-inset` (вдавленный стиль).
- Фокус-кольца (`focus-visible:ring-2 ring-ring`) обязательны для всех интерактивных элементов.
- `cursor-pointer` на всех кликабельных элементах.

### Источник

Палитра утверждена на основе UI/UX Pro Max Skill (Mental Health App + Neumorphism). Любые изменения цветов или стилей согласовывать с Skill.

### Тестирование

- Тестировать поведение, не реализацию.
- Один тест — один assert (или группа логически связанных).
- Mock только внешних зависимостей (API, БД), не внутренних функций.
