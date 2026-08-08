import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Reveal from "../../components/Reveal";
import { useSeo, withCanonical, breadcrumbLd } from "../../lib/seo";
import {
  SeoHeader,
  SeoBreadcrumbs,
  CtaBanner,
  SeoDisclaimer,
  SeoFooter,
} from "../seo/seo-components";
import { PostCard } from "./PostCard";
import { POSTS, CATEGORIES } from "./posts";

const CATEGORY_KEYS: Record<string, string> = {
  journal: "seoPages.blog.categories.journal",
  anxiety: "seoPages.blog.categories.anxiety",
  sleep: "seoPages.blog.categories.sleep",
};

export default function BlogPage() {
  const { t } = useTranslation();

  useSeo({
    title: t("seoPages.blog.meta.title"),
    description: t("seoPages.blog.meta.description"),
    canonical: withCanonical("/blog"),
    jsonLd: breadcrumbLd([
      { name: t("seoPages.blog.breadcrumb.home"), url: withCanonical("/") },
      { name: t("seoPages.blog.breadcrumb.current"), url: withCanonical("/blog") },
    ]),
  });

  const chips: Array<{ slug: string | null; label: string }> = [
    { slug: null, label: t("seoPages.blog.all") },
    ...Object.values(CATEGORIES).map((c) => ({
      slug: c.slug,
      label: t(CATEGORY_KEYS[c.slug]),
    })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t("seoPages.blog.breadcrumb.home"), to: "/" },
          { label: t("seoPages.blog.breadcrumb.current") },
        ]}
      />

      <main>
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-8 text-center">
          <Reveal>
            <p className="text-xs font-bold text-primary uppercase tracking-wider">
              {t("seoPages.blog.kicker")}
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-foreground text-balance">
              {t("seoPages.blog.meta.title")}
            </h1>
            <p className="mt-3 mx-auto max-w-2xl text-muted-foreground leading-relaxed">
              {t("seoPages.blog.meta.description")}
            </p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
          <div className="flex flex-wrap justify-center gap-2">
            {chips.map((chip) =>
              chip.slug === null ? (
                <Link
                  key="all"
                  to="/blog"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  {chip.label}
                </Link>
              ) : (
                <Link
                  key={chip.slug}
                  to={`/blog/category/${chip.slug}`}
                  className="rounded-full bg-card border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {chip.label}
                </Link>
              ),
            )}
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {POSTS.map((post, i) => (
              <PostCard key={post.slug} post={post} delay={i * 100} />
            ))}
          </div>
        </section>

        <CtaBanner
          title={t("seoPages.blog.cta.title")}
          text={t("seoPages.blog.cta.text")}
          button={t("seoPages.blog.cta.button")}
        />
      </main>

      <SeoDisclaimer lines={[1, 2].map((i) => t(`seoPages.blog.disclaimer.${i}`))} />
      <SeoFooter />
    </div>
  );
}
