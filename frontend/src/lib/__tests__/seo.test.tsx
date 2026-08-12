import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useSeo, OG_IMAGE, SITE_NAME } from '../seo';

function SeoHarness({
  title,
  description,
  canonical,
  noindex,
  og,
  twitter,
  jsonLd,
}: {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  og?: Record<string, string>;
  twitter?: Record<string, string>;
  jsonLd?: object | object[];
}) {
  useSeo({ title, description, canonical, noindex, og, twitter, jsonLd });
  return null;
}

function metaProperty(prop: string): string | null {
  return document.head.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ?? null;
}

function metaName(name: string): string | null {
  return document.head.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? null;
}

function clearHead() {
  document.head.querySelectorAll('meta[name="description"]').forEach((el) => el.remove());
  document.head.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
  document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
  document.head.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove());
  document.head.querySelectorAll('meta[name^="twitter:"]').forEach((el) => el.remove());
  document.head.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
  document.title = '';
}

describe('useSeo', () => {
  beforeEach(() => {
    clearHead();
  });
  afterEach(() => {
    clearHead();
  });

  it('sets title and description', () => {
    render(<SeoHarness title="Test title" description="Test description" />);
    expect(document.title).toBe('Test title');
    const description = document.head.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toBe('Test description');
  });

  it('adds canonical link', () => {
    render(<SeoHarness canonical="https://mymoodly.ru/mood-diary" />);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://mymoodly.ru/mood-diary');
  });

  it('sets robots noindex when requested', () => {
    render(<SeoHarness noindex />);
    const robots = document.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('restores previous meta on unmount', () => {
    document.title = 'Previous';
    const { unmount } = render(<SeoHarness title="New title" />);
    expect(document.title).toBe('New title');

    unmount();
    expect(document.title).toBe('Previous');
  });

  it('derives Open Graph and Twitter tags from base fields', () => {
    render(<SeoHarness title="Moodly" description="Описание" canonical="https://mymoodly.ru/" />);

    expect(metaProperty('og:title')).toBe('Moodly');
    expect(metaProperty('og:description')).toBe('Описание');
    expect(metaProperty('og:type')).toBe('website');
    expect(metaProperty('og:url')).toBe('https://mymoodly.ru/');
    expect(metaProperty('og:site_name')).toBe(SITE_NAME);
    expect(metaProperty('og:image')).toBe(OG_IMAGE);
    expect(metaName('twitter:card')).toBe('summary_large_image');
    expect(metaName('twitter:title')).toBe('Moodly');
  });

  it('respects explicit og/twitter overrides', () => {
    render(
      <SeoHarness
        title="Base"
        og={{ type: 'article', image: 'https://mymoodly.ru/img/article.jpg' }}
        twitter={{ card: 'summary' }}
      />,
    );

    expect(metaProperty('og:type')).toBe('article');
    expect(metaProperty('og:image')).toBe('https://mymoodly.ru/img/article.jpg');
    expect(metaName('twitter:card')).toBe('summary');
    expect(metaName('twitter:title')).toBe('Base');
  });

  it('injects JSON-LD script and removes it on unmount', () => {
    const graph = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Moodly' };
    const { unmount } = render(<SeoHarness title="Page" jsonLd={graph} />);

    const script = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]');
    expect(script).not.toBeNull();
    expect(script?.type).toBe('application/ld+json');
    expect(JSON.parse(script?.textContent ?? '{}')).toEqual(graph);

    unmount();
    expect(document.head.querySelector('script[data-seo-jsonld]')).toBeNull();
  });

  it('clears Open Graph tags on unmount', () => {
    const { unmount } = render(<SeoHarness title="Temporary" />);
    expect(metaProperty('og:title')).toBe('Temporary');

    unmount();
    expect(metaProperty('og:title')).toBeNull();
  });
});
