import { safeLocalStorage } from '../../lib/safeStorage';

// Звуковой отклик на награду компаньона: 5 синтезированных вариантов
// (Web Audio, без внешних файлов) подобраны и прослушаны в Companion FX Lab —
// see PR discussion. По умолчанию ВЫКЛЮЧЕН: «тихий кабинет» — весь бренд
// приложения построен на приглушённости, неожиданный звук в тихом
// пространстве хуже отсутствия звука. Включается явно в настройках.

const STORAGE_KEY = 'moodly_reward_sound_enabled';

export function isRewardSoundEnabled(): boolean {
  return safeLocalStorage.getItem(STORAGE_KEY) === '1';
}

export function setRewardSoundEnabled(enabled: boolean): void {
  if (enabled) safeLocalStorage.setItem(STORAGE_KEY, '1');
  else safeLocalStorage.removeItem(STORAGE_KEY);
}

interface ToneOptions {
  type?: OscillatorType;
  freq: number;
  freqEnd?: number;
  dur: number;
  startAt?: number;
  gainPeak?: number;
  attack?: number;
}

function tone(ctx: AudioContext, opts: ToneOptions): void {
  const { type = 'sine', freq, freqEnd, dur, startAt = 0, gainPeak = 0.18, attack = 0.012 } = opts;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  const t0 = ctx.currentTime + startAt;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Идентичны 5 вариантам из Companion FX Lab (id 1-5) — держим в синхроне,
// если лаборатория меняется. Активный вариант — ACTIVE_VARIANT_ID ниже.
const SOUND_VARIANTS: Record<number, (ctx: AudioContext) => void> = {
  1: (ctx) => tone(ctx, { freq: 440, freqEnd: 260, dur: 0.16, gainPeak: 0.16 }),
  2: (ctx) => {
    tone(ctx, { freq: 880, dur: 0.42, gainPeak: 0.12, attack: 0.006 });
    tone(ctx, { freq: 880 * 2.4, dur: 0.3, gainPeak: 0.05, attack: 0.006 });
  },
  3: (ctx) => tone(ctx, { freq: 320, freqEnd: 780, dur: 0.09, gainPeak: 0.18, attack: 0.006 }),
  4: (ctx) =>
    tone(ctx, {
      type: 'triangle',
      freq: 392,
      freqEnd: 300,
      dur: 0.22,
      gainPeak: 0.2,
      attack: 0.004,
    }),
  5: (ctx) => {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      tone(ctx, { freq, dur: 0.14, gainPeak: 0.14, attack: 0.005, startAt: i * 0.055 });
    });
  },
};

// TODO: обновить, когда выберете фаворита из Companion FX Lab (сейчас
// placeholder — «Мягкий поп», вариант 1).
const ACTIVE_VARIANT_ID = 1;

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const legacy = (window as unknown as { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext;
  const Ctor = window.AudioContext ?? legacy;
  if (!Ctor) return null;
  audioCtx = audioCtx ?? new Ctor();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

export function playRewardSound(): void {
  if (!isRewardSoundEnabled()) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    SOUND_VARIANTS[ACTIVE_VARIANT_ID]?.(ctx);
  } catch {
    /* audio unavailable (autoplay policy, unsupported browser) */
  }
}
