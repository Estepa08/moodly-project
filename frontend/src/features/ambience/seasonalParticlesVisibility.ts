// Видимость сезонных фоновых частиц: тот же pub-sub паттерн, что и у
// companionVisibility.ts — слой частиц (Layout.tsx, смонтирован всегда) и
// тумблер (/settings, другой роут) должны синхронизироваться живьём.
// Дефолт — включено (частицы видны), поэтому персистится только исключение
// «скрыто», как и во всех остальных настройках отображения в проекте.
const STORAGE_KEY = 'moodly_hide_seasonal_particles';

type Listener = () => void;

let hidden = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
const listeners = new Set<Listener>();

export function isSeasonalParticlesHidden(): boolean {
  return hidden;
}

export function setSeasonalParticlesHidden(value: boolean) {
  hidden = value;
  if (value) {
    localStorage.setItem(STORAGE_KEY, '1');
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

export function subscribeSeasonalParticlesVisibility(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
