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

model LoginRequest {
  email: string;
  password: string;
}

model AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

model RefreshRequest {
  refreshToken: string;
}

model ForgotPasswordRequest {
  email: string;
}

model ResetPasswordRequest {
  token: string;
  password: string;
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
  questions: TestQuestion[];
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

// ---------- Creature / Breathing ----------

@doc("Текущее состояние существа тревоги пользователя. calmness от 0 (тревожно) до 100 (спокойно).")
model CreatureState {
  id: string;
  userId: string;
  @doc("Уровень спокойствия: 0 — крайне тревожно, 100 — полное спокойствие")
  calmness: int32;
  @doc("Дата последнего дыхательного упражнения")
  lastExerciseAt?: utcDateTime;
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

// ---------- Errors ----------

@error
model Error {
  code: string;
  message: string;
}
