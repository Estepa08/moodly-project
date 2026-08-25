// Общие для db-*.ts скриптов утилиты: показать, к какому хосту БД
// подключился скрипт (защита от опечатки в DATABASE_URL при прод-операциях),
// и разобрать `--flag`/`--key=value` аргументы командной строки.

export function dbHost(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return 'не задан (нужен DATABASE_URL)';
  try {
    return new URL(url).host;
  } catch {
    return url.split('@').pop() ?? url;
  }
}

export interface ParsedArgs {
  flags: Set<string>;
  values: Map<string, string>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  for (const a of argv) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq === -1) {
        flags.add(a);
      } else {
        values.set(a.slice(0, eq), a.slice(eq + 1));
      }
    }
  }
  return { flags, values };
}
