import { isEmpathyMood } from "@moodly/shared";
import type { PetResponse } from "../../lib/api";

// Типы наград-анимаций: каждая механика клика по компаньону имеет уникальную
// анимацию (см. docs/companion-gamified-rewards.svg).
export type PetRewardKind =
  | "none"
  | "standard" // каждый 3-й клик: +1 XP, золотые звёздочки
  | "morning" // «Бодрое утро» (6–12): +2 XP, солнечные зайчики
  | "evening" // «Спокойный вечер» (20–23): +1 XP +1 calmness, волны
  | "combo" // «Комбо» x5: +3 XP, взрыв искр
  | "welcome" // «Возвращение» (пауза > 4 ч): +2 XP, сердечки
  | "empathy"; // «Эмпатия» (грусть/тревога): +1 XP +2 comfort, капли → звёзды

export interface PetRewardSignal {
  /** Уникальный id события — по нему рестартует анимация частиц */
  id: number;
  kind: PetRewardKind;
  /** Плавающий текст награды: «+1 XP», «+2 XP», «+3 XP» */
  xpText?: string;
  /** Текущая длина серии быстрых кликов (для счётчика «Комбо x3/x4/x5») */
  comboCount?: number;
  /** Сработал ли на этом клике бонус «Комбо» (+3 XP) */
  comboBonusAwarded?: boolean;
  /** Рост calmness этим кликом (вечер) */
  calmnessGain?: number;
  /** Рост comfort этим кликом (эмпатия) */
  comfortGain?: number;
}

// Выбор индекса слова-эмоции без повтора дважды подряд.
// `lastIndex` — индекс предыдущего «выпавшего» слова (пул до 1 слова вернёт 0).
export function pickPetWordIndex(poolSize: number, lastIndex: number | null): number {
  if (poolSize <= 1) return 0;
  let i = Math.floor(Math.random() * poolSize);
  if (i === lastIndex) i = (i + 1) % poolSize;
  return i;
}

// «Текущая сессия» для бонуса «Эмпатия»: записи грусти/тревоги за последние 24 ч.
export const EMPATHY_WINDOW_MS = 24 * 60 * 60 * 1000;

// Окно, за которое «Комбо» ещё живо на клиенте (для мгновенного счётчика x3/x4).
export const COMBO_DISPLAY_WINDOW_MS = 500;

export function buildRewardSignal(data: PetResponse): PetRewardSignal {
  const b = data.bonus;
  const comboCount = b?.comboCount ?? 0;
  const comboBonusAwarded = b?.comboBonusAwarded ?? false;
  const welcome = b?.welcome ?? false;
  const morning = b?.morning ?? false;
  const evening = b?.evening ?? false;
  const empathy = b?.empathy ?? false;

  let kind: PetRewardKind = "none";
  if (welcome) kind = "welcome";
  else if (comboBonusAwarded) kind = "combo";
  else if (morning) kind = "morning";
  else if (evening) kind = "evening";
  else if (empathy) kind = "empathy";
  else if (data.xpAwarded > 0) kind = "standard";

  return {
    id: Date.now() + Math.random(),
    kind,
    xpText: data.xpAwarded > 0 ? `+${data.xpAwarded} XP` : undefined,
    comboCount,
    comboBonusAwarded,
    calmnessGain: b?.calmnessGain ?? 0,
    comfortGain: b?.comfortGain ?? 0,
  };
}

interface EmpathyEntry {
  parameterId: string;
  value: number;
  createdAt: string;
}

// Пользователь «в текущей сессии» записал грусть (Mood ≤ 3) или тревогу
// (любая запись Anxiety) за последние 24 часа → клики по компаньону дают
// утешение (+2 comfort) и +1 XP. Параметры идентифицируются по id (cuid).
export function computeEmpathy(
  moodParamId: string | undefined,
  anxietyParamId: string | undefined,
  entries: EmpathyEntry[] | undefined,
): boolean {
  if (!entries || entries.length === 0) return false;
  const since = Date.now() - EMPATHY_WINDOW_MS;
  return entries.some((e) => {
    const createdAt = new Date(e.createdAt).getTime();
    if (Number.isNaN(createdAt) || createdAt < since) return false;
    if (anxietyParamId && e.parameterId === anxietyParamId) return true;
    if (moodParamId && e.parameterId === moodParamId) return isEmpathyMood(e.value);
    return false;
  });
}
