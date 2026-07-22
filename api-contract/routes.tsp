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
  refresh(@body body: RefreshRequest): AuthResponse;

  @post
  @route("/forgot-password")
  forgotPassword(@body body: ForgotPasswordRequest): void;

  @post
  @route("/reset-password")
  resetPassword(@body body: ResetPasswordRequest): void;
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
  list(): Test[];

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
  @doc("Получить текущее состояние существа и уровень спокойствия")
  getState(): CreatureState;

  @post
  @route("/exercise/complete")
  @doc("Завершить дыхательное упражнение, обновить уровень спокойствия")
  completeExercise(@body body: BreathingCompleteRequest): CreatureState;
}
