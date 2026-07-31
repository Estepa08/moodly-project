import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import LoginPage from "../login";
import userEvent from "@testing-library/user-event";

vi.mock("../../lib/api", () => ({
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn().mockRejectedValue(new Error("no session")),
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import { api } from "../../lib/api";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText("Moodly")).toBeInTheDocument();
    expect(
      screen.getByText("A simple mood journal — notice how you're doing, day by day."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("does not render the registration fields", () => {
    renderWithProviders(<LoginPage />);
    expect(screen.queryByLabelText("Name (optional)")).not.toBeInTheDocument();
  });

  it("links to the register page instead of toggling", () => {
    renderWithProviders(<LoginPage />);
    const signUpLink = screen.getByRole("link", { name: /sign up/i });
    expect(signUpLink).toHaveAttribute("href", "/register");
  });

  it("submits form and navigates on success", async () => {
    (api.auth.login as Mock).mockResolvedValueOnce({ accessToken: "token123", user: { id: "1" } });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret",
      });
    });
  });

  it("shows error message on failure", async () => {
    (api.auth.login as Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await user.type(emailInput, "bad@example.com");
    await user.type(passwordInput, "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });
});
