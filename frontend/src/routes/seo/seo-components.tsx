import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import Reveal from '../../components/Reveal';
import { cn } from '../../lib/utils';
import { withCanonical } from '../../lib/seo';

function SeoHeader() {
  const { t } = useTranslation();
  const nav = [
    { href: '/mood-diary', label: t('seo.nav.moodDiary') },
    { href: '/anxiety-test', label: t('seo.nav.anxietyTest') },
    { href: '/blog', label: t('seo.nav.blog') },
    { href: '/privacy', label: t('seo.nav.privacy') },
    { href: '/terms', label: t('seo.nav.terms') },
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
            <Link
              key={item.href}
              to={item.href}
              className="text-muted-foreground hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button size="sm" asChild>
          <Link to="/register">{t('seo.nav.start')}</Link>
        </Button>
      </div>
    </header>
  );
}

interface Breadcrumb {
  label: string;
  to?: string;
}

function SeoBreadcrumbs({ items }: { items: Breadcrumb[] }) {
  // Добавляем JSON-LD для хлебных крошек
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.to ? withCanonical(item.to) : undefined,
    })),
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 sm:px-6 pt-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {item.to ? (
                <Link to={item.to} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-primary font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

function SeoSectionHeading({
  kicker,
  title,
  text,
  center = true,
}: {
  kicker: string;
  title: string;
  text?: string[];
  center?: boolean;
}) {
  return (
    <Reveal className={cn(center && 'text-center')}>
      <p className="text-xs font-bold text-primary uppercase tracking-wider">{kicker}</p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground text-balance">
        {title}
      </h2>
      {text?.map((line, i) => (
        <p key={i} className="mt-2 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {line}
        </p>
      ))}
    </Reveal>
  );
}

interface Step {
  title: string;
  text: string;
}

function StepsGrid({
  steps,
  title,
  description,
}: {
  steps: Step[];
  title?: string;
  description?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      {(title || description) && (
        <SeoSectionHeading kicker={title ?? ''} title={description ?? ''} />
      )}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <Reveal key={i} delay={i * 100} className="h-full">
            <Card className="p-6 relative h-full">
              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.text}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

interface FaqItem {
  q: string;
  a: string;
}

function FaqAccordion({ title, items }: { title: string; items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <Reveal>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-foreground">{title}</h2>
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

function CtaBanner({
  title,
  text,
  button,
  to = '/register',
}: {
  title: string;
  text?: string;
  button: string;
  to?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 promo-scope">
      <Reveal>
        <div className="rounded-3xl bg-btn-gradient shadow-clay-lg p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-[34px] font-extrabold text-white text-balance">
            {title}
          </h2>
          {text && <p className="mt-3 text-sm sm:text-base text-white/85">{text}</p>}
          <Button
            size="lg"
            variant="secondary"
            className="mt-7 btn-neon bg-white text-primary hover:bg-white/95"
            asChild
          >
            <Link to={to}>
              {button}
              <ArrowRight aria-hidden="true" className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

function SeoDisclaimer({ lines }: { lines: string[] }) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 text-center">
      {lines.map((line, i) => (
        <p key={i} className="text-[12px] text-muted-foreground/70 leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}

function SeoFooter() {
  const { t } = useTranslation();
  const product = [
    { label: t('seo.nav.moodDiary'), to: '/mood-diary' },
    { label: t('seo.nav.anxietyTest'), to: '/anxiety-test' },
    { label: t('seo.nav.blog'), to: '/blog' },
  ];
  const company = [
    { label: t('seo.nav.privacy'), to: '/privacy' },
    { label: t('seo.nav.terms'), to: '/terms' },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart aria-hidden="true" className="w-4 h-4 text-primary" />
              </span>
              <p className="text-sm font-bold text-foreground" translate="no">
                Moodly
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs">{t('seo.footer.about')}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{t('seo.footer.product')}</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {product.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{t('seo.footer.company')}</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              {company.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 text-center text-[11px] text-muted-foreground">© 2026 Moodly</p>
      </div>
    </footer>
  );
}

export {
  SeoHeader,
  SeoBreadcrumbs,
  SeoSectionHeading,
  StepsGrid,
  FaqAccordion,
  CtaBanner,
  SeoDisclaimer,
  SeoFooter,
  type Breadcrumb,
  type Step,
  type FaqItem,
};
