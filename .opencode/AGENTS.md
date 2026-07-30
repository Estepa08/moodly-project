# AGENTS.md

## Project

Moodly — дневник настроения. Полный стек: API-контракт (TypeSpec), backend (Fastify + Prisma), frontend (React + Vite + Tailwind), инфраструктура (Docker + CI/CD).

## Language

Отвечать на русском языке. Все комментарии, сообщения, объяснения — только на русском, если пользователь не попросил иначе.

## Directory layout

- `api-contract/` — TypeSpec-контракт API (источник истины)
- `backend/` — Fastify + TypeScript + Prisma (PostgreSQL)
- `frontend/` — Vite + React + Tailwind + shadcn/ui + TanStack Query
- `infra/` — DevOps: Docker Compose, Dockerfile, Caddy reverse proxy, CI workflow
- `.opencode/` — AI-агенты, скиллы, AGENTS.md, конфиги OpenCode/Claude

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
- `UserPreference` — 1:1 настройки: `goals` (Json), `dailyReminder`, `onboardingDone`
- `Parameter` — справочник параметров (настроение/энергия/тревога/сон), read-only
- `Entry` — запись значения параметра, привязана к User и Parameter
- `Test` — шаблон теста (PHQ-9/GAD-7/Burns Anxiety/Depression/Когнитивные искажения), read-only
- `TestResult` — попытка пользователя с `score`, `interpretation`, `recommendation`, `flags` (Json)
- `TestScoreBand` — балльная шкала теста: `maxScore`, `key`, `interpretation`, `recommendation`
- `Achievement` — шаблон достижения: `key` unique, `criteria` (Json), награды (skin/title/petType/XP)
- `UserAchievement` — связь many-to-many User↔Achievement, `notified` flag
- `CreatureState` — 1:1 состояние существа: `calmness`, `energy`, `level`, `experience`, `streak`, косметика (String[])
- `PracticeCompletion` — лог выполненной практики: `source`, `xpAwarded`, `createdAt`
- `DailyMission` — ежедневное задание: `missionKey`, `labelKey`, `xpReward`, `claimed`
- `BreathingSession` — сессия дыхания: `duration`, `initialCalmness`, `finalCalmness`
- `CbaEntry` / `CbaEntryItem` — запись CBA (pros/cons weights, thought text, items)
- `CbaExample` / `CbaExampleItem` / `CbaExampleDistortion` — обучающие примеры CBA
- `CbaCommonItem` — банк типовых пунктов CBA
- `Feedback` — обратная связь от пользователя
- `OnboardingStory` — read-only контент для онбординга
- `Report` — генерация PDF/CSV отчёта
- `RefreshToken` / `ResetToken` — opaque hashed tokens c `expiresAt`
- `PushSubscription` — Web Push подписка: `endpoint` unique, `keys` (Json)

Parameter, Test, OnboardingStory, Achievement, CbaExample, CbaCommonItem не имеют пользовательского CRUD на MVP.

## Conventions

### Git workflow (develop/main)

**Ветки:**
- `develop` — основная ветка для ежедневной работы. Все коммиты и пуши — сюда.
- `main` — прод. Защищён на GitHub (push запрещён, только через PR).

**Работа:**
- Все коммиты идут в `develop` (по команде пользователя).
- Релиз в prod — только по команде «сделай PR в прод»: создаётся PR `develop → main` на GitHub.
- Conventional Commits (`feat:`, `fix:`, `chore:`).

### Нейминг

- `camelCase` — переменные, функции, методы, параметры.
- `PascalCase` — типы, интерфейсы, React-компоненты.
- `UPPER_SNAKE` — константы, env-переменные.
- Булевы — с префиксом `is`/`has`/`should` (`isLoading`, `hasError`).
- Без сокращений (кроме `id`, `url`, `ref`, `idx`).
- Без транслита.
- Одна буква — только в циклах/колбэках.

### Архитектура

#### Backend — трёхслойная

```
routes/  →  HTTP только (разбор запроса, вызов сервиса, ответ)
services/ →  бизнес-логика + Prisma (единственное место с импортом prisma)
lib/     →  PrismaClient, утилиты, error handler, CORS, cookies
plugins/ →  Fastify plugins (auth/JWT)
```

