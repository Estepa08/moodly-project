interface TieredUser {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
}

function isActivePremium(user: TieredUser): boolean {
  return (
    user.subscriptionTier === 'premium' &&
    (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date())
  );
}

export function getDailyAttemptLimit(user: TieredUser): number {
  return isActivePremium(user) ? 5 : 1;
}
