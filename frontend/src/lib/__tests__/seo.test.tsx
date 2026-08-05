import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { useSeo } from "../seo";

function SeoHarness({
  title,
  description,
  canonical,
  noindex,
}: {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
}) {
  useSeo({ title, description, canonical, noindex });
  return null;
}

function clearHead() {
  document.head.querySelectorAll('meta[name="description"]').forEach((el) => el.remove());
  document.head.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
  document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
  document.title = "";
}

describe("useSeo", () => {
  beforeEach(() => {
    clearHead();
  });
  afterEach(() => {
    clearHead();
  });

  it("sets title and description", () => {
    render(<SeoHarness title="Test title" description="Test description" />);
    expect(document.title).toBe("Test title");
    const description = document.head.querySelector('meta[name="description"]');
    expect(description?.getAttribute("content")).toBe("Test description");
  });

  it("adds canonical link", () => {
    render(<SeoHarness canonical="https://mymoodly.ru/mood-diary" />);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute("href")).toBe("https://mymoodly.ru/mood-diary");
  });

  it("sets robots noindex when requested", () => {
    render(<SeoHarness noindex />);
    const robots = document.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute("content")).toBe("noindex, nofollow");
  });

  it("restores previous meta on unmount", () => {
    document.title = "Previous";
    const { unmount } = render(<SeoHarness title="New title" />);
    expect(document.title).toBe("New title");

    unmount();
    expect(document.title).toBe("Previous");
  });
});