**Fastify 5 plugin system:**
- Каждый plugin обёрнут в `fp()` (`fastify-plugin`) для доступа из дочерних скоупов.
- Порядок регистрации строгий: `helmet → cors → cookie → rate-limit → authPlugin → routes → setErrorHandler` (`backend/src/index.ts:29-68`).
- `setErrorHandler` регистрируется **последним** (Fastify применяет его только к routes, зарегистрированным после).

**Route patterns:**
- Асинхронные функции-фабрики: `export default async function entryRoutes(fastify)`.
- `preHandler: [fastify.authenticate]` для защищённых эндпоинтов.
- Типизация запроса через inline generic: `fastify.post<{ Body: EntryCreateBody }>("/entries", ...)`.
- Ответ: `return reply.status(code).send({ ... })` или просто `return { ... }` (Fastify auto-send).
- Rate-limit: глобально 100 req/min, на мутирующие методы (POST/PATCH/PUT/DELETE) — 10 req/min, через `onRoute` hook (`index.ts:41-49`).

**Service layer:**
- Plain-object singletons: `export const entryService = { async create(input) { ... } }` — без классов и DI.
- Все async методы, user-scoped queries (`where: { id, userId }`) — row-level security на уровне приложения.
- Pagination: offset-based (`skip/take`), total count параллельно через `Promise.all([findMany, count])`.
- Service-to-service вызовы: `achievementsService.check(userId).catch(() => {})` — fire-and-forget.

**Dual-token auth:**
- Access: JWT (15 min, Bearer header), via `@fastify/jwt`.
- Refresh: opaque (SHA-256 hash в БД), httpOnly cookie, 7 days, one-time consumption (удаляется после использования).
- `fastify.authenticate` — декоратор (`fastify.decorate`), вызывает `request.jwtVerify()`, на ошибку возвращает 401.
- Module augmentation: `declare module "@fastify/jwt" { interface FastifyJWT { payload: { userId } } }`.
- Reset token: тот же opaque-hashed паттерн, 1 час жизни.

**Кастомная иерархия ошибок** (`lib/errors.ts`):
- `AppError(code, statusCode, message)` → `NotFoundError(404)`, `UnauthorizedError(401)`, `ConflictError(409)`, `ValidationError(400)`.
- Все `AppError` перехватываются `setErrorHandler` и возвращают `{ code, message }` (без stack trace).
- Неизвестные ошибки → `{ code: "INTERNAL", message: "Something went wrong" }` + лог через `request.log.error`.

**Prisma patterns:**
- Singleton PrismaClient в `lib/prisma.ts`.
- `findMany + count` для offset pagination (параллельно).
- `upsert` для UserPreference.
- `$transaction` для multi-table cleanup (удаление пользователя).
- `deleteMany` с user-scope (`where: { id, userId }`) вместо `delete`.
- Нет runtime-валидации (Zod отсутствует) — только TypeScript compile-time типы.

#### Frontend — Feature-based grouping

```
routes/     →  страницы (композиция виджетов + хуков), lazy-loaded через React.lazy()
components/ →  Layout.tsx + ui/ (button, card, dialog и т.д. — shadcn/ui primitives)
layout/     →  Sidebar, LayoutModals, BottomNav, nav-config
features/   →  8 доменных модулей с barrel index.ts
widgets/    →  самодостаточные блоки (WellbeingCard, MedicalDisclaimer и т.д.)
hooks/      →  общие React-хуки (TanStack Query, бизнес-логика)
lib/        →  API-клиент, утилиты, константы, типы
i18n/       →  i18next setup + locales (en/ru)
```

**State management:**
- **Server state**: TanStack Query v5 — `useQuery`/`useMutation`, всё (нет Redux/Zustand).
- **Auth state**: React Context (`AuthProvider`), in-memory token, silent refresh on mount.
- **Local UI state**: `useState`/`useMemo`/`useCallback`.

