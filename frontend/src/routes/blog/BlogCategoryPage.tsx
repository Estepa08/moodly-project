import { useTranslation } from "react-i18next";
import { Link, useParams, Navigate } from "react-router-dom";
import { useSeo, withCanonical } from "../../lib/seo";
import { SeoHeader, SeoBreadcrumbs, SeoFooter } from "../seo/seo-components";
import { PostCard } from "./PostCard";
import { CATEGORIES, getPostsByCategory } from "./posts";

const CATEGORY_KEYS: Record<string, string> = {
  journal: "seoPages.blog.categories.journal",
  anxiety: "seoPages.blog.categories.anxiety",
  sleep: "seoPages.blog.categories.sleep",
};

export default function BlogCategoryPage() {
  const { t } = useTranslation();
  const { category: categoryRaw } = useParams();

  const isValid = !!categoryRaw && categoryRaw in CATEGORIES;
  const category = isValid ? (categoryRaw as keyof typeof CATEGORIES) : null;

  useSeo({
    title: category
      ? `${t(CATEGORY_KEYS[category])} — ${t("seoPages.blog.shortTitle")}`
      : t("seoPages.blog.shortTitle"),
    canonical: category ? withCanonical(`/blog/category/${category}`) : withCanonical("/blog"),
  });

  if (!category) return <Navigate to="/blog" replace />;
  const posts = getPostsByCategory(category);

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t("seoPages.blog.breadcrumb.home"), to: "/" },
          { label: t("seoPages.blog.breadcrumb.blog"), to: "/blog" },
          { label: t(CATEGORY_KEYS[category]) },
        ]}
      />

      <main>
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-12">
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary">
            ← {t("seoPages.blog.backToBlog")}
          </Link>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-foreground text-balance">
            {t(CATEGORY_KEYS[category])}
          </h1>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      </main>

      <SeoFooter />
    </div>
  );
}
