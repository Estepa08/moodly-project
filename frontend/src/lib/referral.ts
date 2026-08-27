// Реферальная ссылка «пригласи подругу» (Сессия 8, three-personas-design-gaps.md).
//
// Формат: https://mymoodly.ru/?ref=<код>. Код — НЕ сырой User.id. Причина: URL
// с query-параметром реплицируется во множество мест, которые пользователь не
// контролирует — историю браузера получателя, referrer-заголовки при переходе
// на внешние ссылки из тех же соцсетей, серверные/CDN-логи, полные данные
// визита в Яндекс.Метрике. Раздавать туда настоящий первичный ключ из БД нет
// смысла, даже если это не секрет уровня пароля. Вместо этого код — короткий
// необратимый хэш userId: тот же приём (FNV-1a), что уже применяется на
// бэкенде для детерминированного выбора времени в окне напоминаний
// (backend/src/jobs/reminder-scheduler.ts). Обратный маппинг код → userId
// нигде не строится и не нужен: минимальное отслеживание конверсии в этой
// сессии — по логам/целям Метрики на сам код, без серверной таблицы
// рефералов (см. критерии сессии — полноценная атрибуция сознательно не
// делается).
const HASH_RADIX = 36;

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Короткий непрямой код для userId — стабильный, но не обратимый в userId. */
export function getReferralCode(userId: string): string {
  return fnv1aHash(userId).toString(HASH_RADIX);
}

/** Полная реферальная ссылка на текущий домен (или mymoodly.ru при SSR/тестах). */
export function getReferralLink(userId: string): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://mymoodly.ru';
  return `${origin}/?ref=${getReferralCode(userId)}`;
}

const REF_STORAGE_KEY = 'moodly:referral-code';

/**
 * Читает `?ref=` из query-строки лендинга и сохраняет в sessionStorage — тем
 * же приёмом, что `markSeoTrafficOrigin` в lib/seo.ts (Сессия 3): по значению
 * нужно дожить от захода на лендинг до отправки формы регистрации, которая
 * может случиться на другом роуте несколько шагов спустя, а `document.referrer`
 * для этого не подходит (SPA-навигация без перезагрузки документа).
 */
export function captureReferralCode(search: string): string | null {
  if (typeof window === 'undefined') return null;
  const ref = new URLSearchParams(search).get('ref');
  if (!ref) return null;
  try {
    window.sessionStorage.setItem(REF_STORAGE_KEY, ref);
  } catch {
    // sessionStorage недоступен (приватный режим, квота и т.п.) — атрибуция
    // этого захода просто не сработает, не критично для регистрации.
  }
  return ref;
}

/** Читает ранее сохранённый реферальный код текущей вкладки/сессии, если есть. */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}
