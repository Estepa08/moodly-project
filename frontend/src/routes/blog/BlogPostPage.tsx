import { useTranslation } from 'react-i18next';
import { useParams, Navigate, Link } from 'react-router-dom';
import Reveal from '../../components/Reveal';
import { useSeo, withCanonical, breadcrumbLd, blogPostingLd, OG_IMAGE } from '../../lib/seo';
import {
  SeoHeader,
  SeoBreadcrumbs,
  CtaBanner,
  SeoDisclaimer,
  SeoFooter,
} from '../seo/seo-components';
import { PostCard } from './PostCard';
import {
  getPostBySlug,
  getRelatedPosts,
  getCategoryName,
  formatDate,
  type CategorySlug,
} from './posts';

const CATEGORY_KEYS: Record<string, string> = {
  journal: 'seoPages.blog.categories.journal',
  anxiety: 'seoPages.blog.categories.anxiety',
  sleep: 'seoPages.blog.categories.sleep',
  thinking: 'seoPages.blog.categories.thinking',
  motivation: 'seoPages.blog.categories.motivation',
};

// Мотивация не имеет своего продуктового лендинга — для неё пилларной ссылки нет.
const CATEGORY_PILLAR: Partial<Record<CategorySlug, { path: string; labelKey: string }>> = {
  journal: { path: '/mood-diary', labelKey: 'seo.nav.moodDiary' },
  anxiety: { path: '/anxiety-test', labelKey: 'seo.nav.anxietyTest' },
  sleep: { path: '/sleep-hygiene-guide', labelKey: 'seo.nav.sleepHygiene' },
  thinking: { path: '/thinking-habits-test', labelKey: 'seo.nav.thinkingHabits' },
};

export default function BlogPostPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : undefined;

  const seoTitle = post?.seoTitle || `${post?.title || ''} — ${t('seoPages.blog.shortTitle')}`;
  const seoDescription = post?.seoDescription || post?.excerpt || '';

  useSeo({
    title: seoTitle,
    description: seoDescription,
    canonical: post ? withCanonical(`/blog/${post.slug}`) : withCanonical('/blog'),
    og: post
      ? {
          type: 'article',
          title: seoTitle,
          description: seoDescription,
          image: OG_IMAGE,
          url: withCanonical(`/blog/${post.slug}`),
        }
      : undefined,
    twitter: post
      ? {
          card: 'summary_large_image',
          title: seoTitle,
          description: seoDescription,
          image: OG_IMAGE,
        }
      : undefined,
    jsonLd: post
      ? [
          breadcrumbLd([
            { name: t('seoPages.blog.breadcrumb.home'), url: withCanonical('/') },
            { name: t('seoPages.blog.breadcrumb.blog'), url: withCanonical('/blog') },
            {
              name: t(CATEGORY_KEYS[post.category]),
              url: withCanonical(`/blog/category/${post.category}`),
            },
            { name: post.title, url: withCanonical(`/blog/${post.slug}`) },
          ]),
          blogPostingLd({
            title: post.title,
            url: withCanonical(`/blog/${post.slug}`),
            description: seoDescription,
            date: post.date,
            updatedAt: post.updatedAt,
            image: OG_IMAGE,
          }),
        ]
      : undefined,
  });

  if (!post) return <Navigate to="/blog" replace />;

  const related = getRelatedPosts(post);
  const readingTime = post.readingTime;
  const pillar = CATEGORY_PILLAR[post.category];

  return (
    <div className="min-h-screen bg-background">
      <SeoHeader />
      <SeoBreadcrumbs
        items={[
          { label: t('seoPages.blog.breadcrumb.home'), to: '/' },
          { label: t('seoPages.blog.breadcrumb.blog'), to: '/blog' },
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

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{t('seoPages.blog.author')}</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.updatedAt && post.updatedAt !== post.date && (
                <>
                  <span>·</span>
                  <span>
                    {t('seoPages.blog.updated')}: {formatDate(post.updatedAt)}
                  </span>
                </>
              )}
              <span>·</span>
              <span>{readingTime} мин чтения</span>
            </div>

            <p className="mt-4 text-lg text-foreground/80 leading-relaxed border-l-4 border-primary/30 pl-4">
              {post.seoDescription || post.excerpt}
            </p>
          </Reveal>

          <div className="mt-8 space-y-6">
            {post.content.map((block, i) => (
              <div key={i}>
                {block.h && (
                  <h2 className="text-xl font-bold text-foreground mt-6 first:mt-0">{block.h}</h2>
                )}
                <p className="mt-2 leading-relaxed text-foreground/90">{block.p}</p>
              </div>
            ))}
          </div>

          {related.length > 0 && (
            <section className="mt-12 border-t border-border pt-8">
              <h3 className="text-lg font-bold text-foreground">
                {t('seoPages.blog.readAlso') || 'Читайте также:'}
              </h3>
              <ul className="mt-4 space-y-2">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/blog/${p.slug}`} className="text-primary hover:underline text-sm">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        {related.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
            <h2 className="text-center text-2xl font-extrabold text-foreground">
              {t('seoPages.blog.related')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {related.map((p, i) => (
                <PostCard key={p.slug} post={p} delay={i * 100} />
              ))}
            </div>
          </section>
        )}

        {pillar && (
          <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('seoPages.blog.tryTool')}{' '}
              <Link to={pillar.path} className="font-semibold text-primary hover:underline">
                {t(pillar.labelKey)}
              </Link>
            </p>
          </section>
        )}

        <CtaBanner
          title={t('seoPages.blog.cta.title')}
          text={t('seoPages.blog.cta.text')}
          button={t('seoPages.blog.cta.button')}
        />
      </main>

      <SeoDisclaimer lines={[1, 2].map((i) => t(`seoPages.blog.disclaimer.${i}`))} />
      <SeoFooter />
    </div>
  );
}
