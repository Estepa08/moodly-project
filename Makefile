.PHONY: install setup generate dev dev-backend dev-frontend build build-backend build-frontend
.PHONY: test test-backend test-frontend test-watch test-coverage
.PHONY: db-generate db-push db-seed db-setup db-reset db-backup db-restore db-studio admin prod clean
.PHONY: db-prod-users db-prod-user-delete db-prod-studio db-prod-admin
.PHONY: db-prod-ru-users db-prod-ru-user-delete db-prod-ru-studio db-prod-ru-admin db-prod-ru-create-user
.PHONY: db-create-user db-prod-create-user
.PHONY: lint lint-backend lint-frontend lint-fix format format-check
.PHONY: start-feature

# ─── Install ────────────────────────────────────────────

install:
	cd api-contract && npm install
	cd shared && npm install
	cd backend && npm install
	cd frontend && npm install

setup: install generate db-setup

generate:
	cd api-contract && npm run build
	cd shared && npm run build
	cd frontend && npm run generate:api

# ─── Development ────────────────────────────────────────

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

# «make admin dev» передаёт «dev» как аргумент — в этом случае запуск проекта не выполняется.
dev:
	@$(if $(filter admin,$(MAKECMDGOALS)),:,cd backend && npm run dev & cd frontend && npm run dev)

# ─── Build ──────────────────────────────────────────────

build-backend:
	cd backend && npm run build

build-frontend:
	cd frontend && npm run build

build: generate build-backend build-frontend

# ─── Test ───────────────────────────────────────────────

test-backend:
	cd backend && npx vitest run

test-frontend:
	cd frontend && npx vitest run

test: test-backend test-frontend

test-watch-backend:
	cd backend && npx vitest

test-watch-frontend:
	cd frontend && npx vitest

test-watch: test-watch-backend test-watch-frontend

test-coverage-backend:
	cd backend && npx vitest run --coverage

test-coverage-frontend:
	cd frontend && npx vitest run --coverage

test-coverage: test-coverage-backend test-coverage-frontend

# ─── Database ───────────────────────────────────────────

db-generate:
	cd backend && npm run db:generate

db-push:
	cd backend && npm run db:push

db-seed:
	cd backend && npm run db:seed

db-setup: db-generate db-push db-seed

# Prisma Studio: «make admin dev» — dev-БД; «make admin prod» — прод-БД (backend/.env.prod);
# «make admin prod ru» — RU-прод (backend/.env.prod.ru.local).
# Заглушки dev/prod/ru нужны, чтобы make не выполнял их как отдельные таргеты при вызове admin.
admin:
	@case "$(filter-out $@,$(MAKECMDGOALS))" in \
	  dev) cd backend && npx prisma studio ;; \
	  *ru*) cd backend && set -a && . ./.env.prod.ru.local && set +a && npx prisma studio ;; \
	  prod) cd backend && set -a && . ./.env.prod && set +a && npx prisma studio ;; \
	  *) echo "Usage: make admin dev|prod|prod ru"; exit 1 ;; \
	esac

prod:
	@:

ru:
	@:

db-studio:
	cd backend && npx prisma studio

db-reset:
	cd backend && npx prisma db push --force-reset
	cd backend && npm run db:seed

# Прод-БД (Render). DATABASE_URL берётся из backend/.env.prod.
# Пример: make db-prod-users
# Пример: make db-prod-user-delete ARGS="--email=user@example.com --yes"
# Пример: make db-prod-admin ARGS="--email=user@example.com"

db-prod-users:
	cd backend && node --env-file=.env.prod --import tsx src/scripts/db-prod-users.ts

db-prod-user-delete:
	cd backend && node --env-file=.env.prod --import tsx src/scripts/db-prod-user-delete.ts $(ARGS)

db-prod-studio:
	cd backend && set -a && . ./.env.prod && set +a && npx prisma studio

db-prod-admin:
	cd backend && node --env-file=.env.prod --import tsx src/scripts/db-prod-admin.ts $(ARGS)

# Создание/обновление пользователя (создание админа для входа в админку).
# Пример: make db-create-user ARGS="--email=step.evgeny@gmail.com --password=<пароль> --admin"
# Пример: make db-prod-create-user ARGS="--email=step.evgeny@gmail.com --password=<пароль> --admin"

