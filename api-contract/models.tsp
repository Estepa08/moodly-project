namespace MentalHealthTracker;

// ---------- User ----------

@doc("Пользователь приложения")
model User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: utcDateTime;
}

@doc("Запись списка пользователей для админ-панели")
model AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: utcDateTime;
  emailVerified: boolean;
  ageConfirmed: boolean;
  @doc("Тариф: free | premium (выставляется вручную из админ-панели, биллинга нет)")
  subscriptionTier: string;
  @doc("Дата истечения premium-тарифа, если задана")
  subscriptionExpiresAt?: utcDateTime;
  entriesCount: int32;
  testResultsCount: int32;
  breathingSessionsCount: int32;
  cbaEntriesCount: int32;
}

@doc("Тело запроса на изменение тарифа пользователя")
model AdminUserTierUpdate {
  @doc("free | premium")
  tier?: string;
  @doc("ISO-дата истечения premium или null — снять ограничение по сроку")
  expiresAt?: utcDateTime | null;
}

@doc("Результат изменения тарифа пользователя")
model AdminUserTierResult {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionExpiresAt?: utcDateTime;
}

model UserCreate {
  email: string;
  password: string;
  name?: string;
  ageConfirmed: boolean;
  pdpConsent: boolean;
  birthYear?: int32;
  @doc("DEK, зашифрованный ключом, выведенным из пароля (AES-GCM)")
  wrappedKey: string;
  @doc("Соль для вывода KEK из пароля")
  keySalt: string;
  @doc("DEK, зашифрованный ключом, выведенным из recovery-кода")
  recoveryWrappedKey: string;
  @doc("Соль для вывода KEK_recovery из recovery-кода")
  recoverySalt: string;
}

model UserUpdate {
  name?: string;
}

@doc("Настройки и предпочтения пользователя")
model UserPreference {
  goals: string[];
  experienceLevel: string;
  dailyReminder: boolean;
  reminderTime?: string;
  afternoonReminder: boolean;
  afternoonTime?: string;
  eveningReminder: boolean;
  eveningTime?: string;
  onboardingDone: boolean;
}

model UserPreferenceUpdate {
  goals?: string[];
  experienceLevel?: string;
  dailyReminder?: boolean;
  reminderTime?: string;
  afternoonReminder?: boolean;
  afternoonTime?: string;
  eveningReminder?: boolean;
  eveningTime?: string;
  onboardingDone?: boolean;
}
model LoginRequest {
  email: string;
  password: string;
}

model AuthResponse {
  accessToken: string;
  user: User;
  @doc("DEK, зашифрованный ключом из пароля — нужен клиенту для разблокировки данных при логине")
  wrappedKey?: string;
  @doc("Соль для вывода KEK из пароля")
  keySalt?: string;
}

model RefreshResponse {
  accessToken: string;
}

model ForgotPasswordRequest {
  email: string;
}

model ResetPasswordRequest {
  token: string;
  password: string;
  @doc("DEK, зашифрованный ключом из нового пароля")
  wrappedKey: string;
  @doc("Соль для вывода KEK из нового пароля")
  keySalt: string;
}

model ResetPasswordResponse {
  accessToken: string;
  userId: string;
  message: string;
}

@doc("Проверка recovery-материала по токену сброса")
model ResetInfoRequest {
  token: string;
}

@doc("Recovery-ключ (DEK, зашифрованный KEK_recovery) и соль — для восстановления доступа без пароля")
model ResetInfoResponse {
  recoveryWrappedKey: string | null;
  recoverySalt: string | null;
}

@doc("E2E-ключи для миграции legacy-учётки (созданной до внедрения шифрования)")
model SetKeysRequest {
  @doc("DEK, зашифрованный ключом из пароля")
  wrappedKey: string;
  @doc("Соль для вывода KEK из пароля")
  keySalt: string;
  @doc("DEK, зашифрованный ключом из recovery-кода")
  recoveryWrappedKey: string;
  @doc("Соль для вывода KEK из recovery-кода")
  recoverySalt: string;
}

