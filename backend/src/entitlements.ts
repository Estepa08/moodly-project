import { PLAY_DAILY_LIMIT_FREE, PLAY_DAILY_LIMIT_PREMIUM } from '@moodly/shared';

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

// «Играть» / «Битва с мыслями» (A1): 3 игры/день на бесплатном тарифе,
// 5 — на активном premium (тариф выставляется вручную из админ-панели,
// биллинга пока нет — см. PATCH /admin/users/:id/tier).
export function getPlayDailyLimit(user: TieredUser): number {
  return isActivePremium(user) ? PLAY_DAILY_LIMIT_PREMIUM : PLAY_DAILY_LIMIT_FREE;
}
