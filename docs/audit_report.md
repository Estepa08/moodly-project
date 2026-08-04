# Отчет об аудите проекта Moodly для подготовки к выводу в продакшн

Дата аудита: 2026-08-04. Режим: read-only, изменения не вносились.

## Общая информация

- **Название:** Moodly — дневник настроения, трекинг самочувствия, психологические тесты, питомцы-компаньоны.
- **Стек технологий:**
  - Backend: Node.js 22 + Fastify 5 + TypeScript + Prisma 6 (PostgreSQL)
  - Frontend: React 19 + TypeScript + Vite 6 + Tailwind (PWA, i18n ru/en)
  - Инфраструктура: Docker (Caddy + Fastify в едином образе), Docker Host DockHost (RU-прод), Render (staging)
  - Синк: offline-first через Dexie (IndexedDB), LWW, tombstone

## Сводка готовности

**Код зрелый, тесты есть (93 backend, ~71 frontend, ~24 e2e), но есть критические блокеры безопасности и незавершённый инфраструктурный переезд. Запуск в текущем состоянии небезопасен.**

| Аспект | Оценка |
|---|---|
| Архитектура, роутинг, сервисы | ✅ Зрелая |
| Обработка ошибок / логирование | ✅ Хорошая |
| JWT / refresh-ротация / cookies | ✅ Хорошая |
| Валидация auth-эндпоинтов | ✅ Хорошая |
| Валидация остальных эндпоинтов | 🔴 Критический пробел (PATCH /users/me) |
| Rate limit / trustProxy | ⚠️ Настроен, но за reverse proxy бьёт мимо |
| Миграции / Docker | ⚠️ Хорошо, кроме directUrl для Neon-pooler и root в контейнере |
| Тесты | ✅ Есть, но CI не покрывает ветку прод-деплоя |
| Секреты | ⚠️ В файлах проекта, а не в секрет-менеджере |
| Инфраструктура RU-прода | ⚠️ Переезд на DockHost в работе |
| Юридическое соответствие РФ | ⚠️ База заложена, есть блокеры (оператор, РКН) |

---

## 1. Блокеры (критично, исправить до запуска)

### 1.1 Эскалация привилегий через PATCH /users/me и PATCH /entries/:id
`request.body` передаётся в Prisma без whitelist-полей. Типизация — только compile-time; в runtime клиент может прислать `{"role":"admin"}` и стать админом (поле `role` есть в модели User).

- `backend/src/routes/users.ts:22-28` → `userService.update(userId, request.body)`
- `backend/src/services/user.ts:92-98` → `prisma.user.update({ where: { id }, data })`
- `backend/src/routes/entries.ts:52-57` → `entryService.update(params.id, userId, body)`
- `backend/src/services/entry.ts:90-94` — update по `id` после проверки принадлежности; body без whitelist.

**Фикс:** zod-схемы / явный `pick` допустимых полей перед записью в Prisma.

### 1.2 Нет React ErrorBoundary
В `frontend/src` 0 вхождений `componentDidCatch` / `getDerivedStateFromError`. Любая ошибка рендера роняет всё приложение на белый экран.

**Фикс:** ErrorBoundary с fallback-UI, сбросом ошибки и (желательно) отправкой в клиентский логгер.

### 1.3 Контейнеры от root + dev-зависимости в проде
- Корневой `Dockerfile`, `backend/Dockerfile`, `infra/Dockerfile.frontend` — нет директивы `USER`, процесс работает от root. *(решено: отдельные Dockerfile удалены, остался корневой монолитный — `USER node` + setcap для Caddy, см. Этап 1/5)*
- `npm ci` без `--omit=dev` (нужен `prisma` CLI для `migrate deploy`) — dev-зависимости в прод-образе, лишняя поверхность атаки.
- `HEALTHCHECK` в Dockerfile не объявлен (healthcheck есть только у postgres в compose и на уровне Caddy).

