import { useEffect } from 'react';

export const BASE_URL = 'https://mymoodly.ru';
export const SITE_NAME = 'Moodly';
export const OG_IMAGE = `${BASE_URL}/icons/og-image.png`;
export const DEFAULT_LOCALE = 'ru_RU';

export interface SeoMeta {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  /**
   * Open Graph. Если поля не заданы — наследуются из базовых
   * title/description/canonical (og:url), image — из OG_IMAGE.
   */
  og?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
  /** Twitter Card. Если поля не заданы — наследуются из Open Graph. */
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  /** Структурированные данные: объект-граф или массив графов JSON-LD. */
  jsonLd?: object | object[];
}

const JSONLD_SELECTOR = 'script[data-seo-jsonld]';

function metaEl(name: string): HTMLMetaElement | null {
  return document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
}

function createMeta(name: string): HTMLMetaElement {
  const el = document.createElement('meta');
  el.setAttribute('name', name);
  document.head.appendChild(el);
  return el;
}

function metaByAttr(attr: 'name' | 'property', key: string): HTMLMetaElement | null {
  return document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
}

/**
 * Устанавливает контент meta-тега (name/property). Возвращает функцию отката.
 */
function applyMetaTag(attr: 'name' | 'property', key: string, content: string): () => void {
  const existing = metaByAttr(attr, key);
  if (existing) {
    const prev = existing.getAttribute('content');
    existing.setAttribute('content', content);
    return () => {
      if (prev !== null) existing.setAttribute('content', prev);
    };
  }
  const el = document.createElement('meta');
  el.setAttribute(attr, key);
  el.setAttribute('content', content);
  document.head.appendChild(el);
  return () => el.remove();
}

/**
 * Управляет SEO-мета-тегами страницы: title, description, canonical, noindex,
 * Open Graph, Twitter Card и JSON-LD. Все изменения безопасно откатываются
 * при размонтировании компонента.
 */
export function useSeo({ title, description, canonical, noindex, og, twitter, jsonLd }: SeoMeta) {
  const ogTitle = og?.title ?? title;
  const ogDescription = og?.description ?? description;
  const ogUrl = og?.url ?? canonical;
  const ogImage = og?.image ?? OG_IMAGE;
  const ogType = og?.type ?? 'website';
  const twCard = twitter?.card ?? 'summary_large_image';
  const twTitle = twitter?.title ?? ogTitle;
  const twDesc = twitter?.description ?? ogDescription;
  const twImage = twitter?.image ?? ogImage;
  const needsSocial = ogTitle !== undefined;
  const jsonLdKey = jsonLd === undefined ? '' : JSON.stringify(jsonLd);

  useEffect(() => {
    const prevTitle = document.title;
    const prevCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevRobots = metaEl('robots');
    const restore: Array<() => void> = [];

    if (title !== undefined) {
      document.title = title;
      restore.push(() => {
        document.title = prevTitle;
      });
    }

    if (description !== undefined) {
      const prevDescription = metaEl('description')?.getAttribute('content') ?? null;
      const descriptionMeta = metaEl('description') ?? createMeta('description');
      descriptionMeta.setAttribute('content', description);
      restore.push(() => {
        if (prevDescription === null) descriptionMeta.remove();
        else descriptionMeta.setAttribute('content', prevDescription);
      });
    }

    if (canonical !== undefined) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonical);
      restore.push(() => {
        if (prevCanonical) link.replaceWith(prevCanonical);
        else link.remove();
      });
      if (prevCanonical) prevCanonical.replaceWith(link);
      else document.head.appendChild(link);
    }

    let robotsMeta: HTMLMetaElement | null = null;
    if (noindex) {
      robotsMeta = metaEl('robots') ?? createMeta('robots');
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    }

    if (needsSocial) {
      restore.push(applyMetaTag('property', 'og:title', ogTitle!));
      if (ogDescription !== undefined)
        restore.push(applyMetaTag('property', 'og:description', ogDescription));
      restore.push(applyMetaTag('property', 'og:type', ogType));
      restore.push(applyMetaTag('property', 'og:image', ogImage));
      restore.push(applyMetaTag('property', 'og:site_name', SITE_NAME));
      restore.push(applyMetaTag('property', 'og:locale', DEFAULT_LOCALE));
      if (ogUrl !== undefined) restore.push(applyMetaTag('property', 'og:url', ogUrl));

      restore.push(applyMetaTag('name', 'twitter:card', twCard));
      restore.push(applyMetaTag('name', 'twitter:site', '@moodly_app'));
      if (twTitle !== undefined) restore.push(applyMetaTag('name', 'twitter:title', twTitle));
      if (twDesc !== undefined) restore.push(applyMetaTag('name', 'twitter:description', twDesc));
      if (twImage !== undefined) restore.push(applyMetaTag('name', 'twitter:image', twImage));
    }

    if (jsonLdKey) {
      document.head.querySelector<HTMLScriptElement>(JSONLD_SELECTOR)?.remove();
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoJsonld = 'true';
      script.textContent = jsonLdKey;
      document.head.appendChild(script);
      restore.push(() => {
        document.head.querySelector<HTMLScriptElement>(JSONLD_SELECTOR)?.remove();
      });
    }

    return () => {
      restore.forEach((fn) => fn());

      if (noindex) {
        if (prevRobots) prevRobots.setAttribute('content', 'index, follow');
        else robotsMeta?.remove();
      }
    };
  }, [
    title,
    description,
    canonical,
    noindex,
    ogTitle,
    ogDescription,
    ogUrl,
    ogImage,
    ogType,
    twCard,
    twTitle,
    twDesc,
    twImage,
    needsSocial,
    jsonLdKey,
  ]);
}

/** URL-хелпер для canonical: (путь) => абсолютный URL на базовом домене. */
export function withCanonical(path = '/'): string {
  return `${BASE_URL}${path === '/' ? '/' : path}`;
}

/** JSON-LD: Организация (синий брендовый блок) */
export function organizationLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/icons/icon-512.svg`,
    description: 'Moodly — дневник настроения и практик ментального здоровья',
  };
}

/** JSON-LD: WebSite */
export function websiteLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    inLanguage: 'ru',
  };
}

/** JSON-LD: BreadcrumbList */
export function breadcrumbLd(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** JSON-LD: BlogPosting */
export function blogPostingLd(post: {
  title: string;
  url: string;
  description: string;
  date: string;
  image?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    mainEntityOfPage: post.url,
    url: post.url,
    datePublished: post.date,
    image: post.image ?? OG_IMAGE,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/icons/icon-192.svg` },
    },
    inLanguage: 'ru',
  };
}

/** JSON-LD: FAQPage */
export function faqPageLd(faq: Array<{ q: string; a: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
