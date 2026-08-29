export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

// По календарному месяцу устройства, без геолокации — для южного полушария
// сезон будет перевёрнут, это сознательно принятое упрощение v1 (см. также
// открытые вопросы в артефакте дизайн-системы «Времена года»). Параметр
// `date` инжектируемый — для тестов и для будущего ручного оверрайда сезона.
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth(); // 0..11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}
