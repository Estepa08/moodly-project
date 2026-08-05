import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { renderWithProviders, screen } from "../../test/test-utils";
import NotFoundPage from "../not-found";

function clearHead() {
  document.head.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
  document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
}

describe("NotFoundPage", () => {
  beforeEach(clearHead);
  afterEach(clearHead);

  it("renders 404 title and actions", () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("sets robots noindex", () => {
    renderWithProviders(<NotFoundPage />);
    const robots = document.head.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute("content")).toBe("noindex, nofollow");
  });
});
