import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Wind,
  LayoutDashboard,
  ClipboardList,
  Brain,
  Moon,
  Heart,
  Sparkles,
  Bell,
  SunMedium,
  PawPrint,
  NotebookPen,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { ExpLevel, InterfaceMode } from '../lib/constants';
import Spinner from '../components/ui/spinner';
import { ToggleSwitch } from '../components/ui/toggle-switch';
import { useSetPet } from '../features/gamification';
import { PET_DEFINITIONS, STARTER_PET_TYPES } from '../features/gamification/pets';
import { useSetInterfaceMode } from '../hooks/useInterfaceMode';
import { WellnessDisclaimer } from '../widgets';
import { cn } from '../lib/utils';

const GOALS = [
  { key: 'stress', icon: Wind },
  { key: 'anxiety', icon: Brain },
  { key: 'sleep', icon: Moon },
  { key: 'mood', icon: Heart },
  { key: 'therapy', icon: ClipboardList },
] as const;

const EXP_LEVELS = [ExpLevel.Beginner, ExpLevel.Intermediate, ExpLevel.Advanced];

function ReminderRow({
  icon: Icon,
  label,
  checked,
  time,
  onToggle,
  onTime,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  time: string;
  onToggle: (next: boolean) => void;
  onTime: (next: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card shadow-neumorphic-sm p-3">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon aria-hidden="true" className="w-4 h-4" />
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {checked && (
          <input
            type="time"
            value={time}
            onChange={(e) => onTime(e.target.value)}
            aria-label={t('settings.remindersTimeLabel')}
            className="px-2 py-1.5 rounded-lg bg-secondary text-sm text-foreground border-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        )}
        <ToggleSwitch checked={checked} onCheckedChange={onToggle} aria-label={label} />
      </div>
    </div>
  );
}

// Список шагов — динамический, не фиксированное число: шаг выбора питомца
// физически отсутствует в последовательности при выборе классического режима
// (а не просто скрывается условием), поэтому прогресс-бар и нумерация шагов
// всегда соответствуют реальному пути пользователя.
//
// То же самое для сигнала «мало времени» (шаг experience): шаг выбора питомца
// пропускается и для него (дефолтный питомец назначается автоматически, сменить
// можно в /settings) — это ортогонально классическому режиму, оба условия просто
// складываются. Шаг «reminders» из последовательности не убирается (он остаётся
// нумерованным экраном), но при «мало времени» рендерит один пресет вместо трёх
// переключателей — см. currentStep === 'reminders' ниже.
type StepKey = 'welcome' | 'mode' | 'goals' | 'experience' | 'reminders' | 'pet' | 'action';

function buildSteps(interfaceMode: InterfaceMode, quickStart: boolean): StepKey[] {
  const steps: StepKey[] = ['welcome', 'mode', 'goals', 'experience', 'reminders'];
  if (interfaceMode === InterfaceMode.Companion && !quickStart) steps.push('pet');
  steps.push('action');
  return steps;
}

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { needsOnboarding, isLoading, complete } = useOnboarding();
  const setPet = useSetPet();
  const setInterfaceMode = useSetInterfaceMode();

  const [step, setStep] = useState(0);
  const [interfaceMode, setInterfaceModeState] = useState<InterfaceMode>(InterfaceMode.Companion);
  const [goals, setGoals] = useState<string[]>([]);
  const [expLevel, setExpLevel] = useState<ExpLevel>(ExpLevel.Beginner);
  const [quickStart, setQuickStart] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [afternoonReminder, setAfternoonReminder] = useState(false);
  const [afternoonTime, setAfternoonTime] = useState('14:00');
  const [eveningReminder, setEveningReminder] = useState(false);
  const [eveningTime, setEveningTime] = useState('20:00');
  const [petType, setPetType] = useState<string>('puff');
  const [petName, setPetName] = useState('');
  const [saving, setSaving] = useState(false);

  const steps = useMemo(() => buildSteps(interfaceMode, quickStart), [interfaceMode, quickStart]);
  const currentStep = steps[step] ?? 'welcome';
  const isClassic = interfaceMode === InterfaceMode.Classic;

  // navigate() during render updates the router while OnboardingPage is
  // still rendering, which React warns about ("Cannot update a component
  // while rendering a different component") and can race with concurrent
  // rendering — do the redirect as an effect instead.
  useEffect(() => {
    if (!isLoading && !needsOnboarding) {
      navigate('/my-day', { replace: true });
    }
  }, [isLoading, needsOnboarding, navigate]);

  if (isLoading || !needsOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const toggleGoal = (key: string) => {
    setGoals((prev) => (prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]));
  };

  // При «мало времени» шаг напоминаний схлопывается в один пресет — вечернее
  // напоминание с гибким окном (Сессия 4), а не три отдельных решения по слотам.
  const reminderPayload = quickStart
    ? {
        dailyReminder: false,
        afternoonReminder: false,
        eveningReminder,
        eveningTime,
        eveningMode: 'window' as const,
        eveningWindowStart: '20:00',
        eveningWindowEnd: '23:00',
      }
    : {
        dailyReminder,
        reminderTime,
        afternoonReminder,
        afternoonTime,
        eveningReminder,
        eveningTime,
      };

  const handleFinish = async (destination = '/my-day') => {
    setSaving(true);
    try {
      await complete({
        goals,
        experienceLevel: expLevel,
        ...reminderPayload,
      });
      // Режим сохраняется на User (не в UserPreference), поэтому отдельный вызов.
      // Отправляем всегда, а не только для классического — иначе повторный заход
      // в онбординг (например, после сброса localStorage) не перезапишет ранее
      // выбранный классический режим обратно на дефолтный companion.
      await setInterfaceMode.mutateAsync(interfaceMode);
      if (!isClassic && (petName.trim() || petType !== 'puff')) {
        await setPet.mutateAsync({ petType, petName: petName.trim() || null });
      }
      navigate(destination, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    await complete({ goals: [], experienceLevel: ExpLevel.Beginner, dailyReminder: false });
    navigate('/my-day', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 promo-scope">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center gap-1.5">
            {steps.map((key, i) => (
              <div
                key={key}
                className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                  i === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {currentStep === 'welcome' && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t('onboarding2.welcomeTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">{t('onboarding2.welcomeDesc')}</p>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={handleSkip} disabled={saving}>
                  {t('onboarding.skip')}
                </Button>
                <Button onClick={() => setStep(step + 1)}>{t('onboarding.next')}</Button>
              </div>
            </>
          )}

          {currentStep === 'mode' && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t('onboarding2.modeTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">{t('onboarding2.modeDesc')}</p>
              <div className="flex flex-col gap-3">
                {(
                  [
                    { mode: InterfaceMode.Companion, icon: PawPrint },
                    { mode: InterfaceMode.Classic, icon: NotebookPen },
                  ] as const
                ).map(({ mode, icon: Icon }) => {
                  const isActive = interfaceMode === mode;
                  const titleKey =
                    mode === InterfaceMode.Companion
                      ? 'onboarding2.modeCompanionTitle'
                      : 'onboarding2.modeClassicTitle';
                  const descKey =
                    mode === InterfaceMode.Companion
                      ? 'onboarding2.modeCompanionDesc'
                      : 'onboarding2.modeClassicDesc';
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setInterfaceModeState(mode)}
                      aria-pressed={isActive}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 text-left cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isActive
                          ? 'border-primary bg-primary/5 shadow-neumorphic-sm'
                          : 'border-border bg-card shadow-neumorphic-sm',
                      )}
                    >
                      <span
                        className={cn(
                          'w-11 h-11 rounded-full grid place-items-center shrink-0',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <Icon aria-hidden="true" className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t(titleKey)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(descKey)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip} disabled={saving}>
                  {t('onboarding.skip')}
                </Button>
                <Button onClick={() => setStep(step + 1)}>{t('onboarding.next')}</Button>
              </div>
            </>
          )}

          {currentStep === 'goals' && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t('onboarding2.goalsTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">{t('onboarding2.goalsDesc')}</p>
              <div className="flex flex-col gap-2">
                {GOALS.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleGoal(key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 text-left cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      goals.includes(key)
                        ? 'border-primary bg-primary/5 shadow-neumorphic-sm'
                        : 'border-border bg-card shadow-neumorphic-sm'
                    }`}
                  >
                    <Icon aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {t(`onboarding2.goal${key.charAt(0).toUpperCase() + key.slice(1)}`)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => setStep(step + 1)}>{t('onboarding.next')}</Button>
              </div>
            </>
          )}

          {currentStep === 'experience' && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t('onboarding2.expTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">{t('onboarding2.expDesc')}</p>
              <div className="flex flex-col gap-2">
                {EXP_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setExpLevel(level)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 text-left cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      expLevel === level
                        ? 'border-primary bg-primary/5 shadow-neumorphic-sm'
                        : 'border-border bg-card shadow-neumorphic-sm'
                    }`}
                  >
                    <Sparkles
                      aria-hidden="true"
                      className={`w-5 h-5 shrink-0 ${
                        expLevel === level ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t(`onboarding2.exp${level.charAt(0).toUpperCase() + level.slice(1)}`)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl bg-card shadow-neumorphic-sm p-3 cursor-pointer text-left">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Zap aria-hidden="true" className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('onboarding2.quickStartTitle')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('onboarding2.quickStartDesc')}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={quickStart}
                  onCheckedChange={(next) => {
                    setQuickStart(next);
                    if (next) setEveningReminder(true);
                  }}
                  aria-label={t('onboarding2.quickStartTitle')}
                />
              </label>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => setStep(step + 1)}>{t('onboarding.next')}</Button>
              </div>
            </>
          )}

          {currentStep === 'reminders' && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t('onboarding2.reminderTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {quickStart ? t('onboarding2.reminderQuickDesc') : t('onboarding2.reminderDesc')}
              </p>
              {quickStart ? (
                <div className="flex flex-col gap-3 text-left pt-1">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-card shadow-neumorphic-sm p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                        <Moon aria-hidden="true" className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t('settings.slotEvening')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('onboarding2.reminderQuickPreset')}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={eveningReminder}
                      onCheckedChange={setEveningReminder}
                      aria-label={t('settings.slotEvening')}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('onboarding2.reminderQuickHint')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 text-left pt-1">
                  <ReminderRow
                    icon={Bell}
                    label={t('settings.slotMorning')}
                    checked={dailyReminder}
                    time={reminderTime}
                    onToggle={setDailyReminder}
                    onTime={setReminderTime}
                  />
                  <ReminderRow
                    icon={SunMedium}
                    label={t('settings.slotDay')}
                    checked={afternoonReminder}
                    time={afternoonTime}
                    onToggle={setAfternoonReminder}
                    onTime={setAfternoonTime}
                  />
                  <ReminderRow
                    icon={Moon}
                    label={t('settings.slotEvening')}
                    checked={eveningReminder}
                    time={eveningTime}
                    onToggle={setEveningReminder}
                    onTime={setEveningTime}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => setStep(step + 1)}>{t('onboarding.next')}</Button>
              </div>
            </>
          )}

          {currentStep === 'pet' && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t('onboarding2.petTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">{t('onboarding2.petDesc')}</p>

              <div className="flex justify-center py-2">
                <div className="relative w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                  <span aria-hidden="true" className="text-5xl">
                    {PET_DEFINITIONS.find((p) => p.type === petType)?.emoji ?? '🫧'}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse"
                  />
                </div>
              </div>

              <div className="text-left">
                <label
                  htmlFor="pet-name"
                  className="block text-xs font-medium text-muted-foreground mb-1.5"
                >
                  {t('onboarding2.petNameLabel')}
                </label>
                <input
                  id="pet-name"
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder={t('onboarding2.petNamePlaceholder')}
                  maxLength={24}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground border-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="text-left">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('onboarding2.petChooseTitle')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PET_DEFINITIONS.filter((p) => STARTER_PET_TYPES.includes(p.type as never)).map(
                    (pet) => {
                      const isActive = petType === pet.type;
                      return (
                        <button
                          key={pet.type}
                          type="button"
                          onClick={() => setPetType(pet.type)}
                          aria-pressed={isActive}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-[background-color,border-color,box-shadow,transform] duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                              ? 'border-primary bg-primary/5 shadow-neumorphic-sm'
                              : 'border-border bg-card shadow-neumorphic-sm',
                          )}
                        >
                          <span
                            className={cn(
                              'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                              pet.color,
                            )}
                          >
                            <span aria-hidden="true">{pet.emoji}</span>
                          </span>
                          <span className="text-xs font-medium text-foreground leading-tight">
                            {t(pet.labelKey)}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{t('onboarding2.petMoreHint')}</p>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => setStep(step + 1)}>{t('onboarding.next')}</Button>
              </div>
            </>
          )}

          {currentStep === 'action' && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t('onboarding2.actionTitle')}
              </h2>
              <p className="text-muted-foreground text-sm">{t('onboarding2.actionDesc')}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleFinish('/')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-[opacity,transform] active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LayoutDashboard aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('onboarding.chooseDashboard')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('onboarding.chooseDashboardDesc')}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleFinish('/practices/breathing')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-[opacity,transform] active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Wind aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('onboarding.chooseBreathing')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('breathing.subtitle')}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleFinish('/tests')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-[opacity,transform] active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ClipboardList aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('onboarding.chooseTest')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('tests.title')}</p>
                  </div>
                </button>
              </div>
              <WellnessDisclaimer variant="compact" />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  {t('common.back')}
                </Button>
                <Button onClick={() => handleFinish('/')} disabled={saving} className="btn-neon">
                  {saving ? t('common.saving') : t('onboarding.getStarted')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
