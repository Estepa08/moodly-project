import { lazy } from 'react';
import { toast } from 'sonner';
import i18n from '../../i18n/i18n';

const RewardMoment = lazy(() => import('./RewardMoment'));

export interface PetSpeech {
  id: string;
  text: string;
  timestamp?: number;
}

type SpeechSubscriber = (speech: PetSpeech) => void;

const speechSubscribers = new Set<SpeechSubscriber>();
let speechSeq = 0;

export function subscribeSpeech(subscriber: SpeechSubscriber): () => void {
  speechSubscribers.add(subscriber);
  return () => {
    speechSubscribers.delete(subscriber);
  };
}

export function emitSpeech(text: string): PetSpeech {
  const speech: PetSpeech = {
    id: `speech-${++speechSeq}`,
    text,
    timestamp: Date.now(),
  };
  for (const subscriber of speechSubscribers) subscriber(speech);
  return speech;
}

const PRACTICE_REWARD_XP: Record<string, number> = {
  breathing: 10,
  gratitude: 5,
  sleepHygiene: 5,
  distortions: 10,
  cba: 10,
  thoughtJournal: 5,
  weeklyGoal: 25,
};

const REWARD_COOLDOWN_MS = 4000;
let lastRewardAt = 0;

interface CelebrateOptions {
  title?: string;
  chip?: string;
  showCollectionLink?: boolean;
  /** Числовой XP для анимации кормления и счётчика в RewardMoment */
  xp?: number;
}

export function celebrate(subtitle: string, options: CelebrateOptions = {}) {
  toast.custom(() => <RewardMoment subtitle={subtitle} {...options} />, {
    duration: 4000,
  });
}

export function celebrateReward(
  source: string,
  data: { leveledUp?: boolean; state?: { level: number } },
) {
  const t = i18n.t.bind(i18n);

  if (data.leveledUp && Date.now() - lastRewardAt >= REWARD_COOLDOWN_MS) {
    lastRewardAt = Date.now(); // Устанавливаем временную метку последнего уведомления
    celebrate(t('dailyCheckIn.levelUpBody', { level: data.state?.level }), {
      title: t('dailyCheckIn.levelUpTitle'),
    });
    return;
  }

  const now = Date.now();
  if (now - lastRewardAt < REWARD_COOLDOWN_MS) return;
  lastRewardAt = now;

  const xp = PRACTICE_REWARD_XP[source];
  celebrate(t('reward.practiceComplete'), {
    chip: xp ? `+${xp} XP` : undefined,
    xp,
  });
}
