# Moodly

Простой дневник настроения — замечайте, как меняется ваше состояние день за днём.

- `api-contract/` — TypeSpec-контракт API (источник истины)
- `backend/` — Fastify + TypeScript + Prisma (PostgreSQL) API-сервер
- `frontend/` — Vite + React + Tailwind PWA-приложение с i18n и тестами

## Разработка контракта

```sh
cd api-contract
npm install
npm run build    # → generated/openapi.yaml
```
