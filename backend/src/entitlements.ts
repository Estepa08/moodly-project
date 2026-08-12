// Слой лимитов/прав по тарифу (free/premium) — заготовка под будущие
// премиум-лимиты, не завязан жёстко на одну фичу.
//
// Реального биллинга нет: subscriptionTier/subscriptionExpiresAt переключаются
// вручную (Prisma Studio или служебный роут /admin/users/:id/tier).

export type SubscriptionTier = "free" | "premium";

// Ключ фичи → { тариф: дневной лимит }.
export const FEATURE_DAILY_LIMITS: Record<string, Record<string, number>> = {
  emotion_lab_attempts: { free: 1, premium: 5 },
};

export interface EntitlementUser {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
}

export function isActivePremium(user: EntitlementUser): boolean {
  return (
    user.subscriptionTier === "premium" &&
    (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date())
  );
}

export function getEffectiveTier(user: EntitlementUser): SubscriptionTier {
  return isActivePremium(user) ? "premium" : "free";
}

export function getDailyLimit(featureKey: string, user: EntitlementUser): number {
  const tier = getEffectiveTier(user);
  return FEATURE_DAILY_LIMITS[featureKey]?.[tier] ?? 0;
}
