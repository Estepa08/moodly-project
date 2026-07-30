import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;

namespace MentalHealthTracker;

@tag("Auth")
@route("/auth")
interface Auth {
  @post
  @route("/register")
  register(@body body: UserCreate): AuthResponse;

  @post
  @route("/login")
  login(@body body: LoginRequest): AuthResponse;

  @post
  @route("/logout")
  logout(): void;

  @post
  @route("/refresh")
  refresh(): RefreshResponse;

  @post
  @route("/forgot-password")
  forgotPassword(@body body: ForgotPasswordRequest): void;

  @post
  @route("/reset-password")
  resetPassword(@body body: ResetPasswordRequest): ResetPasswordResponse;
}

@tag("Users")
@route("/users")
interface Users {
  @get
  @route("/me")
  getMe(): User;

  @patch
  @route("/me")
  updateMe(@body body: UserUpdate): User;

  @delete
  @route("/me")
  deleteMe(): void;

  @get
  @route("/me/preferences")
  getPreferences(): UserPreference;

  @put
  @route("/me/preferences")
  savePreferences(@body body: UserPreferenceUpdate): UserPreference;
}

@tag("Parameters")
@route("/parameters")
interface Parameters {
  @get
  list(): Parameter[];
}

@tag("Entries")
@route("/entries")
interface Entries {
  @get
  list(@query parameterId?: string, @query from?: utcDateTime, @query to?: utcDateTime): Entry[];

  @post
  create(@body body: EntryCreate): Entry;

  @get
  @route("/{id}")
  get(@path id: string): Entry;

  @patch
  @route("/{id}")
  update(@path id: string, @body body: EntryUpdate): Entry;

  @delete
  @route("/{id}")
  delete(@path id: string): void;
}

@tag("Tests")
@route("/tests")
interface Tests {
  @get
  list(): TestDigest[];

  @get
  @route("/{id}")
  get(@path id: string): Test;

  @post
  @route("/{id}/results")
  submitResult(@path id: string, @body body: TestResultSubmit): TestResult;
}

@tag("TestResults")
@route("/test-results")
interface TestResults {
  @get
  list(@query testId?: string): TestResult[];

  @get
  @route("/{id}")
  get(@path id: string): TestResult;
}

@tag("Feedback")
@route("/feedback")
interface FeedbackApi {
  @post
  create(@body body: FeedbackCreate): Feedback;

  @get
  @route("/me")
  listMine(): Feedback[];
}

@tag("OnboardingStories")
@route("/onboarding-stories")
interface OnboardingStories {
  @get
  list(): OnboardingStory[];
}

@tag("Reports")
@route("/reports")
interface Reports {
  @post
  create(@body body: ReportCreate): Report;

  @get
  list(): Report[];

  @get
  @route("/{id}")
  get(@path id: string): Report;

  @get
  @route("/{id}/download")
  download(@path id: string): bytes;

  @delete
  @route("/{id}")
  delete(@path id: string): void;
}

@tag("Breathing")
@route("/creature")
interface Creature {
  @get
  @doc("Получить текущее состояние существа")
  getState(): CreatureState;

  @post
  @route("/check-in")
  @doc("Ежедневная отметка — восстанавливает энергию, начисляет опыт, обновляет streak")
  checkIn(): CheckInResponse;

  @post
  @route("/exercise/complete")
  @doc("Завершить дыхательное упражнение, обновить уровень спокойствия, начислить опыт")
  completeExercise(@body body: BreathingCompleteRequest): CheckInResponse;

  @post
  @route("/reward")
  @doc("Начислить опыт за выполнение практики (gratitude, sleepHygiene, distortions, cba)")
  reward(@body body: RewardRequest): RewardResponse;

  @get
  @route("/completions")
  @doc("История выполненных практик за последние N дней (по умолчанию 30)")
  getCompletions(@query days?: int32): PracticeCompletion[];
}

@tag("Digest")
@route("/digest")
interface Digest {
  @get
  @route("/weekly")
  @doc("Недельный дайджест активности пользователя")
  getWeekly(): WeeklyDigest;
}

@tag("Cba")
@route("/cba")
interface Cba {
  @get
  @route("/examples")
  @doc("Библиотека разобранных обучающих примеров")
  listExamples(): CbaExample[];

  @get
  @route("/common-items")
  @doc("Общий банк типовых пунктов плюсов/минусов")
  listCommonItems(): CbaCommonItem[];

  @post
  @route("/entries")
  createEntry(@body body: CbaEntryCreate): CbaEntry;

  @get
  @route("/entries")
  @doc("История записей текущего пользователя, новые сверху")
  listEntries(): CbaEntry[];

  @delete
  @route("/entries/{id}")
  deleteEntry(@path id: string): void;
}
