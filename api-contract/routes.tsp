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
  @route("/reset-info")
  @doc("Отдать recovery-материал (wrappedKey/salt) по токену сброса пароля")
  resetInfo(@body body: ResetInfoRequest): ResetInfoResponse;

  @post
  @route("/reset-password")
  resetPassword(@body body: ResetPasswordRequest): ResetPasswordResponse;

  @post
  @route("/set-keys")
  @doc("Сохранить E2E-ключи для legacy-учётки (только если ключей ещё нет); требователен к авторизации")
  setKeys(@body body: SetKeysRequest): SetKeysOk;
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

  @get
  @route("/pets")
  @doc("Получить коллекцию питомцев пользователя")
  getPets(): PetCollection;

  @post
  @route("/pet")
  @doc("Погладить компаньона: цикл 1-2-3 с XP и скрытыми бонусами (утро/вечер/комбо/возвращение/эмпатия)")
  pet(@body body: PetRequest): PetResponse;

  @patch
  @route("/pet")
  @doc("Активировать питомца и/или задать имя")
  setPet(@body body: PetUpdateRequest): PetCollection;

  @post
  @route("/play")
  @doc("Играть с компаньоном: −10 энергии, +2 XP, лимит 5 игр в сутки")
  play(): PlayResponse;

  @get
  @route("/weekly")
  @doc("Недельный календарь практик (Пн–Вс): прогресс к цели, статус подарка +25 XP")
  getWeekly(): WeeklyState;

  @post
  @route("/weekly/claim")
  @doc("Забрать недельный подарок +XP (одноразово на неделю, только при достигнутой цели)")
  claimWeekly(): ClaimWeeklyResponse;
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

@tag("EmotionLab")
@route("/emotion-lab")
interface EmotionLab {
  @get
  @route("/state")
  @doc("Состояние лаборатории эмоций: открытые диады, доступный уровень, оставшиеся попытки сегодня")
  getState(): EmotionLabState;

  @post
  @route("/attempt")
  @doc("Смешать две эмоции: проверяет дневной лимит и доступность уровня диады. При исчерпании лимита — 403 { error: 'daily_limit_reached', limit, tier, resetsAt }")
  attempt(@body body: EmotionLabAttemptRequest): EmotionLabAttemptResponse;
}

@tag("Admin")
@route("/admin")
interface AdminUsers {
  @get
  @route("/users")
  @doc("Список всех пользователей (только для администратора)")
  listUsers(): AdminUser[];

  @get
  @route("/feedback")
  @doc("Все сообщения обратной связи всех пользователей (только для администратора)")
  listFeedback(): AdminFeedback[];

  @delete
  @route("/users/{id}")
  @doc("Удалить пользователя вместе со всеми данными (только для администратора)")
  deleteUser(@path id: string): void;
}

@tag("Content")
@route("/content")
interface Content {
  @get
  @route("/message-of-day")
  @doc("Пожелание дня (morning/day/evening) для текущего пользователя")
  messageOfDay(@query type: string, @query locale: string): MessageOfDay | null;

  @get
  @route("/messages")
  @doc("Список пожеланий (только контент-менеджер/админ)")
  listMessages(
    @query type?: string,
    @query locale?: string,
    @query active?: string,
  ): MotivationMessage[];

  @post
  @route("/messages")
  @doc("Создать пожелание (только контент-менеджер/админ)")
  createMessage(@body body: MotivationMessageCreate): MotivationMessage;

  @patch
  @route("/messages/{id}")
  @doc("Обновить пожелание (только контент-менеджер/админ)")
  updateMessage(@path id: string, @body body: MotivationMessageUpdate): MotivationMessage;

  @delete
  @route("/messages/{id}")
  @doc("Удалить пожелание (только контент-менеджер/админ)")
  deleteMessage(@path id: string): void;
}
