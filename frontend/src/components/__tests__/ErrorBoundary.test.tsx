import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useState } from "react";
import ErrorBoundary from "../ErrorBoundary";

function Bomb() {
  const [armed, setArmed] = useState(true);
  if (armed) {
    throw new Error("boom");
  }
  return <button onClick={() => setArmed(false)}>recovered</button>;
}

describe("ErrorBoundary", () => {
  it("показывает fallback при ошибке рендера", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("рендерит детей без ошибки", () => {
    render(
      <ErrorBoundary>
        <div>content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
