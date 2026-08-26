import { PracticeSource } from '../features/gamification/practice.enums';

/** Маршрут практики -> её PracticeSource. Общий для Sidebar и /practices. */
export const PATH_TO_SOURCE: Record<string, PracticeSource> = {
  '/practices/thought-journal': PracticeSource.ThoughtJournal,
  '/practices/gratitude': PracticeSource.Gratitude,
  '/practices/distortions': PracticeSource.Distortions,
  '/practices/sleep-hygiene': PracticeSource.SleepHygiene,
  '/practices/cost-benefit-analysis': PracticeSource.Cba,
  '/practices/breathing': PracticeSource.Breathing,
  '/practices/emotion-lab': PracticeSource.EmotionLab,
  '/practices/relaxation-wheel': PracticeSource.RelaxationWheel,
  '/practices/thought-battle': PracticeSource.ThoughtBattle,
  '/practices/responsibility-pie': PracticeSource.ResponsibilityPie,
  '/practices/decatastrophizing': PracticeSource.Decatastrophizing,
};
