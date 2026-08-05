export enum ActivityCategory {
  Work = "work",
  Study = "study",
  Health = "health",
  Movement = "movement",
  Rest = "rest",
  Social = "social",
  Hobby = "hobby",
  Events = "events",
  Wellbeing = "wellbeing",
}

export interface DayActivityDefinition {
  key: string;
  category: ActivityCategory;
  labelKey: string;
}

export const ACTIVITY_CATEGORY_ORDER: ActivityCategory[] = [
  ActivityCategory.Work,
  ActivityCategory.Study,
  ActivityCategory.Health,
  ActivityCategory.Movement,
  ActivityCategory.Rest,
  ActivityCategory.Social,
  ActivityCategory.Hobby,
  ActivityCategory.Events,
  ActivityCategory.Wellbeing,
];

const CAT: Record<ActivityCategory, ActivityCategory> = {
  work: ActivityCategory.Work,
  study: ActivityCategory.Study,
  health: ActivityCategory.Health,
  movement: ActivityCategory.Movement,
  rest: ActivityCategory.Rest,
  social: ActivityCategory.Social,
  hobby: ActivityCategory.Hobby,
  events: ActivityCategory.Events,
  wellbeing: ActivityCategory.Wellbeing,
};

function def(categoryKey: ActivityCategory, key: string): DayActivityDefinition {
  return {
    key: `${categoryKey}.${key}`,
    category: CAT[categoryKey],
    labelKey: `dayActivities.activities.${categoryKey}_${key}`,
  };
}

export const ACTIVITY_CATALOG: DayActivityDefinition[] = [
  // Работа
  def(ActivityCategory.Work, "worked"),
  def(ActivityCategory.Work, "meeting"),
  def(ActivityCategory.Work, "deadline"),
  def(ActivityCategory.Work, "presentation"),
  def(ActivityCategory.Work, "overtime"),
  def(ActivityCategory.Work, "day_off"),
  def(ActivityCategory.Work, "remote"),
  def(ActivityCategory.Work, "stressful_day"),
  def(ActivityCategory.Work, "success"),
  def(ActivityCategory.Work, "new_project"),

  // Учёба
  def(ActivityCategory.Study, "studied"),
  def(ActivityCategory.Study, "exam"),
  def(ActivityCategory.Study, "homework"),
  def(ActivityCategory.Study, "course"),
  def(ActivityCategory.Study, "listened_lecture"),

  // Здоровье
  def(ActivityCategory.Health, "doctor_visit"),
  def(ActivityCategory.Health, "therapy_session"),
  def(ActivityCategory.Health, "medication"),
  def(ActivityCategory.Health, "sick"),
  def(ActivityCategory.Health, "headache"),
  def(ActivityCategory.Health, "good_health"),
  def(ActivityCategory.Health, "bad_sleep"),
  def(ActivityCategory.Health, "good_sleep"),

  // Движение
  def(ActivityCategory.Movement, "walk"),
  def(ActivityCategory.Movement, "gym"),
  def(ActivityCategory.Movement, "run"),
  def(ActivityCategory.Movement, "yoga"),
  def(ActivityCategory.Movement, "cycling"),
  def(ActivityCategory.Movement, "sport_game"),
  def(ActivityCategory.Movement, "home_workout"),
  def(ActivityCategory.Movement, "stretching"),

  // Отдых
  def(ActivityCategory.Rest, "read"),
  def(ActivityCategory.Rest, "watched_movie"),
  def(ActivityCategory.Rest, "watched_tv"),
  def(ActivityCategory.Rest, "played_games"),
  def(ActivityCategory.Rest, "listened_music"),
  def(ActivityCategory.Rest, "nap"),
  def(ActivityCategory.Rest, "relaxed"),
  def(ActivityCategory.Rest, "mobile_scroll"),

  // Соц. контакты
  def(ActivityCategory.Social, "friends"),
  def(ActivityCategory.Social, "family"),
  def(ActivityCategory.Social, "partner"),
  def(ActivityCategory.Social, "helped_others"),
  def(ActivityCategory.Social, "phone_call"),
  def(ActivityCategory.Social, "conflict"),
  def(ActivityCategory.Social, "date"),

  // Хобби
  def(ActivityCategory.Hobby, "drawing"),
  def(ActivityCategory.Hobby, "music_playing"),
  def(ActivityCategory.Hobby, "cooking"),
  def(ActivityCategory.Hobby, "gaming"),
  def(ActivityCategory.Hobby, "photography"),
  def(ActivityCategory.Hobby, "writing"),
  def(ActivityCategory.Hobby, "diy"),

  // События
  def(ActivityCategory.Events, "celebration"),
  def(ActivityCategory.Events, "holiday"),
  def(ActivityCategory.Events, "travel"),
  def(ActivityCategory.Events, "concert"),
  def(ActivityCategory.Events, "wedding"),
  def(ActivityCategory.Events, "shopping"),

  // Самочувствие / события дня
  def(ActivityCategory.Wellbeing, "stress"),
  def(ActivityCategory.Wellbeing, "anxiety"),
  def(ActivityCategory.Wellbeing, "good_mood"),
  def(ActivityCategory.Wellbeing, "low_mood"),
  def(ActivityCategory.Wellbeing, "grateful"),
  def(ActivityCategory.Wellbeing, "peaceful"),
  def(ActivityCategory.Wellbeing, "overwhelmed"),
  def(ActivityCategory.Wellbeing, "energetic"),
  def(ActivityCategory.Wellbeing, "tired"),
  def(ActivityCategory.Wellbeing, "rainy_day"),
  def(ActivityCategory.Wellbeing, "sunny_day"),
];

export const DEFAULT_ACTIVITY_CATEGORY = ActivityCategory.Wellbeing;