model SetKeysOk {
  ok: boolean;
}

// ---------- Parameter ----------

@doc("Отслеживаемый параметр ментального здоровья (тревожность, сон, настроение и т.д.). Справочник, задаётся разработчиком/экспертом, не пользователем.")
model Parameter {
  id: string;
  name: string;
  description?: string;
  unit?: string;
}

// ---------- Entry ----------

@doc("Запись значения параметра в конкретный момент времени")
model Entry {
  id: string;
  userId: string;
  parameterId: string;
  @doc("Открытое значение — всегда null при E2E-шифровании (данные лежат в encryptedData)")
  value: float64 | null;
  @doc("Открытая заметка — всегда null при E2E-шифровании")
  note?: string | null;
  @doc("Шифротекст {value, note}: base64(version | iv | ciphertext+tag)")
  encryptedData?: string;
  createdAt: utcDateTime;
}

model EntryCreate {
  @doc("id генерирует клиент (uuidv7) — используется как entityId в AAD шифрования")
  id: string;
  parameterId: string;
  encryptedData: string;
}

model EntryUpdate {
  encryptedData?: string;
}

// ---------- Test / TestResult ----------

model TestQuestionOption {
  id: string;
  text: string;
  score: int32;
}

model TestQuestion {
  id: string;
  text: string;
  options: TestQuestionOption[];
}

@doc("Психологический тест, построенный на справочниках/книгах по психологии. Шаблон: вопросы + правила подсчёта баллов.")
model Test {
  id: string;
  title: string;
  description?: string;
  active: boolean;
  questions: TestQuestion[];
  @doc("Тип подсчёта: standard (баллы) / computed (профиль когнитивных искажений)")
  type: string;
  @doc("Полосы интерпретации для standard-тестов (клиент считает результат локально)")
  scoreBands: TestScoreBand[];
}

model TestDigest {
  id: string;
  title: string;
  description?: string;
  active: boolean;
}

model TestAnswer {
  questionId: string;
  optionId: string;
}

@doc("Полоса баллов с интерпретацией для теста")
model TestScoreBand {
  maxScore: int32;
  key: string;
  interpretation: string;
  recommendation: string;
}

@doc("Конкретная попытка прохождения теста пользователем: результат в E2E-шифротексте")
model TestResult {
  id: string;
  testId: string;
  userId: string;
  @doc("Открытый балл — всегда null при E2E-шифровании (данные лежат в encryptedData)")
  score: int32 | null;
  @doc("Открытая интерпретация — всегда null при E2E-шифровании")
  interpretation: string | null;
  @doc("Открытая рекомендация — всегда null при E2E-шифровании")
  recommendation: string | null;
  @doc("Открытые флаги/профили — всегда null при E2E-шифровании")
  flags?: unknown;
  @doc("Шифротекст {score, interpretation, recommendation, flags}")
  encryptedData?: string;
  completedAt: utcDateTime;
}

// ---------- Feedback ----------

@doc("Обратная связь от пользователя (сбор ОС)")
model Feedback {
  id: string;
  userId: string;
  /** Оценка приложения от 1 до 5 */
  rating: int32;
  message: string;
  createdAt: utcDateTime;
}

model FeedbackCreate {
  /** Оценка приложения от 1 до 5 */
  rating: int32;
  message: string;
}

@doc("Запись обратной связи для админ-панели (все пользователи)")
model AdminFeedback {
  id: string;
  /** Оценка приложения от 1 до 5 */
  rating: int32;
  message: string;
  createdAt: utcDateTime;
  user: {
    email: string;
    name?: string;
  };
}

// ---------- OnboardingStory ----------

@doc("Обучающая история для онбординга новых пользователей после регистрации")
model OnboardingStory {
  id: string;
  title: string;
  content: string;
  order: int32;
}

