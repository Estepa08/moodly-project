import { useEffect } from "react";

export const BASE_URL = "https://mymoodly.ru";

export interface SeoMeta {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}

function metaEl(name: string): HTMLMetaElement | null {
  return document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
}

function createMeta(name: string): HTMLMetaElement {
  const el = document.createElement("meta");
  el.setAttribute("name", name);
  document.head.appendChild(el);
  return el;
}

/**
 * Управляет SEO-мета-тегами страницы: title, description, canonical, noindex.
 * Все изменения безопасно откатываются при размонтировании компонента.
 */
export function useSeo({ title, description, canonical, noindex }: SeoMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDescription = metaEl("description")?.getAttribute("content") ?? null;
    const prevCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevRobots = metaEl("robots");

    if (title !== undefined) document.title = title;

    let descriptionMeta: HTMLMetaElement | null = null;
    if (description !== undefined) {
      descriptionMeta = metaEl("description") ?? createMeta("description");
      descriptionMeta.setAttribute("content", description);
    }

    const created: Array<{ tag: string; el: Element }> = [];
    if (canonical !== undefined) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", canonical);
      if (prevCanonical) {
        prevCanonical.replaceWith(link);
      } else {
        document.head.appendChild(link);
      }
      created.push({ tag: "canonical", el: link });
    }

    let robotsMeta: HTMLMetaElement | null = null;
    if (noindex) {
      robotsMeta = metaEl("robots") ?? createMeta("robots");
      robotsMeta.setAttribute("content", "noindex, nofollow");
    }

    return () => {
      if (canonical !== undefined && prevCanonical) {
        created.find((c) => c.tag === "canonical")?.el.replaceWith(prevCanonical);
      }
      created.filter((c) => c.tag === "canonical" && !prevCanonical).forEach((c) => c.el.remove());

      if (noindex) {
        if (prevRobots) prevRobots.setAttribute("content", "index, follow");
        else robotsMeta?.remove();
      }

      if (description !== undefined) {
        const current = metaEl("description");
        if (prevDescription === null) current?.remove();
        else current?.setAttribute("content", prevDescription);
      }

      if (title !== undefined) document.title = prevTitle;
    };
  }, [title, description, canonical, noindex]);
}

/** URL-хелпер для canonical: (путь) => абсолютный URL на базовом домене. */
export function withCanonical(path = "/"): string {
  return `${BASE_URL}${path === "/" ? "/" : path}`;
}
