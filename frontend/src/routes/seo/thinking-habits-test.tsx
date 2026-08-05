import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Lock, ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
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

export default function ThinkingHabitsTestPage() {
  const { t } = useTranslation();
  useSeo({
    title: t("seoPages.thinkingHabits.meta.title"),
    description: t("seoPages.thinkingHabits.meta.description"),
    canonical: withCanonical("/thinking-habits-test"),
  });

  const faq = [1, 2].map((i) => ({
    q: t(`seoPages.thinkingHabits.faq.${i}.q`),
    a: t(`seoPages.thinkingHabits.faq.${i}.a`),
  }));

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t("seoPages.thinkingHabits.breadcrumb.home"), to: "/" },
          { label: t("seoPages.thinkingHabits.breadcrumb.current") },
        ]}
      />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-foreground leading-[1.1] text-balance">
              {t("seoPages.thinkingHabits.hero.title")}{" "}
              <span className="text-primary">{t("seoPages.thinkingHabits.hero.accent")}</span>
            </h1>
            <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
              {t("seoPages.thinkingHabits.hero.sub1")}
            </p>
            <p className="mt-2 text-muted-foreground text-base leading-relaxed max-w-xl">
              {t("seoPages.thinkingHabits.hero.sub2")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild>
                <Link to="/tests">
                  {t("seoPages.thinkingHabits.hero.ctaPrimary")}
                  <ArrowRight aria-hidden="true" className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/mood-diary">{t("seoPages.thinkingHabits.hero.ctaSecondary")}</Link>
              </Button>
            </div>
          </div>

          <Card className="p-6 bg-card-gradient shadow-clay-lg">
            <div className="flex items-center gap-2">
              <Brain aria-hidden="true" className="w-5 h-5 text-primary" />
              <p className="font-bold text-foreground">{t("seoPages.thinkingHabits.mock.title")}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("seoPages.thinkingHabits.mock.subtitle")}
            </p>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="mt-3 rounded-xl bg-secondary/60 p-3">
                <p className="text-sm font-semibold text-foreground">
                  {t(`seoPages.thinkingHabits.mock.axis.${i}.name`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`seoPages.thinkingHabits.mock.axis.${i}.desc`)}
                </p>
              </div>
            ))}
          </Card>
        </section>

        {/* About */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t("seoPages.thinkingHabits.about.kicker")}
            title={t("seoPages.thinkingHabits.about.title")}
            text={[
              t("seoPages.thinkingHabits.about.text1"),
              t("seoPages.thinkingHabits.about.text2"),
            ]}
          />
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-primary/5 border border-primary/10 p-5">
                <h3 className="font-bold text-foreground text-sm">
                  {t(`seoPages.thinkingHabits.patterns.${i}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`seoPages.thinkingHabits.patterns.${i}.text`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t("seoPages.thinkingHabits.how.kicker")}
            title={t("seoPages.thinkingHabits.how.title")}
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary">
                  {i}
                </span>
                <h3 className="mt-4 font-bold text-foreground">
                  {t(`seoPages.thinkingHabits.how.steps.${i}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`seoPages.thinkingHabits.how.steps.${i}.text`)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 grid md:grid-cols-2 gap-4">
          <Card className="p-6">
            <Lock aria-hidden="true" className="w-5 h-5 text-primary" />
            <h3 className="mt-3 font-bold text-foreground">
              {t("seoPages.thinkingHabits.trust.private.title")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("seoPages.thinkingHabits.trust.private.text")}
            </p>
          </Card>
          <Card className="p-6">
            <ShieldCheck aria-hidden="true" className="w-5 h-5 text-primary" />
            <h3 className="mt-3 font-bold text-foreground">
              {t("seoPages.thinkingHabits.trust.care.title")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("seoPages.thinkingHabits.trust.care.text")}
            </p>
          </Card>
        </section>

        {/* FAQ */}
        <FaqAccordion title={t("seoPages.thinkingHabits.faq.title")} items={faq} />

        {/* CTA */}
        <CtaBanner
          title={t("seoPages.thinkingHabits.cta.title")}
          text={t("seoPages.thinkingHabits.cta.text")}
          button={t("seoPages.thinkingHabits.cta.button")}
          to="/tests"
        />
      </main>

      <SeoDisclaimer lines={[1, 2].map((i) => t(`seoPages.thinkingHabits.disclaimer.${i}`))} />
      <SeoFooter />
    </div>
  );
}
