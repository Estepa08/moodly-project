# Перенос базы данных между провайдерами

Руководство по быстрой смене PostgreSQL-провайдера (Render Postgres → Neon,
Neon → Supabase, → платный Render и т.д.). Проект использует Prisma ORM,
поэтому переход сводится к трём действиям: **бэкап → импорт в новую БД →
переключение connection strings**.

## Принципы

- Приложение и инструменты всегда читают две переменные:
  - `DATABASE_URL` — подключение для рантайма (у провайдеров с пулером —
    pooled URL: Neon `-pooler`, Supabase `:6543`).
  - `DIRECT_URL` — прямое подключение для Prisma CLI (миграции, introspection)
    и утилит (`pg_dump`/`psql`). Задаётся в `datasource` блока `schema.prisma`
    как `directUrl`.
- Миграции применяются только через `DIRECT_URL` (`prisma migrate deploy`
  в `docker-entrypoint.sh`), чтобы обойти пулер.
- Данные переносятся стандартными `pg_dump`/`psql` — не зависит от провайдера.
- Старая БД не удаляется, пока новая не проверена.

## Текущая настройка

- Хостинг: Render (web-сервис `moodly`, Docker).
- БД: Neon (managed Postgres). Секреты `DATABASE_URL`/`DIRECT_URL` заданы
  вручную в панели Render (`render.yaml` использует `sync: false`).
- Локальные прод-скрипты (`make db-prod-*`) читают `backend/.env.prod`.

## Как проверить подключение

```bash
# Прод-БД (из backend/.env.prod)
make db-prod-users
# Хост, на который смотрит прод
node --env-file=backend/.env.prod -e "console.log(new URL(process.env.DATABASE_URL).host)"
```

## Полная миграция на нового провайдера

### 1. Бэкап текущей БД

```bash
make db-backup
# -> backups/moodly-YYYYMMDD-HHMMSS.sql
```

### 2. Создать БД у нового провайдера

Neon: console.neon.tech → New Project → БД `moodly`. Из раздела Connection
details скопировать:
- **Pooled**: `...-pooler...neon.tech/neondb?sslmode=require` → `DATABASE_URL`
- **Direct**: `...neon.tech/neondb` (без `-pooler`) → `DIRECT_URL`

### 3. Импортировать данные (в пустую БД)

Полный дамп создаёт таблицы и таблицу `_prisma_migrations` с записями
применённых миграций, поэтому импортировать нужно именно в пустую БД:

```bash
psql "postgres://...direct..." < backups/moodly-YYYYMMDD-HHMMSS.sql
psql "postgres://...direct..." -c '\dt'   # проверить таблицы
```

> Если таблицы в целевой БД уже есть (случайно выполнен `migrate deploy`
> до импорта), полный дамп упадёт с `table "User" already exists`. Решение:
> пересоздать БД у провайдера и импортировать заново, либо импортировать
> только данные (`pg_dump --data-only`).

### 4. Проверить миграции (опционально)

```bash
# Всё уже применено дампом — deploy ничего не накатывает.
DIRECT_URL="postgres://...direct..." DATABASE_URL="postgres://...direct..." \
  npx prisma migrate deploy
```

### 5. Переключить приложение

- Локально: обновить `DATABASE_URL` (pooled) и `DIRECT_URL` (direct)
  в `backend/.env.prod`.
- Render: Dashboard → сервис `moodly` → Environment → обновить значения
  `DATABASE_URL` и `DIRECT_URL` → Save.
- Деплой: `git push origin main` (или Redeploy в панели).

### 6. Проверка

```bash
curl -s https://moodly-oyew.onrender.com/api/health
make db-prod-users
```
Проверить вход в приложение и пару сценариев записи данных.

### 7. Выключение старой БД

Старую БД держать **минимум 14 дней** как резервный вариант. Только после
устойчивой работы нового провайдера удалить её в панели Render/Neon.

## Rollback

Откат = вернуть прежние `DATABASE_URL`/`DIRECT_URL` в панели Render и
`backend/.env.prod`, затем Redeploy. Данные старой БД не затронуты, пока она
жива.

## Восстановление из дампа (аварийный сценарий)

```bash
make db-restore FILE=backups/moodly-YYYYMMDD-HHMMSS.sql
```

## Замечания по провайдерам

- **Neon free**: сон через 5 мин простоя, автопробуждение 1-3 сек при запросе;
  лимит 190 compute-часов/мес. Пул — pooled URL.
- **Supabase free**: пауза после 7 дней без БД-запросов, восстановление только
  вручную через dashboard. Для Prisma: pooled URL `:6543?pgbouncer=true`
  в `DATABASE_URL`, direct `:5432` в `DIRECT_URL`.
- **Render Postgres**: пулера нет — `DATABASE_URL` и `DIRECT_URL` совпадают.
