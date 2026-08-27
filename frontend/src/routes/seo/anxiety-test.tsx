import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
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
  RelatedBlogPosts,
  SeoDisclaimer,
  SeoFooter,
} from './seo-components';

export default function AnxietyTestPage() {
  const { t } = useTranslation();

  const faq = [
    {
      q: 'Насколько точен этот тест?',
      a: 'Тест основан на шкале тревоги Спилбергера (STAI) — одной из самых распространённых методик в клинической психологии. Он даёт ориентировочную оценку уровня тревоги, но не является медицинским диагнозом.',
    },
    {
      q: 'Что делать с результатом теста?',
      a: 'Если тест показывает высокий уровень тревоги, мы рекомендуем обратиться к психотерапевту. Moodly предлагает практики для снижения тревоги (дыхательные упражнения, КПТ-игры), которые могут быть полезны как дополнение к терапии.',
    },
  ];

  useSeo({
    title: t('seoPages.anxietyTest.meta.title'),
    description: t('seoPages.anxietyTest.meta.description'),
    canonical: withCanonical('/anxiety-test'),
    markSeoOrigin: 'anxiety-test',
    jsonLd: [
      breadcrumbLd([
        { name: t('seoPages.anxietyTest.breadcrumb.home'), url: withCanonical('/') },
        { name: t('seoPages.anxietyTest.breadcrumb.current'), url: withCanonical('/anxiety-test') },
      ]),
      faqPageLd(faq),
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t('seoPages.anxietyTest.breadcrumb.home'), to: '/' },
          { label: t('seoPages.anxietyTest.breadcrumb.current') },
        ]}
      />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-foreground leading-[1.1] text-balance">
                {t('seoPages.anxietyTest.hero.title')}{' '}
                <span className="text-primary">{t('seoPages.anxietyTest.hero.accent')}</span>
              </h1>
              <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
                {t('seoPages.anxietyTest.hero.sub1')}
              </p>
              <p className="mt-2 text-muted-foreground text-base leading-relaxed max-w-xl">
                {t('seoPages.anxietyTest.hero.sub2')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link to="/tests">
                    {t('seoPages.anxietyTest.hero.ctaPrimary')}
                    <ArrowRight aria-hidden="true" className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/mood-diary">{t('seoPages.anxietyTest.hero.ctaSecondary')}</Link>
                </Button>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={120}>
            <Card className="p-6 bg-card-gradient shadow-clay-lg">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-foreground">
                  {t('seoPages.anxietyTest.mock.title')}
                </p>
                <span className="text-xs text-muted-foreground">
                  {t('seoPages.anxietyTest.mock.progress')}
                </span>
              </div>
              <p className="mt-3 text-sm text-foreground">
                {t('seoPages.anxietyTest.mock.question')}
              </p>
              {[1, 2, 3].map((i) => (
                <p key={i} className="mt-1 text-xs text-muted-foreground">
                  {t(`seoPages.anxietyTest.mock.option.${i}`)}
                </p>
              ))}
              <div className="mt-4 rounded-xl bg-secondary/70 px-3 py-2 text-sm font-semibold text-primary">
                {t('seoPages.anxietyTest.mock.selected')}
              </div>
            </Card>
          </Reveal>
        </section>

        {/* About test */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t('seoPages.anxietyTest.about.kicker')}
            title={t('seoPages.anxietyTest.about.title')}
            text={[t('seoPages.anxietyTest.about.text1'), t('seoPages.anxietyTest.about.text2')]}
          />
          <Card className="mt-8 p-6 sm:p-8">
            <p className="text-center text-sm font-bold text-foreground">
              {t('seoPages.anxietyTest.scale.title')}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="rounded-full px-4 py-2 text-xs font-semibold bg-primary/5 border border-primary/10 text-muted-foreground"
                >
                  {t(`seoPages.anxietyTest.scale.range.${i}`)}
                </span>
              ))}
            </div>
          </Card>
        </section>

        {/* How it goes */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t('seoPages.anxietyTest.how.kicker')}
            title={t('seoPages.anxietyTest.how.title')}
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Reveal key={i} delay={(i - 1) * 100} className="h-full">
                <Card className="p-6 h-full">
                  <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary">
                    {i}
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">
                    {t(`seoPages.anxietyTest.how.steps.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t(`seoPages.anxietyTest.how.steps.${i}.text`)}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Trust cards */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 grid md:grid-cols-2 gap-4">
          <Reveal>
            <Card className="p-6 h-full">
              <Lock aria-hidden="true" className="w-5 h-5 text-primary" />
              <h3 className="mt-3 font-bold text-foreground">
                {t('seoPages.anxietyTest.trust.private.title')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t('seoPages.anxietyTest.trust.private.text')}
              </p>
            </Card>
          </Reveal>
          <Reveal delay={100}>
            <Card className="p-6 h-full">
              <ShieldCheck aria-hidden="true" className="w-5 h-5 text-primary" />
              <h3 className="mt-3 font-bold text-foreground">
                {t('seoPages.anxietyTest.trust.care.title')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t('seoPages.anxietyTest.trust.care.text')}
              </p>
            </Card>
          </Reveal>
        </section>

        {/* FAQ */}
        <FaqAccordion title={t('seoPages.anxietyTest.faq.title')} items={faq} />

        {/* Related */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 text-center">
          <p className="text-sm text-muted-foreground">
            {t('seoPages.anxietyTest.related.text')}{' '}
            <Link to="/anxiety-self-help" className="font-semibold text-primary hover:underline">
              {t('seoPages.anxietyTest.related.link')}
            </Link>
          </p>
        </section>

        <RelatedBlogPosts category="anxiety" title={t('seo.relatedArticles')} />

        {/* CTA */}
        <CtaBanner
          title={t('seoPages.anxietyTest.cta.title')}
          text={t('seoPages.anxietyTest.cta.text')}
          button={t('seoPages.anxietyTest.cta.button')}
          to="/tests"
        />
      </main>

      <SeoDisclaimer
        lines={[
          'Тест не является медицинским диагнозом.',
          'При устойчивых симптомах тревоги обратитесь к психотерапевту.',
        ]}
      />
      <SeoFooter />
    </div>
  );
}
