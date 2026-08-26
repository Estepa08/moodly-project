export interface ResponsibilityFactor {
  id: string;
  label: string;
  percent: number;
}

/**
 * Двигаем фактор `changedId` на `newValue` (0-100) — остальные факторы
 * пропорционально сжимаются/растягиваются, чтобы сумма всегда была ровно 100.
 * Последний фактор в списке забирает остаток округления, чтобы не потерять
 * ни процента из-за Math.round на каждом шаге.
 */
export function rebalanceFactors(
  factors: ResponsibilityFactor[],
  changedId: string,
  newValue: number,
): ResponsibilityFactor[] {
  const clamped = Math.max(0, Math.min(100, Math.round(newValue)));
  const others = factors.filter((f) => f.id !== changedId);
  const othersSum = others.reduce((sum, f) => sum + f.percent, 0);
  const remaining = 100 - clamped;

  const nextPercentById = new Map<string, number>();
  let distributed = 0;
  others.forEach((f, idx) => {
    const isLast = idx === others.length - 1;
    let value: number;
    if (isLast) {
      value = remaining - distributed;
    } else if (othersSum === 0) {
      value = Math.floor(remaining / others.length);
    } else {
      value = Math.round((f.percent / othersSum) * remaining);
    }
    distributed += value;
    nextPercentById.set(f.id, value);
  });

  return factors.map((f) =>
    f.id === changedId ? { ...f, percent: clamped } : { ...f, percent: nextPercentById.get(f.id)! },
  );
}

/** Новый фактор стартует с 0% — не меняет сумму, дальше пользователь двигает его слайдер. */
export function addFactor(
  factors: ResponsibilityFactor[],
  id: string,
  label: string,
): ResponsibilityFactor[] {
  return [...factors, { id, label, percent: 0 }];
}

/** Убираем фактор и пропорционально растягиваем оставшиеся, чтобы сумма снова была 100. */
export function removeFactor(factors: ResponsibilityFactor[], id: string): ResponsibilityFactor[] {
  const remaining = factors.filter((f) => f.id !== id);
  if (remaining.length === 0) return remaining;

  const sum = remaining.reduce((s, f) => s + f.percent, 0);
  if (sum === 100) return remaining;

  let distributed = 0;
  return remaining.map((f, idx) => {
    const isLast = idx === remaining.length - 1;
    const value = isLast
      ? 100 - distributed
      : sum === 0
        ? Math.floor(100 / remaining.length)
        : Math.round((f.percent / sum) * 100);
    distributed += value;
    return { ...f, percent: value };
  });
}
