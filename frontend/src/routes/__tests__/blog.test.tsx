import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import BlogPage from "../blog/BlogPage";
import BlogCategoryPage from "../blog/BlogCategoryPage";
import BlogPostPage from "../blog/BlogPostPage";

function clearHead() {
  document.head.querySelectorAll('meta[name="description"]').forEach((el) => el.remove());
  document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
  document.title = "";
}

function canonicalHref(): string | null | undefined {
  return document.head.querySelector('link[rel="canonical"]')?.getAttribute("href");
}

function renderAt(path: string, ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/category/:category" element={<BlogCategoryPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BlogPage", () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it("renders blog title and post cards", () => {
    renderAt("/blog", <BlogPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/blog/i);
    expect(screen.getAllByRole("link", { name: /читать/i }).length).toBeGreaterThan(1);
  });

  it("links categories to their routes", () => {
    renderAt("/blog", <BlogPage />);
    const chips = screen.getAllByRole("link", { name: /mood diary/i });
    expect(chips.some((el) => el.getAttribute("href") === "/blog/category/journal")).toBe(true);
  });

  it("sets canonical", () => {
    renderAt("/blog", <BlogPage />);
    expect(canonicalHref()).toBe("https://mymoodly.ru/blog");
  });
});

describe("BlogCategoryPage", () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it("renders posts of a category and sets canonical", () => {
    renderAt("/blog/category/journal", <BlogCategoryPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mood diary");
    expect(canonicalHref()).toBe("https://mymoodly.ru/blog/category/journal");
  });
});

describe("BlogPostPage", () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it("renders a post and related links", () => {
    renderAt("/blog/how-to-keep-a-mood-diary", <BlogPostPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/дневник/i);
    expect(screen.getAllByRole("link", { name: /читать/i }).length).toBeGreaterThan(0);
  });
});