// ---------- Report ----------

@doc("Статус генерации отчёта")
enum ReportStatus {
  pending,
  ready,
  failed,
}

enum ReportFormat {
  pdf,
  csv,
}

@doc("Отчёт для выгрузки статистики врачу (PDF/CSV), без участия врача в самом приложении")
model Report {
  id: string;
  userId: string;
  format: ReportFormat;
  status: ReportStatus;
  periodFrom: utcDateTime;
  periodTo: utcDateTime;
  createdAt: utcDateTime;
  downloadUrl?: string;
}

model ReportCreate {
  format: ReportFormat;
  periodFrom: utcDateTime;
  periodTo: utcDateTime;
}

// ---------- Practice Completion ----------

@doc("Запись о выполненной практике и полученном опыте")
model PracticeCompletion {
  source: string;
  xpAwarded: int32;
  createdAt: utcDateTime;
}

@doc("Запрос на награду за практику")
model RewardRequest {
  source: string;
}

@doc("Результат награды за практику")
model RewardResponse {
  state: CreatureState;
  @doc("Был ли достигнут новый уровень")
  leveledUp: boolean;
}

// ---------- Creature / Breathing ----------

@doc("Текущее состояние существа пользователя")
model CreatureState {
  id: string;
  userId: string;
  @doc("Уровень спокойствия: 0 — крайне тревожно, 100 — полное спокойствие")
  calmness: int32;
  @doc("Энергия существа: 0 (истощён) — 100 (полон сил)")
  energy: int32;
  @doc("Уровень существа")
  level: int32;
  @doc("Опыт на текущем уровне")
  experience: int32;
  @doc("Текущая серия ежедневных отметок")
  streak: int32;
  @doc("Дата последнего ежедневного чекина")
  lastCheckInAt?: utcDateTime;
  @doc("Дата последнего дыхательного упражнения")
  lastExerciseAt?: utcDateTime;
  @doc("Текущий выбранный тип питомца")
  petType?: string;
  @doc("Открытые типы питомцев")
  unlockedPetTypes?: string[];
  @doc("Имя питомца, заданное пользователем")
  petName?: string;
  @doc("Активный титул")
  activeTitle?: string;
  @doc("Открытые титулы")
  unlockedTitles?: string[];
  @doc("Активный скин")
  activeSkin?: string;
  @doc("Открытые скины")
  unlockedSkins?: string[];
  @doc("Текущее настроение питомца (happy / calm / support)")
  petMood?: string;
  @doc("Стадия эволюции питомца (baby / kid / adult / max)")
  stage?: string;
  @doc("Всего скормленных единиц еды")
  feedCount: int32;
  @doc("Скормленные единицы по каждому питомцу (map тип → количество)")
  feedCounts: unknown;
  @doc("Поглаживаний за текущий день (сбрасывается в полночь по серверному времени)")
  petCount: int32;
  @doc("Сколько поглаживаний осталось сегодня (0 — лимит исчерпан)")
  petCountRemaining: int32;
  @doc("«Утешение» — скрытый параметр, растёт от бонуса «Эмпатия» (грустное настроение)")
  comfort: int32;
  @doc("Токены заморозки стрика: пропуск одного дня при count > 0 не сбрасывает серию")
  streakFreezeCount: int32;
  @doc("Момент, когда компаньон вернётся с «прогулки» (null — прогулки нет)")
  adventureReturnAt?: utcDateTime;
}

@doc("Коллекция питомцев пользователя")
model PetCollection {
  unlockedPetTypes: string[];
  activePetType: string;
  petName: string;
  @doc("Скормленные единицы по каждому питомцу (map тип → количество)")
  feedCounts: unknown;
}

