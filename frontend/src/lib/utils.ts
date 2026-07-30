import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isWithinLastDays(dateStr: string, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(dateStr).getTime() >= cutoff;
}

export function formatDateShort(
  date: Date | string,
  lang?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  return d.toLocaleDateString(locale, options ?? { month: "short", day: "numeric" });
}

export function formatChartDate(
  date: Date | string,
  lang?: string,
  showYear?: boolean,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(showYear && { year: "numeric" }),
  });
}
