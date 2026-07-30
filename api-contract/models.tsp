namespace MentalHealthTracker;

// ---------- User ----------

@doc("Пользователь приложения")
model User {
  id: string;
  email: string;
  name?: string;
  createdAt: utcDateTime;
}

model UserCreate {
  email: string;
  password: string;
  name?: string;
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
  onboardingDone: boolean;
}

model UserPreferenceUpdate {
  goals?: string[];
  experienceLevel?: string;
  dailyReminder?: boolean;
  reminderTime?: string;
  onboardingDone?: boolean;
}

@doc("Результаты тестирования за неделю")
model WeeklyDigest {
  startDate: utcDateTime;
  endDate: utcDateTime;
  totalEntries: int32;
  averages: unknown;
  checkInDays: int32;
  testsTaken: TestResultDigest[];
  practicesCompleted: unknown;
  creatureXpGained: int32;
  creatureLevel: int32;
}

model TestResultDigest {
  testId: string;
  title: string;
  score: int32;
  interpretation: string;
}

model LoginRequest {
  email: string;
  password: string;
}

model AuthResponse {
  accessToken: string;
  user: User;
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
}

model ResetPasswordResponse {
  accessToken: string;
  message: string;
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
  value: float64;
  note?: string;
  createdAt: utcDateTime;
}

model EntryCreate {
  parameterId: string;
  value: float64;
  note?: string;
}

model EntryUpdate {
  value?: float64;
  note?: string;
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

model TestResultSubmit {
  answers: TestAnswer[];
}

@doc("Конкретная попытка прохождения теста пользователем: ответы, посчитанный балл и рекомендация")
model TestResult {
  id: string;
  testId: string;
  userId: string;
  score: int32;
  interpretation: string;
  recommendation: string;
  @doc("Дополнительные флаги/профили (например, per-distortion scores для теста когнитивных искажений)")
  flags?: unknown;
  completedAt: utcDateTime;
}

// ---------- Feedback ----------

@doc("Обратная связь от пользователя (сбор ОС)")
model Feedback {
  id: string;
  userId: string;
  message: string;
  createdAt: utcDateTime;
}

model FeedbackCreate {
  message: string;
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

// ---------- Errors ----------

@error
model Error {
  code: string;
  message: string;
}
