import { useTranslation } from "react-i18next";
import { useParams, Navigate } from "react-router-dom";
import Reveal from "../../components/Reveal";
import { useSeo, withCanonical } from "../../lib/seo";
import {
  SeoHeader,
  SeoBreadcrumbs,
  CtaBanner,
  SeoDisclaimer,
  SeoFooter,
} from "../seo/seo-components";
import { PostCard } from "./PostCard";
import { getPostBySlug, getRelatedPosts, getCategoryName, formatDate } from "./posts";

const CATEGORY_KEYS: Record<string, string> = {
  journal: "seoPages.blog.categories.journal",
  anxiety: "seoPages.blog.categories.anxiety",
  sleep: "seoPages.blog.categories.sleep",
};

export default function BlogPostPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : undefined;

  useSeo({
    title: post ? `${post.title} — ${t("seoPages.blog.shortTitle")}` : t("seoPages.blog.notFound"),
    description: post?.excerpt,
    canonical: post ? withCanonical(`/blog/${post.slug}`) : withCanonical("/blog"),
  });

  if (!post) return <Navigate to="/blog" replace />;

  const related = getRelatedPosts(post);

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t("seoPages.blog.breadcrumb.home"), to: "/" },
          { label: t("seoPages.blog.breadcrumb.blog"), to: "/blog" },
          {
            label: t(CATEGORY_KEYS[post.category]),
            to: `/blog/category/${post.category}`,
          },
          { label: post.title },
        ]}
      />

      <main>
        <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 pb-12">
          <Reveal>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {getCategoryName(post.category)}
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-foreground text-balance">
              {post.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{formatDate(post.date)}</p>
          </Reveal>

          <div className="mt-8 space-y-6">
            {post.content.map((block, i) => (
              <div key={i}>
                {block.h && <h2 className="text-xl font-bold text-foreground mt-2">{block.h}</h2>}
                <p className="mt-2 leading-relaxed text-foreground/90">{block.p}</p>
              </div>
            ))}
          </div>
        </article>

        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
            <h2 className="text-center text-2xl font-extrabold text-foreground">
              {t("seoPages.blog.related")}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {related.map((p, i) => (
                <PostCard key={p.slug} post={p} delay={i * 100} />
              ))}
            </div>
          </section>
        )}

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
