import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import Reveal from '../../components/Reveal';
import { useSeo, withCanonical, breadcrumbLd, faqPageLd } from '../../lib/seo';
import {
  SeoHeader,
  SeoBreadcrumbs,
  SeoSectionHeading,
  FaqAccordion,
  CtaBanner,
  SeoDisclaimer,
  SeoFooter,
} from './seo-components';

export default function MoodDiaryPage() {
  const { t } = useTranslation();

  const faq = [
    {
      q: 'Как часто нужно вести дневник?',
      a: 'Начните с 3-5 минут в день. Исследования показывают: регулярность важнее продолжительности. Даже 30 секунд в день дают эффект через 2-3 недели.',
    },
    {
      q: 'Что делать, если я пропустил день?',
      a: 'Просто начните снова. Не пытайтесь «догнать» пропущенные дни. Важен общий тренд, а не идеальная серия. Серия прервалась — это нормально, просто продолжайте.',
    },
    {
      q: 'Помогает ли дневник при тревоге?',
      a: 'Да. Регулярное ведение дневника — один из инструментов, которые психологи чаще всего рекомендуют при повышенной тревожности: он помогает заметить триггеры и снизить накал мыслей через проговаривание на бумаге. Эффект накапливается постепенно и обычно заметен через несколько недель регулярной практики.',
    },
    {
      q: 'Что ещё можно отслеживать в дневнике?',
      a: 'Кроме настроения, добавьте энергию, сон и тревогу. Это помогает увидеть связи: например, «плохо спал → низкая энергия → тревога». Такие инсайты дают ключ к управлению состоянием.',
    },
  ];

  useSeo({
    title: t('seoPages.moodDiary.meta.title'),
    description: t('seoPages.moodDiary.meta.description'),
    canonical: withCanonical('/mood-diary'),
    jsonLd: [
      breadcrumbLd([
        { name: t('seoPages.moodDiary.breadcrumb.home'), url: withCanonical('/') },
        { name: t('seoPages.moodDiary.breadcrumb.current'), url: withCanonical('/mood-diary') },
      ]),
      faqPageLd(faq),
    ],
  });

  const stats = [
    { value: '30 сек', label: 'в среднем занимает одна запись' },
    { value: '4', label: 'параметра: настроение, энергия, сон, тревога' },
    { value: '7 дней', label: 'чтобы заметить первые закономерности' },
    { value: '30 дней', label: 'чтобы увидеть устойчивый тренд' },
  ];

  const params = [
    { title: 'Настроение', sub: 'Отслеживайте колебания эмоций' },
    { title: 'Энергия', sub: 'Замечайте, как меняется ваша активность' },
    { title: 'Тревога', sub: 'Отслеживайте уровень тревожности' },
    { title: 'Сон', sub: 'Видите связь между сном и настроением' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t('seoPages.moodDiary.breadcrumb.home'), to: '/' },
          { label: t('seoPages.moodDiary.breadcrumb.current') },
        ]}
      />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-foreground leading-[1.1] text-balance">
                {t('seoPages.moodDiary.hero.title')}{' '}
                <span className="text-primary">{t('seoPages.moodDiary.hero.accent')}</span>
              </h1>
              <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
                {t('seoPages.moodDiary.hero.sub1')}
              </p>
              <p className="mt-2 text-muted-foreground text-base leading-relaxed max-w-xl">
                {t('seoPages.moodDiary.hero.sub2')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link to="/register">
                    {t('seoPages.moodDiary.hero.ctaPrimary')}
                    <ArrowRight aria-hidden="true" className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/anxiety-test">{t('seoPages.moodDiary.hero.ctaSecondary')}</Link>
                </Button>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={120}>
            <Card className="p-6 bg-card-gradient shadow-clay-lg">
              <p className="text-sm font-bold text-foreground">
                {t('seoPages.moodDiary.mock.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('seoPages.moodDiary.mock.subtitle')}
              </p>
              <div className="mt-4 space-y-3">
                {[
                  t('seoPages.moodDiary.mock.row1'),
                  t('seoPages.moodDiary.mock.row2'),
                  t('seoPages.moodDiary.mock.row3'),
                ].map((row, i) => (
                  <div key={i} className="rounded-xl bg-secondary/60 p-3 text-sm text-foreground">
                    {row}
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </section>

        {/* Stats */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <Card className="p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.value}>
                <p className="text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </Card>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <SeoSectionHeading
            kicker={t('seoPages.moodDiary.why.kicker')}
            title={t('seoPages.moodDiary.why.title')}
            text={[t('seoPages.moodDiary.why.text1'), t('seoPages.moodDiary.why.text2')]}
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Reveal key={i} delay={(i - 1) * 100} className="h-full">
                <Card className="p-6 h-full">
                  <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary">
                    {i}
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">
                    {t(`seoPages.moodDiary.why.steps.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t(`seoPages.moodDiary.why.steps.${i}.text`)}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Params */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t('seoPages.moodDiary.params.kicker')}
            title={t('seoPages.moodDiary.params.title')}
          />
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {params.map((p, i) => (
              <Reveal key={p.title} delay={i * 80} className="h-full">
                <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 h-full">
                  <h3 className="font-bold text-foreground">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How to start */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t('seoPages.moodDiary.how.kicker')}
            title={t('seoPages.moodDiary.how.title')}
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Reveal key={i} delay={(i - 1) * 100} className="h-full">
                <Card className="p-6 text-center h-full">
                  <span className="text-4xl font-extrabold text-primary">{i}</span>
                  <h3 className="mt-3 font-bold text-foreground">
                    {t(`seoPages.moodDiary.how.steps.${i}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`seoPages.moodDiary.how.steps.${i}.text`)}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button size="lg" asChild>
              <Link to="/register">{t('seoPages.moodDiary.how.cta')}</Link>
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <FaqAccordion title={t('seoPages.moodDiary.faq.title')} items={faq} />

        {/* CTA */}
        <CtaBanner
          title={t('seoPages.moodDiary.cta.title')}
          text={t('seoPages.moodDiary.cta.text')}
          button={t('seoPages.moodDiary.cta.button')}
        />
      </main>

      <SeoDisclaimer
        lines={[t('seoPages.moodDiary.disclaimer.1'), t('seoPages.moodDiary.disclaimer.2')]}
      />
      <SeoFooter />
    </div>
  );
}