db-create-user:
	cd backend && node --env-file=.env --import tsx src/scripts/db-create-user.ts $(ARGS)

db-prod-create-user:
	cd backend && node --env-file=.env.prod --import tsx src/scripts/db-create-user.ts $(ARGS)

# RU-прод (Docker Host — my.dockhost.ru). DATABASE_URL берётся из backend/.env.prod.ru.local.
# Пример: make db-prod-ru-users
# Пример: make db-prod-ru-create-user ARGS="--email=user@example.com --password=<пароль> --admin"

db-prod-ru-users:
	cd backend && node --env-file=.env.prod.ru.local --import tsx src/scripts/db-prod-users.ts

db-prod-ru-user-delete:
	cd backend && node --env-file=.env.prod.ru.local --import tsx src/scripts/db-prod-user-delete.ts $(ARGS)

db-prod-ru-studio:
	cd backend && set -a && . ./.env.prod.ru.local && set +a && npx prisma studio

db-prod-ru-admin:
	cd backend && node --env-file=.env.prod.ru.local --import tsx src/scripts/db-prod-admin.ts $(ARGS)

db-prod-ru-create-user:
	cd backend && node --env-file=.env.prod.ru.local --import tsx src/scripts/db-create-user.ts $(ARGS)

# Резервное копирование и восстановление прод-БД через стандартные утилиты
# Postgres — одинаково работают для Render, Neon, Supabase и т.д.
# DATABASE_URL берётся из backend/.env.prod.
# Пример: make db-backup
# Пример: make db-restore FILE=backups/moodly-20260801.sql
# Утилиты: предпочитаем свежие клиенты из Homebrew libpq (совместимы с новыми
# серверами, напр. Render Postgres 18), иначе системные pg_dump/psql.
PG_DUMP ?= $(shell test -x /opt/homebrew/opt/libpq/bin/pg_dump && echo /opt/homebrew/opt/libpq/bin/pg_dump || echo pg_dump)
PSQL ?= $(shell test -x /opt/homebrew/opt/libpq/bin/psql && echo /opt/homebrew/opt/libpq/bin/psql || echo psql)

db-backup:
	@mkdir -p backups
	@set -a; . backend/.env.prod; set +a; \
	  STAMP="$$(date +%Y%m%d-%H%M%S)"; \
	  TMP="backups/.moodly-$$STAMP.tmp"; \
	  $(PG_DUMP) "$$DATABASE_URL" --no-owner > "$$TMP" && test -s "$$TMP" \
	    && mv "$$TMP" "backups/moodly-$$STAMP.sql" \
	    && echo "Backup saved to backups/moodly-$$STAMP.sql ($$(wc -c < backups/moodly-$$STAMP.sql) bytes)" \
	    || { echo "ERROR: dump failed or is empty, no file written" >&2; rm -f "$$TMP"; exit 1; }

db-restore:
	@test -n "$(FILE)" || (echo "Usage: make db-restore FILE=path.sql"; exit 1)
	@test -f "$(FILE)" || (echo "File not found: $(FILE)"; exit 1)
	@set -a; . backend/.env.prod; set +a; \
	  $(PSQL) "$$DATABASE_URL" < "$(FILE)"

# ─── Dev/Prod Workflow ──────────────────────────────────

start-feature:
	bash .opencode/scripts/start-feature.sh $(filter-out $@,$(MAKECMDGOALS))

# ─── Utils ──────────────────────────────────────────────

clean:
	rm -rf api-contract/node_modules api-contract/generated
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist

lint-backend:
	cd backend && npm run lint

lint-frontend:
	cd frontend && npm run lint

lint: lint-backend lint-frontend

lint-fix:
	cd backend && npm run lint:fix
	cd frontend && npm run lint:fix

format:
	cd backend && npm run format
	cd frontend && npm run format

format-check:
	cd backend && npm run format:check
	cd frontend && npm run format:check

.PHONY: dev-watch test-watch-backend test-watch-frontend
.PHONY: test-coverage-backend test-coverage-frontend
.PHONY: db-generate db-push db-seed db-setup db-reset db-backup db-restore
