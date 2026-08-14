import type { DistortionKey } from './distortionsQuiz';
import type { DecryptedEntry } from '../hooks/useEntries';

export interface ReframeLibraryEntry {
  alternativeThought: string;
  createdAt: string;
  beliefBefore?: number;
  beliefAfter?: number;
}

/**
 * Ищет самое недавнее переосмысление мысли для данного искажения — чтобы
 * показать «в прошлый раз тебе помогло» вместо общего совета из библиотеки.
 * Работает по клиентски расшифрованным записям (как distortionStats.ts).
 */
export function findLatestReframe(
  entries: DecryptedEntry[],
  key: DistortionKey,
): ReframeLibraryEntry | null {
  let latest: DecryptedEntry | null = null;
  for (const e of entries) {
    if (!e.alternativeThought?.trim()) continue;
    if (!e.distortions?.includes(key)) continue;
    if (!latest || new Date(e.createdAt).getTime() > new Date(latest.createdAt).getTime()) {
      latest = e;
    }
  }
  if (!latest) return null;
  return {
    alternativeThought: latest.alternativeThought!,
    createdAt: latest.createdAt,
    beliefBefore: latest.beliefBefore,
    beliefAfter: latest.beliefAfter,
  };
}
