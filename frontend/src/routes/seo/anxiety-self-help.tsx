import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRight, Wind, BookOpen, Heart, Moon, HeartHandshake } from "lucide-react";
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

const PRACTICE_ICONS = [Wind, BookOpen, Heart, Moon];

export default function AnxietySelfHelpPage() {
  const { t } = useTranslation();
  useSeo({
    title: t("seoPages.anxietySelfHelp.meta.title"),
    description: t("seoPages.anxietySelfHelp.meta.description"),
    canonical: withCanonical("/anxiety-self-help"),
  });

  const faq = [1, 2, 3].map((i) => ({
    q: t(`seoPages.anxietySelfHelp.faq.${i}.q`),
    a: t(`seoPages.anxietySelfHelp.faq.${i}.a`),
  }));

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t("seoPages.anxietySelfHelp.breadcrumb.home"), to: "/" },
          { label: t("seoPages.anxietySelfHelp.breadcrumb.current") },
        ]}
      />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-extrabold text-foreground leading-[1.1] text-balance">
              {t("seoPages.anxietySelfHelp.hero.title")}{" "}
              <span className="text-primary">{t("seoPages.anxietySelfHelp.hero.accent")}</span>
            </h1>
            <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl">
              {t("seoPages.anxietySelfHelp.hero.sub1")}
            </p>
            <p className="mt-2 text-muted-foreground text-base leading-relaxed max-w-xl">
              {t("seoPages.anxietySelfHelp.hero.sub2")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild>
                <Link to="/register">
                  {t("seoPages.anxietySelfHelp.hero.ctaPrimary")}
                  <ArrowRight aria-hidden="true" className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/anxiety-test">{t("seoPages.anxietySelfHelp.hero.ctaSecondary")}</Link>
              </Button>
            </div>
          </div>

          <Card className="p-6 bg-card-gradient shadow-clay-lg">
            <div className="flex items-center gap-2">
              <HeartHandshake aria-hidden="true" className="w-5 h-5 text-primary" />
              <p className="font-bold text-foreground">
                {t("seoPages.anxietySelfHelp.mock.title")}
              </p>
            </div>
            <p className="mt-4 text-sm text-foreground">
              {t("seoPages.anxietySelfHelp.mock.text")}
            </p>
            <div className="mt-4 rounded-xl bg-secondary/70 p-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                {t("seoPages.anxietySelfHelp.mock.stepTitle")}
              </p>
              {[1, 2, 3].map((i) => (
                <p key={i} className="mt-1 text-sm text-foreground">
                  {t(`seoPages.anxietySelfHelp.mock.step.${i}`)}
                </p>
              ))}
            </div>
          </Card>
        </section>

        {/* Practices */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t("seoPages.anxietySelfHelp.practices.kicker")}
            title={t("seoPages.anxietySelfHelp.practices.title")}
          />
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => {
              const Icon = PRACTICE_ICONS[i];
              const n = i + 1;
              return (
                <Card key={n} className="p-6">
                  <Icon aria-hidden="true" className="w-5 h-5 text-primary" />
                  <h3 className="mt-3 font-bold text-foreground">
                    {t(`seoPages.anxietySelfHelp.practices.items.${n}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t(`seoPages.anxietySelfHelp.practices.items.${n}.text`)}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* When to seek help */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t("seoPages.anxietySelfHelp.help.kicker")}
            title={t("seoPages.anxietySelfHelp.help.title")}
            text={[
              t("seoPages.anxietySelfHelp.help.text1"),
              t("seoPages.anxietySelfHelp.help.text2"),
            ]}
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-primary/5 border border-primary/10 p-5">
                <h3 className="font-bold text-foreground text-sm">
                  {t(`seoPages.anxietySelfHelp.help.signs.${i}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`seoPages.anxietySelfHelp.help.signs.${i}.text`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How moodly helps */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          <SeoSectionHeading
            kicker={t("seoPages.anxietySelfHelp.how.kicker")}
            title={t("seoPages.anxietySelfHelp.how.title")}
          />
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 text-center">
                <span className="text-4xl font-extrabold text-primary">{i}</span>
                <h3 className="mt-3 font-bold text-foreground">
                  {t(`seoPages.anxietySelfHelp.how.steps.${i}.title`)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {t(`seoPages.anxietySelfHelp.how.steps.${i}.text`)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <FaqAccordion title={t("seoPages.anxietySelfHelp.faq.title")} items={faq} />

        {/* CTA */}
        <CtaBanner
          title={t("seoPages.anxietySelfHelp.cta.title")}
          text={t("seoPages.anxietySelfHelp.cta.text")}
          button={t("seoPages.anxietySelfHelp.cta.button")}
        />
      </main>

      <SeoDisclaimer lines={[1, 2].map((i) => t(`seoPages.anxietySelfHelp.disclaimer.${i}`))} />
      <SeoFooter />
    </div>
  );
}
