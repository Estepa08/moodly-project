// Публичный VAPID-ключ (application server key) для push-уведомлений.
// Это НЕ секрет: ключ всё равно уходит в браузер при подписке.
// Значение захардкожено как гарантированный fallback: если build-переменная
// VITE_VAPID_PUBLIC_KEY не была передана на этапе сборки (например, на панели
// DockHost нет поддержки build-переменных), push всё равно работает.
// Ключ должен совпадать с VAPID_PUBLIC_KEY в backend/.env (та же пара).
export const VAPID_PUBLIC_KEY =
  "BKI-sDzgNuRgtWjOwrVegsuNpFBuY2BazP5k-LngBpO6QXLXywXDDNftcEzpG1gJd025LIOtPwgPYLENK4FQbHM";

// Приоритет: build-переменная Vite (VITE_VAPID_PUBLIC_KEY), иначе — hardcoded ключ.
// Vite инлайнит import.meta.env.VITE_* на этапе сборки.
export function getVapidPublicKey(): string {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY;
}