@doc("Результат кормления питомца")
model FeedResponse {
  state: CreatureState;
  @doc("Был ли достигнут новый уровень")
  leveledUp: boolean;
  @doc("Сколько XP начислено за это кормление (0 после дневного лимита)")
  xpAwarded: int32;
  @doc("Всего скормленных единиц еды")
  feedCount: int32;
  @doc("Скормленные единицы по каждому питомцу (map тип → количество)")
  feedCounts: unknown;
}

@doc("Информация о скрытых бонусах за клик по компаньону")
model PetBonus {
  @doc("Бонус «Бодрое утро» (6:00–12:00 по серверу): 3-й клик дал +2 XP")
  morning: boolean;
  @doc("Бонус «Спокойный вечер» (20:00–23:00): 3-й клик дал +1 XP и +1 calmness")
  evening: boolean;
  @doc("Бонус «Возвращение» (пауза > 4 ч): клик дал +2 XP")
  welcome: boolean;
  @doc("Бонус «Эмпатия» (грустное настроение): 3-й клик дал +1 XP и +2 comfort")
  empathy: boolean;
  @doc("Текущая длина серии быстрых кликов (< 0.5 c)")
  comboCount: int32;
  @doc("На этом клике сработал бонус «Комбо» (+3 XP)")
  comboBonusAwarded: boolean;
  @doc("На сколько вырос calmness этим кликом")
  calmnessGain: int32;
  @doc("На сколько вырос comfort этим кликом")
  comfortGain: int32;
}

@doc("Результат поглаживания компаньона")
model PetResponse {
  state: CreatureState;
  @doc("Был ли достигнут новый уровень")
  leveledUp: boolean;
  @doc("Сколько XP начислено за это поглаживание (0 после дневного лимита)")
  xpAwarded: int32;
  @doc("Поглаживаний за текущий день")
  petCount: int32;
  @doc("Сколько поглаживаний осталось сегодня")
  petCountRemaining: int32;
  @doc("Исчерпан ли дневной лимит поглаживаний")
  limitReached: boolean;
  @doc("Позиция в цикле поглаживаний 1-2-3: на 3-й позиции начисляется XP")
  cyclePosition: int32;
  @doc("На сколько вырос calmness этим кликом")
  calmnessGain: int32;
  @doc("На сколько вырос comfort этим кликом")
  comfortGain: int32;
  @doc("Текущая длина серии быстрых кликов (< 0.5 c)")
  comboCount: int32;
  @doc("На этом клике сработал бонус «Комбо» (+3 XP)")
  comboBonusAwarded: boolean;
  @doc("Скрытые бонусы, сработавшие на этом клике")
  bonus: PetBonus;
}

@doc("Тело запроса на поглаживание компаньона")
model PetRequest {
  @doc("Пользователь записал грустное настроение/тревогу — активировать бонус «Эмпатия»")
  empathy?: boolean;
}

@doc("Один день недельного календаря практик (Пн–Вс)")
model WeeklyDay {
  @doc("Дата дня (YYYY-MM-DD)")
  date: string;
  @doc("Индекс дня недели: 0=Пн … 6=Вс")
  dayOfWeek: int32;
  @doc("Была ли в этот день засчитана практика/чек-ин")
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
}

@doc("Недельный календарь практик: неделя Пн–Вс, цель — N дней, подарок +XP")
model WeeklyState {
  @doc("Дата понедельника текущей недели (YYYY-MM-DD)")
  weekStart: string;
  days: WeeklyDay[];
  @doc("Сколько уникальных дней недели засчитано")
  completedCount: int32;
  @doc("Цель в днях для получения подарка")
  goal: int32;
  @doc("Цель уже достигнута в этой неделе")
  goalReached: boolean;
  @doc("Подарок за эту неделю уже забран")
  claimed: boolean;
  @doc("Сколько XP даёт подарок")
  xpReward: int32;
}

@doc("Результат получения недельного подарка")
model ClaimWeeklyResponse {
  claimed: boolean;
  @doc("Сколько XP начислено")
  xpAwarded: int32;
  @doc("Был ли достигнут новый уровень")
  leveledUp: boolean;
}

