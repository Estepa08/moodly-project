.PHONY: install setup generate dev dev-backend dev-frontend build build-backend build-frontend
.PHONY: test test-backend test-frontend test-watch test-coverage
.PHONY: db-generate db-push db-seed db-setup db-reset clean lint

# ─── Install ────────────────────────────────────────────

install:
	cd api-contract && npm install
	cd backend && npm install
	cd frontend && npm install

setup: install generate db-setup

generate:
	cd api-contract && npm run build
	cd frontend && npm run generate:api

# ─── Development ────────────────────────────────────────

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

dev:
	cd backend && npm run dev &
	cd frontend && npm run dev

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

db-studio:
	cd backend && npx prisma studio

db-reset:
	cd backend && npx prisma db push --force-reset
	cd backend && npm run db:seed

# ─── Utils ──────────────────────────────────────────────

clean:
	rm -rf api-contract/node_modules api-contract/generated
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist

lint:
	@echo "No linter configured yet. Install one and update this target."

.PHONY: dev-watch test-watch-backend test-watch-frontend
.PHONY: test-coverage-backend test-coverage-frontend
.PHONY: db-generate db-push db-seed db-setup db-reset
