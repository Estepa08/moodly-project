import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  BarChart3,
  PawPrint,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
  Lock,
  FileText,
  Smile,
  KeyRound,
  CalendarRange,
  Check,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import Reveal from '../components/Reveal';
import { useLoginForm } from '../hooks/useLoginForm';
import { useSeo, withCanonical } from '../lib/seo';
import { cn } from '../lib/utils';
import { ACTIVITY_CATALOG } from '../lib/dayActivities';
import { PostCard } from './blog/PostCard';
import { POSTS } from './blog/posts';

const PetAvatar = lazy(() =>
  import('../features/gamification/PetAvatar').then((m) => ({ default: m.default })),
);

const COLLECTION_PET_TYPES = [
  'puff',
  'sloth',
  'fox',
  'giraffe',
  'dove',
  'tiger',
  'turtle',
  'monkey',
  'koala',
  'cow',
  'robot',
  'tucan',
];

const MOOD_BAR_HEIGHTS = [86, 106, 86, 124, 100, 66, 134];

function useLandingSeo() {
  const { t } = useTranslation();
  useSeo({
    title: t('landing.seo.title'),
    description: t('landing.seo.description'),
    canonical: withCanonical('/'),
  });
}

function LangSwitch({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const items = ['ru', 'en'] as const;
  return (
    <div className={cn('flex items-center gap-1 text-xs', className)}>
      {items.map((lng, i) => (
        <span key={lng} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">|</span>}
          <button
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            className={cn(
              'px-1.5 py-0.5 rounded cursor-pointer transition-[color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              i18n.language === lng ? 'text-primary font-semibold' : 'text-muted-foreground',
            )}
          >
            {lng === 'en' ? t('common.languageEn') : t('common.languageRu')}
          </button>
        </span>
      ))}
    </div>
  );
}

function LandingHeader() {
  const { t } = useTranslation();
  const nav = [
    { href: '#features', label: t('landing.navInside') },
    { href: '#pets', label: t('landing.navPets') },
    { href: '#tests', label: t('landing.navTests') },
    { href: '#privacy', label: t('landing.navPrivacy') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart aria-hidden="true" className="w-5 h-5 text-primary" />
          </span>
          <span className="text-lg font-heading font-extrabold text-foreground" translate="no">
            Moodly
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangSwitch className="md:hidden" />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/login">{t('landing.signIn')}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">{t('landing.start')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroMock() {
  const { t } = useTranslation();
  return (
    <div className="relative mx-auto max-w-sm w-full">
      <div className="bg-card rounded-[2rem] border border-border shadow-clay-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground" translate="no">
            Moodly
          </span>
          <span className="text-[10px] text-muted-foreground">{t('landing.hero.mockMood')}</span>
        </div>

        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="w-[96px] h-[96px]" aria-hidden="true" />}>
            <PetAvatar petType="puff" size="lg" plain interactive ariaLabel="Moodly companion" />
          </Suspense>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {t('landing.hero.mockCompanion')}
            </p>
            <p className="text-xs text-muted-foreground">{t('landing.hero.mockStreak')}</p>
          </div>
        </div>

        <div className="rounded-xl bg-secondary/70 p-3">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">
            {t('landing.hero.mockMood')}
          </p>
          <div className="flex items-end gap-1.5 h-[134px]">
            {MOOD_BAR_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className={cn(
                  'w-full rounded-md animate-bar-grow',
                  i === 3 || i === 6 ? 'bg-primary' : 'bg-primary/30',
                )}
                style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-3 flex items-center gap-3 shadow-neumorphic-sm">
          <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles aria-hidden="true" className="w-5 h-5 text-primary" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">
              {t('landing.hero.mockPractice')}
            </p>
            <p className="text-[11px] text-muted-foreground">{t('landing.hero.mockPracticeSub')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingHero() {
  const { t } = useTranslation();
  const { demoMode, demoLoading, handleDemo } = useLoginForm();

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 grid gap-10 lg:grid-cols-2 lg:items-center">
        {/* Заголовок/подзаголовок/CTA — первый экран, без scroll-reveal: должны быть
            видны сразу на первой отрисовке, а не проявляться через IntersectionObserver. */}
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 mb-5">
            ⏱ {t('landing.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-foreground leading-[1.1] text-balance">
            {t('landing.hero.titlePrefix')}{' '}
            <span className="text-primary">{t('landing.hero.accent')}</span>{' '}
            {t('landing.hero.titleSuffix')}
          </h1>
          <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
            {t('landing.hero.text')}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button size="lg" asChild>
              <Link to="/register">
                {t('landing.start')}
                <ArrowRight aria-hidden="true" className="w-5 h-5" />
              </Link>
            </Button>
            {demoMode && (
              <Button size="lg" variant="secondary" onClick={handleDemo} disabled={demoLoading}>
                <Play aria-hidden="true" className="w-4 h-4" />
                {demoLoading ? '...' : t('landing.demo')}
              </Button>
            )}
          </div>
        </div>

        <Reveal direction="right" delay={120}>
          <HeroMock />
        </Reveal>
      </div>
    </section>
  );
}

function LandingStats() {
  const { t } = useTranslation();
  const stats = [
    { value: '27', label: t('landing.stats.pets') },
    { value: '6', label: t('landing.stats.practices') },
    { value: '4', label: t('landing.stats.params') },
    { value: '3', label: t('landing.stats.tests') },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Card className="p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 120}>
            <div>
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </Card>
    </div>
  );
}

function LandingFeatures() {
  const { t } = useTranslation();
  const features = [
    {
      icon: Smile,
      color: 'text-primary bg-primary/10',
      title: t('landing.features.checkin.title'),
      text: t('landing.features.checkin.text'),
    },
    {
      icon: BarChart3,
      color: 'text-accent bg-accent/10',
      title: t('landing.features.analytics.title'),
      text: t('landing.features.analytics.text'),
    },
    {
      icon: PawPrint,
      color: 'text-emerald-600 bg-emerald-500/10',
      title: t('landing.features.pet.title'),
      text: t('landing.features.pet.text'),
    },
    {
      icon: Brain,
      color: 'text-primary bg-primary/10',
      title: t('landing.features.tests.title'),
      text: t('landing.features.tests.text'),
    },
  ];

  return (
    <section id="features" className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">
        {t('landing.features.kicker')}
      </p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-center text-balance">
        {t('landing.features.title')}
      </h2>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 120}>
            <Card className="p-6 h-full">
              <span
                className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', f.color)}
              >
                <f.icon aria-hidden="true" className="w-6 h-6" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LandingSteps() {
  const { t } = useTranslation();
  const steps = [
    { num: '1', title: t('landing.steps.s1.title'), text: t('landing.steps.s1.text') },
    { num: '2', title: t('landing.steps.s2.title'), text: t('landing.steps.s2.text') },
    { num: '3', title: t('landing.steps.s3.title'), text: t('landing.steps.s3.text') },
  ];

  return (
    <section className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <Reveal>
        <div className="rounded-3xl bg-secondary/60 p-6 sm:p-12">
          <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">
            {t('landing.steps.kicker')}
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-center text-balance">
            {t('landing.steps.title')}
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground max-w-xl mx-auto">
            {t('landing.steps.subtitle')}
          </p>

          <div className="mt-10 grid md:grid-cols-3 gap-8 items-start">
            {steps.map((s, i) => (
              <Reveal key={s.num} delay={i * 120}>
                <div className="text-center">
                  <span className="inline-flex w-16 h-16 rounded-full bg-primary/10 items-center justify-center text-2xl font-extrabold text-primary">
                    {s.num}
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      className="hidden md:block mx-auto w-16 border-t-2 border-dashed border-primary/30 -mt-8 mb-2"
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="mt-4 text-base font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" asChild>
              <Link to="/register">
                {t('landing.steps.cta')}
                <ArrowRight aria-hidden="true" className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function LandingCompare() {
  const { t } = useTranslation();
  const rows = [
    t('landing.compare.rows.checkin'),
    t('landing.compare.rows.tests'),
    t('landing.compare.rows.companion'),
    t('landing.compare.rows.storage'),
    t('landing.compare.rows.offline'),
  ];

  return (
    <section className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <Reveal>
        <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">
          {t('landing.compare.kicker')}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-center text-balance">
          {t('landing.compare.title')}
        </h2>
      </Reveal>

      <Reveal delay={120}>
        <Card className="mt-8 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 sm:p-5 font-medium text-muted-foreground w-1/2">
                  {t('landing.compare.kicker')}
                </th>
                <th className="p-4 sm:p-5 text-center font-extrabold text-primary w-[15%]">
                  {t('landing.compare.moodly')}
                </th>
                <th className="p-4 sm:p-5 text-center font-semibold text-foreground w-[17.5%]">
                  {t('landing.compare.paper')}
                </th>
                <th className="p-4 sm:p-5 text-center font-semibold text-foreground w-[17.5%]">
                  {t('landing.compare.nothing')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/60 last:border-b-0">
                  <td className="p-4 sm:p-5 text-foreground/90">{row}</td>
                  <td className="p-4 sm:p-5 text-center text-success font-bold">
                    {t('landing.compare.yes')}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-muted-foreground">
                    {t('landing.compare.no')}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-muted-foreground">
                    {t('landing.compare.no')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Reveal>
    </section>
  );
}

function LandingFaq() {
  const { t } = useTranslation();
  const items = t('landing.faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <Reveal>
        <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">
          {t('landing.faq.kicker')}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-center text-balance">
          {t('landing.faq.title')}
        </h2>
      </Reveal>

      <div className="mt-8 space-y-3 max-w-3xl mx-auto">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={i} delay={i * 80}>
              <div className="rounded-2xl border border-border bg-card shadow-neumorphic-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-foreground text-sm">{item.q}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'w-5 h-5 shrink-0 text-primary transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function LandingBlogPreview() {
  const { t } = useTranslation();
  const preview = POSTS.slice(0, 3);

  return (
    <section className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <Reveal>
        <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">
          {t('landing.blogPreview.kicker')}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-center text-balance">
          {t('landing.blogPreview.title')}
        </h2>
      </Reveal>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {preview.map((post, i) => (
          <PostCard key={post.slug} post={post} delay={i * 100} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button size="lg" variant="secondary" asChild>
          <Link to="/blog">
            {t('landing.blogPreview.all')}
            <ArrowRight aria-hidden="true" className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function LandingDayActivities() {
  const { t } = useTranslation();
  const chipKeys = [
    'movement_walk',
    'movement_gym',
    'work_meeting',
    'rest_read',
    'wellbeing_stress',
  ];
  const selectedChips = ['movement_walk', 'movement_gym'];
  const chips = chipKeys.map((k) => {
    const def = ACTIVITY_CATALOG.find((a) => a.labelKey === `dayActivities.activities.${k}`);
    return {
      key: k,
      label: def ? t(def.labelKey) : k,
      active: selectedChips.includes(k),
    };
  });
  const badges = [
    { icon: CheckCircle2, text: t('landing.day.tag180') },
    { icon: Plus, text: t('landing.day.tagCustom') },
    { icon: BarChart3, text: t('landing.day.tagCorrelation') },
  ];
  const points = [t('landing.day.p1'), t('landing.day.p2'), t('landing.day.p3')];

  return (
    <section className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">
        {t('landing.day.kicker')}
      </p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-center text-balance">
        {t('landing.day.title')}
      </h2>
      <p className="mt-3 text-center text-sm text-muted-foreground max-w-xl mx-auto">
        {t('landing.day.subtitle')}
      </p>

      <div className="mt-10 grid lg:grid-cols-2 gap-8 items-center">
        <Reveal>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-neumorphic">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarRange aria-hidden="true" className="w-4 h-4 text-accent" />
              {t('dayActivities.title')}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <span
                  key={c.key}
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                    c.active
                      ? 'bg-accent/15 text-accent ring-1 ring-accent/40'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {c.active && <Check className="mr-1 w-3 h-3" aria-hidden="true" />}
                  {c.label}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.text}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  <b.icon aria-hidden="true" className="w-3.5 h-3.5" />
                  {b.text}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <ul className="space-y-4">
            {points.map((p, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-accent" />
                </span>
                <span className="text-sm text-muted-foreground leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function LandingCollection() {
  const { t } = useTranslation();
  return (
    <section id="pets" className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="rounded-2xl bg-secondary/60 p-6 sm:p-10">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">
          {t('landing.collection.kicker')}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-balance">
          {t('landing.collection.title')}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
          {t('landing.collection.text')}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Suspense
            fallback={
              <div
                className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                aria-hidden="true"
              >
                {COLLECTION_PET_TYPES.map((type) => (
                  <div key={type} className="w-[48px] h-[48px]" />
                ))}
              </div>
            }
          >
            {COLLECTION_PET_TYPES.map((type, i) => (
              <Reveal key={type} delay={i * 60} className="w-[48px]">
                <PetAvatar petType={type} size="sm" plain ariaLabel={type} />
              </Reveal>
            ))}
          </Suspense>
          <Reveal delay={COLLECTION_PET_TYPES.length * 60}>
            <span className="w-[60px] h-[60px] rounded-full bg-white flex items-center justify-center text-sm font-bold text-primary shadow-neumorphic-sm">
              +15
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function LandingTests() {
  const { t } = useTranslation();
  const tests = [
    {
      icon: Smile,
      title: t('landing.tests.mood.title'),
      duration: t('landing.tests.duration', { minutes: '3' }),
      text: t('landing.tests.mood.text'),
      foot: t('landing.tests.mood.foot'),
    },
    {
      icon: Heart,
      title: t('landing.tests.anxiety.title'),
      duration: t('landing.tests.duration', { minutes: '3' }),
      text: t('landing.tests.anxiety.text'),
      foot: t('landing.tests.anxiety.foot'),
    },
    {
      icon: Brain,
      title: t('landing.tests.mind.title'),
      duration: t('landing.tests.duration', { minutes: '4' }),
      text: t('landing.tests.mind.text'),
      foot: t('landing.tests.mind.foot'),
    },
  ];

  return (
    <section id="tests" className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <p className="text-xs font-bold text-primary uppercase tracking-wider text-center">
        {t('landing.tests.kicker')}
      </p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-center text-balance">
        {t('landing.tests.title')}
      </h2>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {tests.map((test, i) => (
          <Reveal key={test.title} delay={i * 120} className="h-full">
            <Card className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <test.icon aria-hidden="true" className="w-5 h-5 text-primary" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">{test.title}</h3>
                  <p className="text-xs text-muted-foreground">{test.duration}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed flex-1">
                {test.text}
              </p>
              <p className="mt-4 flex items-start gap-1.5 text-xs text-foreground/80">
                <CheckCircle2
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-success shrink-0 mt-0.5"
                />
                {test.foot}
              </p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LandingPrivacy() {
  const { t } = useTranslation();
  const items = [
    {
      icon: Lock,
      title: t('landing.privacy.servers.title'),
      text: t('landing.privacy.servers.text'),
    },
    {
      icon: FileText,
      title: t('landing.privacy.consent.title'),
      text: t('landing.privacy.consent.text'),
    },
    {
      icon: ShieldCheck,
      title: t('landing.privacy.ads.title'),
      text: t('landing.privacy.ads.text'),
    },
    {
      icon: CheckCircle2,
      title: t('landing.privacy.disclaimer.title'),
      text: t('landing.privacy.disclaimer.text'),
    },
    {
      icon: Lock,
      title: t('landing.privacy.encryption.title'),
      text: t('landing.privacy.encryption.text'),
    },
    {
      icon: KeyRound,
      title: t('landing.privacy.keyOnly.title'),
      text: t('landing.privacy.keyOnly.text'),
    },
    {
      icon: ShieldCheck,
      title: t('landing.privacy.recovery.title'),
      text: t('landing.privacy.recovery.text'),
    },
  ];

  return (
    <section id="privacy" className="scroll-mt-24 mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="rounded-2xl bg-card border border-border shadow-clay p-6 sm:p-10">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">
          {t('landing.privacy.kicker')}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-balance">
          {t('landing.privacy.title')}
        </h2>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={(i % 4) * 100}>
              <div className="rounded-xl bg-secondary/60 p-4 h-full">
                <item.icon aria-hidden="true" className="w-5 h-5 text-primary" />
                <h3 className="mt-2.5 text-sm font-bold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingCta() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      <Reveal>
        <div className="rounded-3xl bg-btn-gradient shadow-clay-lg p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-[38px] font-extrabold text-white text-balance">
            {t('landing.cta.title')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/85">{t('landing.cta.text')}</p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-7 bg-white text-primary hover:bg-white/95"
            asChild
          >
            <Link to="/register">
              {t('landing.cta.button')}
              <ArrowRight aria-hidden="true" className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

function LandingFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart aria-hidden="true" className="w-4 h-4 text-primary" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground" translate="no">
                Moodly
              </p>
              <p className="text-xs text-muted-foreground">{t('landing.footer.about')}</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link to="/mood-diary" className="hover:text-primary transition-colors duration-150">
              {t('landing.footer.diary')}
            </Link>
            <Link to="/anxiety-test" className="hover:text-primary transition-colors duration-150">
              {t('landing.footer.anxiety')}
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-colors duration-150">
              {t('nav.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors duration-150">
              {t('nav.terms')}
            </Link>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed text-center sm:text-left">
          © 2026 Moodly. {t('landing.footer.disclaimer')}
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  useLandingSeo();
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2 focus:rounded-lg focus:text-primary"
      >
        {t('common.skipToContent')}
      </a>
      <LandingHeader />
      <main id="main-content">
        <LandingHero />
        <LandingStats />
        <LandingFeatures />
        <LandingSteps />
        <LandingDayActivities />
        <LandingCollection />
        <LandingTests />
        <LandingPrivacy />
        <LandingCompare />
        <LandingFaq />
        <LandingBlogPreview />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