**TanStack Query patterns:**
- Query key naming: `["resource"]`, `["resource", id]`, `["resource", params]`.
- `staleTime` varies: 30s (entries), 60s (tests/parameters), 300s (user profile).
- On mutation success: `queryClient.invalidateQueries({ queryKey: ["resource"] })`.
- Global `onError` for mutations: `toast.error(getErrorMessage(error, t))` в `QueryClient` defaults.
- Single-flight 401 refresh: `refreshPromise` singleton — последующие 401 ждут тот же промис.

**Custom hooks conventions:**
- Data-fetching: `use{Resource}` — `useQuery` wrapper.
- Mutation: `use{Action}{Resource}` — `useMutation` + `invalidateQueries`.
- Domain logic: `useTestFlow`, `useLowMoodDetection`, `useAuthForms`, `useDailyCheckIn`.
- Feature-specific хуки внутри `features/<name>/use{Name}.ts`.
- Все хуки re-exported через barrel `index.ts`.
- Сложные hooks комбинируют `useState` + `useCallback` + `useMemo`.

**API client** (`lib/api.ts`):
- Custom fetch-based (без axios), base URL `/api` (Vite proxy → :3001).
- In-memory `accessToken: string | null = null`.
- Центральная `request<T>(path, options)` — headers, 401 handle, error → `ApiError`.
- `ApiError(code, message)` — выбрасывается из `request()` при `!res.ok`.
- Группировка методов: `api.entries.list()`, `api.auth.login()` — вложенный объект `api`.
- Auto-generated типы из OpenAPI: `openapi-typescript` → `lib/api-types.ts`.
- `credentials: "include"` для httpOnly refresh cookie.

**Feature module structure:**
```
features/cost-benefit-analysis/
  index.ts           — barrel (реэкспорт компонентов, hooks, types)
  cba.types.ts       — domain types
  useCba.ts          — hooks (useCbaExamples, useCbaEntries, useCreateCbaEntry, ...)
  CbaEntryForm.tsx   — компоненты
  CbaHistory.tsx
  ...
```

Каждый feature module экспортирует публичное API через `index.ts`. Внутренние детали не экспортируются.

**Styling patterns:**
- Tailwind CSS + `cn()` utility (clsx + tailwind-merge) — shadcn/ui стандарт.
- CVA (`class-variance-authority`) для вариативных компонентов.
- Все цвета через CSS custom properties (`hsl(var(--primary))`), в JSX только Tailwind classes.
- Custom animations: `value-pulse`, `bubble-up`, `creature-rise` и др. (`index.css`).
- `@media (prefers-reduced-motion: no-preference)` — уважаем системные настройки.
- Neumorphic shadows: dual shadow (light top-left, dark bottom-right), inset для инпутов.

**i18n patterns:**
- react-i18next, язык по умолчанию — `ru`, fallback — `en`.
- Dot-separated keys by feature: `dashboard.anxiety`, `errors.notFound`, `nav.dashboard`.
- Error messages mapped через `ERROR_CODE_MAP: Record<string, string>` → `getErrorMessage(error, t)`.
- Тестовый контент — EN в seed, RU в `test-content.ts`.

**Error handling frontend:**
- `ApiError(code, message)` — кастомный класс в `lib/api-error.ts`.
- Глобальный `onError` в QueryClient: `toast.error(getErrorMessage(error, t))`.
- Локальный `onError` в useMutation для специфичных сообщений.
- `getErrorMessage()`: instanceof ApiError → code → i18n key, иначе `Error.message`, иначе `"common.somethingWentWrong"`.

**Routing:**
- react-router-dom v7, lazy-loaded страницы через `React.lazy()` + `<Suspense>`.
- `ProtectedRoute` — проверяет `isAuthenticated`, редирект на `/login`.
- `PublicRoute` — редирект на `/` если уже авторизован.
- Bootstrap spinner пока проверяется auth статус.

**Styling компонентов:**
- Lucide React для иконок (SVG, inherit `text-muted-foreground` / `text-primary`).
- Sonner для toast-уведомлений (`toast`, `toast.custom` с CelebrationToast).
- Lottie для анимаций (`lottie-react`, `breathing-creature.json`).
- Recharts + @nivo/radar для графиков (dashboard, radar, trends).

