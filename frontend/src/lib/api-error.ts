export class ApiError extends Error {
  code: string;
  statusCode: number;
  constructor(code: string, message: string, statusCode = 0) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * True, когда запрос упал не от HTTP-статуса (ApiError), а на уровне сети:
 * ERR_CONNECTION_REFUSED / "Failed to fetch" / отказ DNS и т.п. — браузер
 * кидает TypeError. В этом случае операцию можно безопасно перевложить в
 * офлайн-очередь вместо потери данных.
 */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === 'TypeError') return true;
  return /failed to fetch|networkerror|failed to fetch resource|network/i.test(err.message);
}

/**
 * True, когда бэкенд ответил серверной ошибкой (5xx). Такая ошибка — это не
 * вина пользовательских данных, а временная проблема бэкенда/инфраструктуры
 * (деплой, перезапуск, перебои БД). Запись можно безопасно переложить в
 * офлайн-очередь, чтобы не потерять данные, и дофлашить её позже.
 */
export function isServerError(err: unknown): boolean {
  return err instanceof ApiError && err.statusCode >= 500 && err.statusCode < 600;
}
