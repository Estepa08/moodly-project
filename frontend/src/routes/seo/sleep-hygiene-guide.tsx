import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Moon, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import Reveal from "../../components/Reveal";
import { useSeo, withCanonical } from "../../lib/seo";
import {
  SeoHeader,
  SeoBreadcrumbs,
  SeoSectionHeading,
  FaqAccordion,
  CtaBanner,
  SeoDisclaimer,
  SeoFooter,
} from "./seo-components";

export default function SleepHygieneGuidePage() {
  const { t } = useTranslation();
  useSeo({
    title: t("seoPages.sleepHygiene.meta.title"),
    description: t("seoPages.sleepHygiene.meta.description"),
    canonical: withCanonical("/sleep-hygiene-guide"),
  });

  const faq = [1, 2, 3].map((i) => ({
    q: t(`seoPages.sleepHygiene.faq.${i}.q`),
    a: t(`seoPages.sleepHygiene.faq.${i}.a`),
  }));

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t("seoPages.sleepHygiene.breadcrumb.home"), to: "/" },
          { label: t("seoPages.sleepHygiene.breadcrumb.current") },
        ]}
      />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-foreground leading-[1.1] text-balance">
                {t("seoPages.sleepHygiene.hero.title")}{" "}
                <span className="text-primary">{t("seoPages.sleepHygiene.hero.accent")}</span>
              </h1>
              <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
                {t("seoPages.sleepHygiene.hero.text")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link to="/register">
                    {t("seoPages.sleepHygiene.hero.ctaPrimary")}
                    <ArrowRight aria-hidden="true" className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/mood-diary">{t("seoPages.sleepHygiene.hero.ctaSecondary")}</Link>
                </Button>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={120}>
            <Card className="p-6 bg-card-gradient shadow-clay-lg">
              <div className="flex items-center gap-2">
                <Moon aria-hidden="true" className="w-5 h-5 text-primary" />
                <p className="font-bold text-foreground">{t("seoPages.sleepHygiene.mock.title")}</p>
              </div>
              <div className="mt-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
                    <CheckCircle2
                      aria-hidden="true"
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-foreground">
                      {t(`seoPages.sleepHygiene.mock.item.${i}`)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </section>

        {/* Why sleep matters */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t("seoPages.sleepHygiene.why.kicker")}
            title={t("seoPages.sleepHygiene.why.title")}
            text={[t("seoPages.sleepHygiene.why.text1"), t("seoPages.sleepHygiene.why.text2")]}
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Reveal key={i} delay={(i - 1) * 100} className="h-full">
                <Card className="p-6 h-full">
                  <h3 className="font-bold text-foreground">
                    {t(`seoPages.sleepHygiene.why.points.${i}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t(`seoPages.sleepHygiene.why.points.${i}.text`)}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Habit checklist */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t("seoPages.sleepHygiene.habits.kicker")}
            title={t("seoPages.sleepHygiene.habits.title")}
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Reveal
                key={i}
                delay={(i - 1) * 70}
                className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4 h-full"
              >
                <span>
                  <CheckCircle2
                    aria-hidden="true"
                    className="w-5 h-5 text-primary shrink-0 mt-0.5"
                  />
                </span>
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    {t(`seoPages.sleepHygiene.habits.items.${i}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`seoPages.sleepHygiene.habits.items.${i}.text`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How moodly helps */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t("seoPages.sleepHygiene.how.kicker")}
            title={t("seoPages.sleepHygiene.how.title")}
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Reveal key={i} delay={(i - 1) * 100} className="h-full">
                <Card className="p-6 text-center h-full">
                  <span className="text-4xl font-extrabold text-primary">{i}</span>
                  <h3 className="mt-3 font-bold text-foreground">
                    {t(`seoPages.sleepHygiene.how.steps.${i}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {t(`seoPages.sleepHygiene.how.steps.${i}.text`)}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <FaqAccordion title={t("seoPages.sleepHygiene.faq.title")} items={faq} />

        {/* CTA */}
        <CtaBanner
          title={t("seoPages.sleepHygiene.cta.title")}
          text={t("seoPages.sleepHygiene.cta.text")}
          button={t("seoPages.sleepHygiene.cta.button")}
        />
      </main>

      <SeoDisclaimer lines={[1, 2].map((i) => t(`seoPages.sleepHygiene.disclaimer.${i}`))} />
      <SeoFooter />
    </div>
  );
}
