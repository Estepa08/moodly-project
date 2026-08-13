import { useTranslation } from 'react-i18next';
import { Link, useParams, Navigate } from 'react-router-dom';
import Reveal from '../../components/Reveal';
import { useSeo, withCanonical, breadcrumbLd } from '../../lib/seo';
import { SeoHeader, SeoBreadcrumbs, SeoFooter } from '../seo/seo-components';
import { PostCard } from './PostCard';
import { CATEGORIES, getPostsByCategory } from './posts';

const CATEGORY_KEYS: Record<string, string> = {
  journal: 'seoPages.blog.categories.journal',
  anxiety: 'seoPages.blog.categories.anxiety',
  sleep: 'seoPages.blog.categories.sleep',
  thinking: 'seoPages.blog.categories.thinking',
  motivation: 'seoPages.blog.categories.motivation',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  journal:
    'Статьи о ведении дневника настроения: как начать, не бросить и использовать для улучшения эмоционального состояния.',
  anxiety:
    'Статьи о тревоге: техники заземления, работа с тревожными мыслями и практические упражнения для снижения тревожности.',
  sleep: 'Статьи о сне: гигиена сна, как наладить режим и улучшить качество отдыха.',
  thinking:
    'Статьи о привычках мышления: когнитивные искажения, анализ мыслей и понимание собственных паттернов.',
  motivation:
    'Статьи о мотивации и привычках: геймификация, серии и способы не бросать заботу о себе.',
};

export default function BlogCategoryPage() {
  const { t } = useTranslation();
  const { category: categoryRaw } = useParams();

  const isValid = !!categoryRaw && categoryRaw in CATEGORIES;
  const category = isValid ? (categoryRaw as keyof typeof CATEGORIES) : null;

  const categoryName = category ? t(CATEGORY_KEYS[category]) : '';
  const categoryDescription = category ? CATEGORY_DESCRIPTIONS[category] : '';

  useSeo({
    title: `${categoryName} — статьи и советы | Moodly`,
    description: categoryDescription,
    canonical: category ? withCanonical(`/blog/category/${category}`) : withCanonical('/blog'),
    og: category
      ? {
          title: `${categoryName} — блог Moodly`,
          description: categoryDescription,
          url: withCanonical(`/blog/category/${category}`),
          type: 'website',
        }
      : undefined,
    jsonLd: category
      ? breadcrumbLd([
          { name: t('seoPages.blog.breadcrumb.home'), url: withCanonical('/') },
          { name: t('seoPages.blog.breadcrumb.blog'), url: withCanonical('/blog') },
          { name: categoryName, url: withCanonical(`/blog/category/${category}`) },
        ])
      : undefined,
  });

  if (!category) return <Navigate to="/blog" replace />;
  const posts = getPostsByCategory(category);

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t('seoPages.blog.breadcrumb.home'), to: '/' },
          { label: t('seoPages.blog.breadcrumb.blog'), to: '/blog' },
          { label: categoryName },
        ]}
      />

      <main>
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-12">
          <Reveal>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary">
              ← {t('seoPages.blog.backToBlog')}
            </Link>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-foreground text-balance">
              {categoryName}
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">{categoryDescription}</p>
          </Reveal>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {posts.map((post, i) => (
              <PostCard key={post.slug} post={post} delay={i * 100} />
            ))}
          </div>
        </section>
      </main>

      <SeoFooter />
    </div>
  );
}
