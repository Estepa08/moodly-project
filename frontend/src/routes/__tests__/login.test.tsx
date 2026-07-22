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
      demo: vi.fn(),
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
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
  });

  it("submits form and navigates on success", async () => {
    (api.auth.login as Mock).mockResolvedValueOnce({ accessToken: "token123", user: { id: "1" } });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getAllByLabelText("Email")[0];
    const passwordInput = screen.getAllByLabelText("Password")[0];
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "secret");
    await user.click(screen.getAllByRole("button", { name: /sign in/i })[0]);

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith({ email: "test@example.com", password: "secret" });
    });
  });

  it("shows error message on failure", async () => {
    (api.auth.login as Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getAllByLabelText("Email")[0];
    const passwordInput = screen.getAllByLabelText("Password")[0];
    await user.type(emailInput, "bad@example.com");
    await user.type(passwordInput, "wrong");
    await user.click(screen.getAllByRole("button", { name: /sign in/i })[0]);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("toggles to register form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const signUpButton = screen.getAllByRole("button", { name: /sign up/i })[0];
    await user.click(signUpButton);
    expect(screen.getByLabelText("Name (optional)")).toBeInTheDocument();
  });

  it("demo button logs in via demo endpoint", async () => {
    (api.auth.demo as Mock).mockResolvedValueOnce({ accessToken: "demo-token", user: { id: "demo" } });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByText("Quick Demo"));

    await waitFor(() => {
      expect(api.auth.demo).toHaveBeenCalled();
    });
  });
});