#### Прекоммит-проверки

Перед коммитом убедиться:
- [package.json] `scripts` — `lint`, `format:check`, `typecheck` есть на обоих стеках
- [спрашивать] `npm run typecheck` в backend и frontend — ts ошибки не допускаются
- [backend] `npm run lint` — eslint
- [frontend] `npm run lint` — eslint + Prettier

#### Prisma Schema (25 моделей)

- Все PK: `String @id @default(cuid())`.
- Все FK: `<model>Id`, индексированы (`@@index([userId])`).
- 1:N связи: User → 11 дочерних моделей.
- 1:1: `UserPreference`, `CreatureState` (unique `userId`).
- Many-to-many: `UserAchievement` (junction, `@@unique([userId, achievementId])`).
- `onDelete: Cascade` только на child-моделях (CbaEntryItem, TestScoreBand и т.д.), User — Restrict.
- Нет Prisma enum — все String с прикладной валидацией.
- Json: `questions`, `flags`, `criteria`, `goals`, `keys`.
- String[]: `unlockedSkins`, `unlockedTitles`, `unlockedPetTypes`.
- Нет `@updatedAt` — все `createdAt @default(now())`.
- 5 миграций в `prisma/migrations/`.

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

- `@fastify/helmet` — CSP `default-src: 'none'`, `frame-ancestors: 'none'`.
- `@fastify/cors` — allowlist из `FRONTEND_URL`, crash в production если не установлен.
- `@fastify/rate-limit` — 100 req/min глобально, 10 req/min на мутирующие методы.
- JWT access (15 min, Bearer header) + opaque refresh (7 days, httpOnly cookie, SHA-256 hash, one-time).
- `bcrypt` (cost 10) для паролей.
- Prisma — параметризованные запросы (SQL injection невозможен).
- `.env` и secrets — в `.gitignore`, не коммитить.
- httpOnly cookie (secure в production) — не доступен JS.
- SameSite Lax (по умолчанию, конфигурируется через `COOKIE_SAMESITE`).
- Server-side token rotation: refresh/reset токены удаляются после использования.
- User-scoped queries: все `where` содержат `userId`.
- No error leaks: stack trace никогда не возвращается клиенту.
- Forgot-password: одинаковый ответ при любом email (защита от enumeration).
- Legal: `ageConfirmed`, `consentAcceptedAt`, `consentVersion` на User.

## UI Design System — Beyond Neumorphism

Стиль: **Neumorphism** (soft UI) для дневника настроения на лавандово-фиолетовой основе с зёленым акцентом.

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

## Тестирование

- Тестировать поведение, не реализацию.
- Один тест — один assert (или группа логически связанных).
- Mock только внешних зависимостей (API, БД), не внутренних функций.

### Backend тесты (Vitest + реальная БД)

**Config** (`vitest.config.ts`):
- `globals: true`, `environment: "node"`, `fileParallelism: false`, timeout 15s.
- Тесты идут **последовательно** (shared test DB).

**Setup** (`src/test/setup.ts`):
- `beforeAll`: `prisma db push --force-reset --accept-data-loss` — schema recreation per suite.
- DATABASE_URL = `moodly_test` (из `.env.test`), JWT_SECRET = `"test-secret"`.

**Helpers** (`src/test/helpers.ts`):
- `buildApp()` — создаёт `FastifyInstance` с теми же plugins/routes что production (без helmet/rate-limit/notificationRoutes).
- `logger: false`, `cors: { origin: true }`.

**Integration test pattern** (Fastify `inject`):
```typescript
const app = await buildApp();
const res = await app.inject({
  method: "POST",
  url: "/auth/register",
  payload: { email, password: "secret123", ageConfirmed: true },
});
const token = res.json().accessToken;
```
- No mocking: реальные запросы к `moodly_test` БД.
- PrismaClient `$disconnect()` в `afterAll`.
- Нет `vi.mock()` / sinon.

### Frontend тесты (Vitest + jsdom + Testing Library)

**Config** (`vitest.config.ts`):
- `globals: true`, `environment: "jsdom"`, setup: `@testing-library/jest-dom/vitest`.

