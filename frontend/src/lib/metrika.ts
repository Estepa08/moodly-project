// Клиентская интеграция Яндекс.Метрики (счётчик 111423518).
// Инлайн-сниппет из инструкции воспроизведён модулем: Caddy-политика CSP
// запрещает инлайн-скрипты (`script-src 'self'`), поэтому тег подключается
// динамически, а все команды идут через очередь window.ym.
// Хиты отправляются только на боевом домене (mymoodly.ru): в dev и во время
// пререндера страниц на localhost статистика не засоряется.

const METRIKA_ID = 111423518;
const TAG_URL = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
const PROD_HOSTS = new Set(["mymoodly.ru", "www.mymoodly.ru"]);

interface YmFunc {
  (...args: unknown[]): void;
  a?: unknown[][];
  l?: number;
}

type MetrikaWindow = Window & { ym?: YmFunc };

function isProductionDomain(): boolean {
  if (typeof window === "undefined") return false;
  return PROD_HOSTS.has(window.location.hostname.toLowerCase());
}

function installTag(): void {
  const w = window as MetrikaWindow;
  if (typeof w.ym === "function") return;
  for (let j = 0; j < document.scripts.length; j++) {
    if (document.scripts[j].src === TAG_URL) return;
  }
  const stub = ((...args: unknown[]) => {
    (stub.a = stub.a || []).push(args);
  }) as YmFunc;
  w.ym = stub;
  const script = document.createElement("script");
  script.async = true;
  script.src = TAG_URL;
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);
}

function ym(...args: unknown[]): void {
  const w = window as MetrikaWindow;
  if (typeof w.ym !== "function") {
    installTag();
  }
  const fn = w.ym as YmFunc | undefined;
  fn?.(...args);
}

function initParams(): unknown[] {
  return [
    {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    },
  ];
}

export function initMetrika(): void {
  if (!isProductionDomain()) return;
  installTag();
  ym(METRIKA_ID, "init", ...initParams());
}

export function trackPageView(url: string): void {
  if (!isProductionDomain()) return;
  ym(METRIKA_ID, "hit", url);
}