**Фикс:** `USER node`, отдельная стадия/шаг для `prisma migrate`, `HEALTHCHECK` в Dockerfile.

---

## 2. Высокие риски

### 2.1 Rate limit за reverse proxy бьёт мимо
- `trustProxy` не включён (`backend/src/index.ts`) — за прокси DockHost/Render `request.ip` = адрес прокси → лимит фактически общий на всех пользователей.
- Write-лимит 10 req/мин в проде может блокировать легитимные sync-батчи.

### 2.2 CI не покрывает прод-ветку, автодеплоя нет
- `.github/workflows/ci.yml` — триггеры только `main`/`develop`, а RU-прод деплоится с ветки `russia`.
- Деплой-джобов нет (ни GitHub Actions, ни иной автодеплой). *(решено: CI/e2e расширены на `russia`; автодеплой — панель DockHost тянет git-репо и пересобирает на push, см. Этап 5)*

### 2.3 Секреты в файлах проекта
- `backend/.env.prod`, `backend/.env.prod.ru.local` (реальные креды Neon/DockHost, JWT_SECRET) лежат локально, gitignored.
- `backend/.env.test` закоммичен в git (тест-секрет, но трекается в истории).
- Секрет-менеджер (secrets в CI/хостинге) для прод-окружения используется не полностью.

### 2.4 Бэкапы БД не автоматизированы
- Только ручной `make db-backup`; cron не настроен нигде.
- В `backups/` 2 из 4 дампов пустые (0 байт) — успешность прошлых бэкапов под вопросом.

### 2.5 Переезд на DockHost в работе
- `infra/Caddyfile` — `auto_https off`, чистый HTTP на `:80`; ручной GlobalSign-сертификат (`infra/certs/`) в образ не копируется и не используется. *(решено: ручной GlobalSign отменён — TLS закрывает Traefik панели DockHost, см. Этап 5)*
- `infra/docker-compose.yml` (edge + backend) несовместим с Caddyfile: жёсткий `localhost:3001` вместо `backend:3001` → 502 в compose-топологии. *(решено: compose-путь удалён как мёртвый, единственный путь — корневой `Dockerfile`, см. Этап 5)*

### 2.6 Caddy без security-заголовков
- Нет HSTS, X-Frame-Options, X-Content-Type-Options, CSP на edge.

### 2.7 PWA-иконки и offline-навигация
- Только SVG-иконки (не поддерживаются iOS Home Screen); нет PNG 180×180 `apple-touch-icon`.
- В service worker нет `navigateFallback`/`navigationPreload` → офлайн deep-links при чистом кэше не открываются.

### 2.8 sslmode=disable
- RU-конфиг (`backend/.env.prod.ru.example`) — `DATABASE_URL` с `sslmode=disable` — трафик к Postgres без TLS.

---

## 3. Средние риски

- **Нет единой валидации env** (zod-схемы). `NODE_ENV` не задан → cookie без `Secure` (`backend/src/lib/refresh-cookie.ts:16`). `DATABASE_URL` не проверяется на старте.
- **`DIRECT_URL` не используется приложением**, в `schema.prisma` нет `directUrl` — при Neon-pooler миграции (`prisma migrate deploy`) идут через пулер, риск.
- **Гонки check-then-act** (двойное начисление при параллельных запросах): лимит записей `entryService.create` (`services/entry.ts:51-59`), `creature.checkIn` (`services/creature.ts:359-408`), `claimMission` (нет conditional update, `services/creature.ts:296-326`), XP достижений вне транзакции (`services/achievements.ts:104-142`).
- **Нет клиентского логирования ошибок** (Sentry/аналог, `window.onerror`) — прод «слеп» к ошибкам пользователей.
- **Большой первый экран** ~1.6MB JS до gzip: `index` 737KB + `modulepreload` vendor-charts 582KB + vendor-anim 317KB; нет бюджета бандла в CI; оба i18n-локаля (~140KB) грузятся сразу.
- **Нет CSP/SRI** в `frontend/index.html`; Google Fonts — внешние, рендер-блокирующие.
- **`pre-commit`-хук отсутствует** — работает только `pre-push` (`.husky/`).
- **Мёртвые зависимости:** `@tanstack/react-router`, `@types/three` в `frontend/package.json`.
- **Документация устарела:** README/AGENTS.md/старый отчёт называли бэкенд «Go 1.22» — фактически Fastify + TypeScript.