**Unit tests:**
- Pure function testing: `isSevereInterpretation()` — без рендера.
- API client: `vi.fn()` вместо fetch, тесты: token attachment, 401 refresh, single-flight, failed refresh.
- No component rendering tests yet (преимущественно unit).

## Domain patterns

**Gamification:**
- `CreatureState` (1:1 с User): `calmness`, `energy`, `level`, `experience`, `streak`, `sessionCount`, `petType`, `activeSkin`, `activeTitle`, `unlockedSkins/Titles/PetTypes` (String[]).
- `PracticeCompletion`: `source` (PracticeSource enum), `xpAwarded`, `createdAt`.
- `Achievement`: `key` unique, `criteria` (Json), rewards (skin/title/petType/XP), `category`.
- `DailyMission`: per-user per-day, `missionKey`, `labelKey`, `xpReward`, `locked`, `claimed`, `sortOrder`.
- XP начисляется за completion практик, check-in, breathing sessions.
- Creature state обновляется параллельно: `Promise.all([creatureUpdate, practiceLog])`.
- Достижения проверяются fire-and-forget: `.catch(() => {})`.
- Фронтенд: 12 хуков в `useCreature.ts`, `CelebrationToast` через `toast.custom()`.

**Low Mood Detection:**
- 3+ consecutive days with avg mood value ≤ 3.
- Session dedup: `sessionStorage` key `"moodly_low_mood_shown"`.
- 3-second debounce before evaluation.
- Looks back 7 days of entry data.

**Stale Practices Detection:**
- Compares `PracticeCompletion` sources vs all `PracticeSource` values.
- Breathing special case: uses `lastExerciseAt` from creature state.
- Used by `useNavHighlights` для подсветки навигации.

**CBA (Cost-Benefit Analysis):**
- `CbaEntry`: `thoughtText`, `prosWeight` + `consWeight` (sum to 100), items advantage/disadvantage.
- `CbaExample`: обучающие примеры с persona, thought text, items, distortions.
- `CbaCommonItem`: банк типовых пунктов.
- Фронтенд: `CbaEntryForm`, `CbaHistory`, `CbaLibrary`, `CbaWeightSlider`.

**Check-In (Daily):**
- Определение: `!isToday(creature.lastCheckInAt)` — сравнение year/month/day.
- Mutation: `api.creature.checkIn()`, invalidates `["creature"]`.
- Local `dismissed` state — скрыть промпт после действия.
- Компоненты: `SleepHygieneChecklist`, `SleepHygieneChart`, `DailyCheckInModal`.

**Breathing:**
- Techniques: Box (4-4-4-4), 4-7-8 (Quick), 4-7-8 (Classic).
- Phases: Inhale → Hold → Exhale.
- Логика на фронтенде (таймеры, фазы, счетчики).
- Completion: `api.creature.completeExercise(duration)` — отправляет длительность, обновляет creature.
- Анимация: Lottie (`breathing-creature.json`).

**Навигация:**
- `useNavHighlights` определяет подсветку пунктов меню:
  - Dashboard: не было check-in сегодня
  - Practices: есть stale практики
  - Tests: нет результатов тестов за 14+ дней

## Infrastructure

**Docker Compose** (3 services):
- `postgres`: PostgreSQL 16, healthcheck.
- `backend`: Fastify, `prisma migrate deploy` в entrypoint, depends_on postgres.
- `edge`: Caddy reverse proxy — `/api/*` → backend, static SPA files, auto Let's Encrypt.

**Docker files:**
- Frontend: 3-stage build (contract build → frontend build → Caddy runtime).
- Backend: 2-stage (builder → runtime).

**CI/CD** (GitHub Actions, `infra/workflows/ci.yml`):
- Triggers: PR to main, push to main.
- 2 parallel jobs: `backend` + `frontend`.
- Backend: Postgres service container → npm ci → prisma generate → tsc --noEmit → lint → format:check → test.
- Frontend: npm ci → tsc --noEmit → lint → format:check → test.
- Node 22.

**Monitoring**: none yet (TODO).
