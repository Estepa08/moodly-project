# AGENTS.md

## Project

Moodly — трекер ментального здоровья. Единственная реализованная часть — API-контракт.

## Directory layout

- `api-contract/` — TypeSpec-контракт API (источник истины)
- `backend/` — пока пусто, для API-сервера
- `frontend/` — пока пусто, для React-приложения

## Commands

```sh
cd api-contract
npm install
npm run build          # tsp compile . → generated/openapi.yaml
```

Прямая компиляция: `npx tsp compile .`

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