---

## 4. Низкие

- Числа в query-параметрах не валидируются (`skip`/`take`/`days` → `parseInt("abc")` → `NaN` уходит в Prisma).
- Сообщения внутренних ошибок уходят клиенту в `routes/creature.ts:100-107`, `routes/achievements.ts:29-34` (не стек, но детали).
- `emailVerified` при регистрации всегда `true` — верификация email не работает.

---

## 5. Сильные стороны (подтверждено)

- **Токены:** access — только в памяти; refresh — httpOnly + Secure + SameSite cookie, одноразовая ротация, хранение sha256 в БД.
- **Безопасность HTTP:** `@fastify/helmet` со строгим CSP, CORS-allowlist из `FRONTEND_URL` с падением на старте при отсутствии в проде.
- **XSS/SQLi:** 0 вхождений `dangerouslySetInnerHTML`/`innerHTML`; raw-SQL не используется, всё через Prisma с параметризацией.
- **Секреты:** в git-историю реальные секреты никогда не попадали; `.env*`, `infra/certs` и `backups/` в `.gitignore`.
- **Тесты:** 93 backend (интеграционные, реальная БД), ~71 frontend, ~24 e2e Playwright; покрытие фронта ~69-72%.
- **Offline-first синк:** Dexie, LWW, tombstone, outbox-очередь, дневной лимит, покрыт тестами.
- **Сетевые границы:** postgres и backend в compose наружу не проброшены.
- **Миграции:** 16 миграций с SQL-триггерами `set_updated_at` для синка.
- **Локализация данных РФ:** RU-прод БД на территории РФ (DockHost).

---

## 6. Юридическое соответствие РФ (152-ФЗ и смежное)

Статус: база заложена, но есть блокеры, требующие действий оператора вне кода.

### Реализовано ✅
- Два отдельных согласия при регистрации: 18+ и на обработку ПДн (включая спецкатегории, ст. 10) — `frontend/src/routes/register.tsx:78-111`.
- Серверная валидация возраста ≥18 + хранение года рождения — `backend/src/services/user.ts:52-53,67`.
- Фиксация согласия: `consentVersion: "2.0"` + `consentAcceptedAt` — `backend/src/services/user.ts:68-69`.
- Политика ПДн (11 разделов, `frontend/src/routes/privacy.tsx`): основания (ст. 6, 9), состав данных, спецкатегории (ст. 10), цели, передача третьим лицам, трансграничная передача (ст. 12), сроки хранения, меры защиты (ст. 18.1, 19), права субъекта (ст. 14), сроки ответа 10 раб. дней (ст. 20), контакты.
- Условия (`frontend/src/routes/terms.tsx`): акцепт, применимое право РФ, обязанности, медицинский дисклеймер.
- Медицинский дисклеймер в футере, онбординге, тестах, SupportResources.
- Локализация данных: RU-прод БД на территории РФ — ст. 18 ч. 5 152-ФЗ.

### Блокеры 🔴 (вне кода)
- **Оператор не идентифицирован** — в политике плейсхолдеры `[Наименование юрлица/ИП], ИНН, ОГРН/ОГРНИП, адрес` (`frontend/src/i18n/locales/ru/translation.json:758`). Без юрлица/ИП формально нет оператора ПДн.
- **Уведомление РКН об обработке** (ст. 22 152-ФЗ) и внесение в реестр операторов не оформлено.

