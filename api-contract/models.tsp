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
  entriesCount: int32;
  testResultsCount: int32;
  breathingSessionsCount: int32;
  cbaEntriesCount: int32;
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

// ---------- Errors ----------

@error
model Error {
  code: string;
  message: string;
}