@doc("Результат получения награды за «прогулку» компаньона")
model ClaimAdventureResponse {
  state: CreatureState;
  @doc("Был ли достигнут новый уровень")
  leveledUp: boolean;
  @doc("Сколько XP начислено")
  xpAwarded: int32;
  @doc("На сколько вырос comfort")
  comfortGain: int32;
}

@doc("Тело обновления питомца")
model PetUpdateRequest {
  @doc("Тип питомца для активации")
  petType?: string;
  @doc("Новое имя питомца (пустая строка очищает)")
  petName?: string;
}

@doc("Результат ежедневного чекина")
model CheckInResponse {
  state: CreatureState;
  @doc("Был ли достигнут новый уровень")
  leveledUp: boolean;
  @doc("Пропуск дня был покрыт токеном заморозки стрика вместо сброса серии")
  streakFreezeUsed: boolean;
  @doc("Сработавший comeback-тир в днях (7 / 14 / 30), если чек-ин пришёл после долгого перерыва")
  comebackDays?: int32;
}

@doc("Сессия дыхательного упражнения")
model BreathingSession {
  id: string;
  userId: string;
  @doc("Длительность упражнения в секундах")
  duration: int32;
  @doc("Уровень спокойствия до упражнения")
  initialCalmness: int32;
  @doc("Уровень спокойствия после упражнения")
  finalCalmness: int32;
  completedAt: utcDateTime;
}

@doc("Результат завершённого дыхательного упражнения")
model BreathingCompleteRequest {
  @doc("Длительность упражнения в секундах")
  duration: int32;
}

// ---------- Cost-Benefit Analysis ----------

@doc("Тип пункта: довод \"за\" веру в мысль (advantage) или \"против\" (disadvantage)")
enum CbaItemType {
  advantage,
  disadvantage,
}

@doc("Тема автоматической мысли, к которой относится подсказка")
enum CbaItemCategory {
  anxiety,
  "self-esteem",
  relationships,
  work,
  health,
  habit,
}

model CbaExampleItem {
  id: string;
  itemType: CbaItemType;
  itemText: string;
}

@doc("Когнитивное искажение, отмеченное в мысли обучающего примера (ключ из библиотеки искажений)")
model CbaExampleDistortion {
  id: string;
  exampleId: string;
  distortionKey: string;
}

@doc("Разобранный обучающий пример техники \"анализ издержек и выгод\" на вымышленном персонаже")
model CbaExample {
  id: string;
  persona: string;
  thoughtText: string;
  prosWeight: int32;
  consWeight: int32;
  order: int32;
  items: CbaExampleItem[];
  distortions: CbaExampleDistortion[];
}

@doc("Типовой пункт из общего банка подсказок для заполнения формы CBA")
model CbaCommonItem {
  id: string;
  itemType: CbaItemType;
  itemText: string;
  category: CbaItemCategory;
  itemKey: string;
}

model CbaEntryItemInput {
  itemType: CbaItemType;
  itemText: string;
}

model CbaEntryItem {
  id: string;
  itemType: CbaItemType;
  itemText: string;
}

@doc("Запись пользователя в технике \"анализ издержек и выгод\": мысль + плюсы/минусы + соотношение (в сумме 100)")
model CbaEntry {
  id: string;
  userId: string;
  thoughtText: string;
  prosWeight: int32;
  consWeight: int32;
  createdAt: utcDateTime;
  items: CbaEntryItem[];
}

model CbaEntryCreate {
  thoughtText: string;
  prosWeight: int32;
  consWeight: int32;
  items: CbaEntryItemInput[];
}

// ---------- Responsibility Pie ----------

model ResponsibilityFactorInput {
  label: string;
  percent: int32;
}

model ResponsibilityFactor {
  id: string;
  label: string;
  percent: int32;
}

