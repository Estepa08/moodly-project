export function getDailyAttemptLimit(user: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
}): number {
  const isActivePremium =
    user.subscriptionTier === "premium" &&
    (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date());

  return isActivePremium ? 5 : 1;
}
