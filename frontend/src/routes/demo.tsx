import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Heart,
  ArrowRight,
  ArrowLeft,
  PawPrint,
  NotebookPen,
  Flame,
  Trophy,
  Info,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ProgressBar } from '../components/ui/progress-bar';
import { useSeo, withCanonical } from '../lib/seo';
import { cn } from '../lib/utils';
import { InterfaceMode, ParameterName } from '../lib/constants';
import { RATING_LEVELS } from '../lib/ratingLevels';

// /demo — публичная витрина для анонимных посетителей лендинга (Session 2,
// docs/plans/three-personas-design-gaps.md). Осознанно НЕ ходит в бэкенд ни
// одним запросом: ни логина, ни JWT, ни чтения/записи данных. Всё, что видно
// на странице, — фикстуры прямо во фронтенд-бандле. Причина — в
// docs/audit/public-demo-risk-assessment.md: общий demo@moodly.app аккаунт
// несовместим с анонимным конкурентным доступом (общее состояние на всех
// посетителей) и с E2E-шифрованием (DEK разворачивается только паролем
// владельца, а анонимный посетитель пароля не вводит). Поэтому здесь —
// read-only превью, а не живой демо-логин.
const PetAvatar = lazy(() =>
  import('../features/gamification/PetAvatar').then((m) => ({ default: m.default })),
);

const MOOD_BAR_HEIGHTS = [72, 96, 84, 118, 104, 92, 130];
const moodLevels = RATING_LEVELS[ParameterName.Mood] ?? [];

const DEMO_ACHIEVEMENTS = [
  { key: 'firstCheckin', icon: Trophy },
  { key: 'streak7', icon: Flame },
  { key: 'level5', icon: Trophy },
] as const;

function useDemoSeo() {
  const { t } = useTranslation();
  useSeo({
    title: t('demo.seo.title'),
    description: t('demo.seo.description'),
    canonical: withCanonical('/demo'),
    // Витрина с фикстурами, не самостоятельная страница контента — не индексируем.
    noindex: true,
  });
}

function DemoHeader() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <ArrowLeft aria-hidden="true" className="w-4 h-4" />
          {t('demo.backToLanding')}
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart aria-hidden="true" className="w-4 h-4 text-primary" />
          </span>
          <span className="text-base font-heading font-extrabold text-foreground" translate="no">
            Moodly
          </span>
        </Link>
        <Button size="sm" asChild>
          <Link to="/register">{t('demo.register')}</Link>
        </Button>
      </div>
    </header>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: InterfaceMode;
  onChange: (mode: InterfaceMode) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2">
      {(
        [
          { mode: InterfaceMode.Companion, icon: PawPrint },
          { mode: InterfaceMode.Classic, icon: NotebookPen },
        ] as const
      ).map(({ mode: m, icon: Icon }) => {
        const isActive = mode === m;
        const titleKey =
          m === InterfaceMode.Companion
            ? 'onboarding2.modeCompanionTitle'
            : 'onboarding2.modeClassicTitle';
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'border-primary bg-primary/5 text-primary shadow-neumorphic-sm'
                : 'border-border bg-card text-muted-foreground shadow-neumorphic-sm',
            )}
          >
            <Icon aria-hidden="true" className="w-4 h-4" />
            {t(titleKey)}
          </button>
        );
      })}
    </div>
  );
}

function DemoNotice() {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-muted-foreground">
      <Info aria-hidden="true" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <span>{t('demo.notice')}</span>
    </div>
  );
}

function DemoMoodChart() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t('demo.chart.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-[140px]">
          {MOOD_BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={cn(
                'w-full rounded-md animate-bar-grow',
                i === MOOD_BAR_HEIGHTS.length - 1 ? 'bg-nature-growth' : 'bg-primary/30',
              )}
              style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t('demo.chart.caption')}</p>
      </CardContent>
    </Card>
  );
}

function DemoMoodPicker() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);

  const handlePick = (value: number) => {
    setSelected(value);
    toast.info(t('demo.saveHint'));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t('demo.checkin.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          {moodLevels.map((level) => {
            const isActive = selected === level.value;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => handlePick(level.value)}
                aria-pressed={isActive}
                aria-label={t(level.labelKey)}
                className={cn(
                  'flex-1 aspect-square rounded-2xl flex items-center justify-center transition-[background-color,transform] duration-150 cursor-pointer active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-neumorphic-sm'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <level.Icon aria-hidden="true" className="w-6 h-6" />
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t('demo.checkin.hint')}</p>
      </CardContent>
    </Card>
  );
}

function DemoCompanionPanel() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 flex items-center gap-4">
          <Suspense fallback={<div className="w-[72px] h-[72px]" aria-hidden="true" />}>
            <PetAvatar petType="puff" size="md" plain ariaLabel="Moodly companion" />
          </Suspense>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{t('demo.companion.level')}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-nature-growth">
                <Flame aria-hidden="true" className="w-3.5 h-3.5" />
                {t('demo.companion.streak')}
              </span>
            </div>
            <ProgressBar
              segments={[{ value: 62, className: 'bg-primary' }]}
              height={2.5}
              trackClassName="bg-muted"
            />
            <p className="text-xs text-muted-foreground">{t('demo.companion.xp')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('demo.companion.achievementsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACHIEVEMENTS.map(({ key, icon: Icon }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
              >
                <Icon aria-hidden="true" className="w-3.5 h-3.5" />
                {t(`achievements.${key}`)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DemoClassicPanel() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold text-foreground">{t('demo.classic.title')}</p>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
          {t('demo.classic.text')}
        </p>
      </CardContent>
    </Card>
  );
}

function DemoCta() {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl bg-btn-gradient shadow-clay-lg p-6 sm:p-8 text-center">
      <h2 className="text-xl sm:text-2xl font-extrabold text-white text-balance">
        {t('demo.cta.title')}
      </h2>
      <p className="mt-2 text-sm text-white/85">{t('demo.cta.text')}</p>
      <Button
        size="lg"
        variant="secondary"
        className="mt-5 bg-white text-primary hover:bg-white/95"
        asChild
      >
        <Link to="/register">
          {t('demo.cta.button')}
          <ArrowRight aria-hidden="true" className="w-5 h-5" />
        </Link>
      </Button>
    </div>
  );
}

export default function DemoPage() {
  const { t } = useTranslation();
  useDemoSeo();
  const [mode, setMode] = useState<InterfaceMode>(InterfaceMode.Companion);
  const isClassic = mode === InterfaceMode.Classic;

  return (
    <div className="min-h-screen bg-background promo-scope">
      <DemoHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-4">
            {t('demo.badge')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground text-balance">
            {t('demo.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            {t('demo.subtitle')}
          </p>
        </div>

        <DemoNotice />

        <ModeToggle mode={mode} onChange={setMode} />

        <div className="grid sm:grid-cols-2 gap-4 items-start">
          <DemoMoodPicker />
          <DemoMoodChart />
        </div>

        {isClassic ? <DemoClassicPanel /> : <DemoCompanionPanel />}

        <DemoCta />
      </main>
    </div>
  );
}
