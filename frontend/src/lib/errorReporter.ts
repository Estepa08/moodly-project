// Лёгкое клиентское логирование ошибок (Sentry-аналог без внешних зависимостей):
// перехватывает window.onerror и unhandledrejection, шлёт на POST /api/client-errors.
// Логируются только технические поля; дедуп + троттлинг + очередь, чтобы
// не заливать прод-лог и не порождать рекурсивные ошибки логирования.

const REPORT_URL = "/api/client-errors";
const MIN_INTERVAL_MS = 2000;
const MAX_QUEUE = 50;

interface ClientError {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  url?: string;
  userAgent?: string;
}

const queue: ClientError[] = [];
let lastSentAt = 0;
let sending = false;

function enqueue(error: ClientError): void {
  const last = queue[queue.length - 1];
  if (last && last.message === error.message && last.source === error.source) {
    return;
  }
  if (queue.length < MAX_QUEUE) {
    queue.push(error);
  }
  void drain();
}

async function drain(): Promise<void> {
  if (sending) return;
  const now = Date.now();
  const wait = lastSentAt + MIN_INTERVAL_MS - now;
  if (wait > 0) {
    window.setTimeout(() => void drain(), wait);
    return;
  }
  const error = queue.shift();
  if (!error) return;
  sending = true;
  try {
    await fetch(REPORT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(error),
      keepalive: true,
    });
    lastSentAt = Date.now();
  } catch {
    // намеренно молчим: ошибки логирования не логируем
  } finally {
    sending = false;
    void drain();
  }
}

export function reportError(error: ClientError): void {
  enqueue(error);
}

export function initErrorReporting(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    enqueue({
      message: event.message,
      source: event.filename ?? undefined,
      lineno: event.lineno || undefined,
      colno: event.colno || undefined,
      stack: event.error instanceof Error ? event.error.stack : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    enqueue({
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  });
}