### Риски ⚠️ (нужна проверка юристом)
- **Форма согласия на спецкатегории:** чекбокс ≠ «письменная форма» (ст. 9 ч. 4 + ст. 10 ч. 2 п. 1) — для спецкатегорий (психологические данные) требуется письменное согласие, электронное — только с ЭП. Фиксируется только метка времени без текста/версии согласия.
- **Трансграничная передача** (ст. 12): политика допускает зарубежные сервисы «в период разработки» (Neon-США, Resend, Google Fonts). После переезда хранение в РФ, но почтовый сервис и шрифты могут быть за рубежом → может потребоваться уведомление РКН о трансграничной передаче.
- **Полнота по Приказу РКН № 18** (требования к содержанию политики): заявлено 14 разделов, на странице 11 секций — проверить покрытие всех требований.
- **Верификация email:** `emailVerified` всегда `true` — слабее подтверждение личности субъекта при исполнении прав (ст. 14, 20).

### Не требуется
- Cookie-баннер (только httpOnly auth-cookie, не трекинговые).
- Отдельное согласие на push-уведомления по 152-ФЗ.
- Лицензия на медицинскую деятельность (сервис позиционирован как инструмент самооценки, не медуслуга).

### Action-лист для оператора
1. Определить юрлицо/ИП и заполнить реквизиты в политике.
2. Подать уведомление в РКН об обработке ПДн (включая спецкатегории), получить номер в реестре.
3. Получить письменное заключение юриста по форме согласия на спецкатегории.
4. Решить вопрос трансграничной передачи (Resend/Google Fonts) — уведомление РКН или исключение зарубежных сервисов.
5. Сверить политику с Приказом РКН № 18 (14 требований).
6. Рассмотреть верификацию email.

---

## 7. Чек-лист к запуску

### Технические блокеры
- [ ] Whitelist-полей в `PATCH /users/me` и `PATCH /entries/:id` (эскалация привилегий)
- [ ] React ErrorBoundary
- [ ] Docker: `USER node`, `npm ci --omit=dev`, `HEALTHCHECK`
- [ ] `trustProxy` + валидация env
- [ ] `sslmode=require`
- [ ] Security-заголовки в Caddy
- [ ] `.env.test` вынести из git

### Инфраструктура
- [x] Завершить переезд на DockHost: подключить GlobalSign-серт в образ, выровнять compose/Caddyfile *(решено: GlobalSign отменён — TLS через Traefik панели; compose удалён как мёртвый путь; единственный — корневой Dockerfile)*
- [x] Настроить cron-бэкапы pg_dump (и проверить прошлые пустые дампы) *(решено: cron не нужен — бэкапы закрываются средствами DockHost; скрипт `infra/moodly-backup.sh` готов)*
- [x] CI на ветку `russia`; автодеплой *(сделано: `ci.yml`/`e2e.yml` + ветка `russia`; автодеплой через панель DockHost по git-push)*
- [ ] Перейти с Render free-plan (засыпание контейнеров) на DockHost

### Надёжность и UX
- [ ] Транзакции против гонок (entry лимит, checkIn, claimMission, XP)
- [ ] Клиентское логирование ошибок
- [ ] PWA: PNG-иконки 180×180, `navigateFallback`
- [ ] Бюджет бандла в CI, снять preload vendor-charts/vendor-anim, split i18n
- [ ] Удалить мёртвые зависимости (`@tanstack/react-router`, `@types/three`)

### Юридическое
- [ ] Оператор + реквизиты в политике
- [ ] Уведомление РКН (реестр операторов)
- [ ] Форма согласия на спецкатегории (заключение юриста)
- [ ] Трансграничная передача (ст. 12)
- [ ] Сверка политики с Приказом РКН № 18

### Документация
- [ ] README/AGENTS.md: стек (Fastify, не Go)

---

## 8. Изменения после аудита

Подробный план работ и статус — в `docs/plans/production-launch.md`. Реестр решений — `docs/decisions/decisions.md`.
