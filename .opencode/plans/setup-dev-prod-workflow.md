# Dev/Prod Workflow Setup

## 1. Создать env-файлы

**`frontend/.env.development`:**
```
VITE_DEMO_MODE=true
```

**`frontend/.env.production`:**
```
VITE_DEMO_MODE=false
```

Vite сам подхватит `.env.development` при `npm run dev` и `.env.production` при `npm run build`.

## 2. Backend: Мёртвый код

`frontend/src/lib/api.ts:201` — удалить строку:
```ts
demo: () => request<AuthResponse>("/auth/demo", { method: "POST" }),
```
Эндпоинта `/auth/demo` нет и не будет. Демо-логин идёт через обычный `POST /auth/login` с захардкоженными кредами.

## 3. Frontend: useAuthForms.ts

Добавить `handleDemo`:

```typescript
const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

const handleDemo = useCallback(async () => {
  acceptDisclaimer();
  setLoginError("");
  try {
    const res = await api.auth.login({ email: "demo@moodly.app", password: "demo123" });
    login(res.accessToken);
    navigate("/");
  } catch (err) {
    setLoginError(err instanceof Error ? err.message : t("login.demoFailed"));
  }
}, [login, navigate, t]);
```

Добавить в `return`: `handleDemo, demoMode`

## 4. Frontend: login.tsx

Добавить кнопку "Quick Demo" после строки с `or` (line 172), под условным рендерингом:

```tsx
{demoMode && (
  <>
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      onClick={handleDemo}
      {...a(5, isLogin)}
    >
      {t("login.quickDemo")}
    </Button>
    <div className="flex items-center gap-2" {...a(5, isLogin)}>
      <span className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">{t("login.or")}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  </>
)}
```

Деструктурировать `handleDemo, demoMode` из `useAuthForms()`.

## 5. Проверка

- `npm run dev` — кнопка "Quick Demo" видна, логинит как `demo@moodly.app / demo123`
- `npm run build && npm run preview` — кнопка скрыта, демо-вход недоступен

## 6. Dev → Prod процесс

| Шаг | Действие |
|-----|----------|
| 1 | Фича-ветка → `git checkout -b feat/xxx` |
| 2 | Разработка + локальное тестирование (seed + demo) |
| 3 | PR в `main` → Render preview env (auto) |
| 4 | Проверка на preview (если нужно — seed на preview БД) |
| 5 | Merge в `main` → Render auto-deploy |
| 6 | Проверка prod (без demo, чистая БД) |

Render preview env наследует `NODE_ENV=production` из `render.yaml`, поэтому demo-кнопка скрыта. Если нужно демо на preview — добавить env var `VITE_DEMO_MODE=true` через Render Dashboard → Env Groups → Preview.