@doc("Запись пользователя в технике «Пирог ответственности»: ситуация + разбивка ответственности по факторам (в сумме 100)")
model ResponsibilityPieEntry {
  id: string;
  userId: string;
  situationText: string;
  createdAt: utcDateTime;
  factors: ResponsibilityFactor[];
}

model ResponsibilityPieEntryCreate {
  situationText: string;
  factors: ResponsibilityFactorInput[];
}

// ---------- Decatastrophizing ----------

@doc("Запись пользователя в технике «Декатастрофизация»: три ответа по шагам декатастрофизации мысли")
model DecatastrophizingEntry {
  id: string;
  userId: string;
  worstCaseText: string;
  copingPlanText: string;
  mostLikelyText: string;
  createdAt: utcDateTime;
}

model DecatastrophizingEntryCreate {
  worstCaseText: string;
  copingPlanText: string;
  mostLikelyText: string;
}

// ---------- Motivation Message ----------

@doc("Мотивационное пожелание/вопрос для «Моего дня» (утро/вечер), по языкам")
model MotivationMessage {
  id: string;
  @doc("Тип пожелания: morning | day | evening")
  type: string;
  @doc("Локаль: ru | en")
  locale: string;
  @doc("Мотивационная фраза/пожелание")
  text: string;
  @doc("Опциональный ротируемый вопрос (например, «Как спали?»)")
  question?: string | null;
  isActive: boolean;
  order: int32;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model MotivationMessageCreate {
  @doc("Тип пожелания: morning | day | evening")
  type: string;
  @doc("Локаль: ru | en")
  locale: string;
  text: string;
  question?: string | null;
  isActive?: boolean;
  order?: int32;
}

model MotivationMessageUpdate {
  type?: string;
  locale?: string;
  text?: string;
  question?: string | null;
  isActive?: boolean;
  order?: int32;
}

@doc("Пожелание дня для конкретного пользователя (детерминированная ротация)")
model MessageOfDay {
  id: string;
  type: string;
  locale: string;
  text: string;
  question?: string | null;
}

// ---------- Emotion Lab ----------

@doc("Эмоция из колеса Плутчика для «Лаборатории эмоций»")
model EmotionInfo {
  key: string;
  name: string;
}

@doc("Диада — результат смешивания двух эмоций (алхимия Плутчика)")
model DyadInfo {
  key: string;
  name: string;
  @doc("Уровень диады: 1 первичная, 2 вторичная, 3 третичная, 4 противоположность")
  level: int32;
  emotions: string[];
}

@doc("Состояние «Лаборатории эмоций» пользователя")
model EmotionLabState {
  @doc("Тариф пользователя: free | premium")
  tier: string;
  discoveredDyads: string[];
  discoveredCount: int32;
  totalDyads: int32;
  @doc("Текущий доступный уровень (1-4) по открытым диадам")
  availableLevel: int32;
  dailyLimit: int32;
  attemptsUsed: int32;
  attemptsRemaining: int32;
  @doc("Момент сброса дневного лимита (начало следующего дня)")
  resetsAt: utcDateTime;
  limitReached: boolean;
}

@doc("Тело попытки смешивания двух эмоций")
model EmotionLabAttemptRequest {
  emotionA: string;
  emotionB: string;
}

@doc("Результат попытки смешивания эмоций")
model EmotionLabAttemptResponse {
  dyad: DyadInfo;
  @doc("Открыта ли диада впервые")
  isNewDiscovery: boolean;
  discoveredDyads: string[];
  discoveredCount: int32;
  totalDyads: int32;
  @doc("Текущий доступный уровень (1-4) по открытым диадам")
  availableLevel: int32;
  dailyLimit: int32;
  attemptsUsed: int32;
  attemptsRemaining: int32;
  @doc("Момент сброса дневного лимита (начало следующего дня)")
  resetsAt: utcDateTime;
  tier: string;
  limitReached: boolean;
}

// ---------- Errors ----------

@error
model Error {
  code: string;
  message: string;
}
