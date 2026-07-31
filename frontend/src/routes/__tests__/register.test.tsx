import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import RegisterPage from "../register";
import userEvent from "@testing-library/user-event";

vi.mock("../../lib/api", () => ({
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn().mockRejectedValue(new Error("no session")),
      sendVerificationEmail: vi.fn(),
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import { api } from "../../lib/api";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the registration form", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByText("Start your mood journal")).toBeInTheDocument();
    expect(screen.getByLabelText("Name (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("links to the login page", () => {
    renderWithProviders(<RegisterPage />);
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  it("disables submit until age consent is confirmed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const submitButton = screen.getByRole("button", { name: /sign up/i });
    expect(submitButton).toBeDisabled();

    const consentCheckbox = screen.getByRole("checkbox");
    await user.click(consentCheckbox);
    expect(submitButton).toBeEnabled();
  });

  it("registers and shows the check-email screen", async () => {
    (api.auth.register as Mock).mockResolvedValueOnce({
      devVerificationLink: "http://dev/verify?token=abc",
    });

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText("Name (optional)"), "Alex");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(api.auth.register).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret",
        name: "Alex",
        ageConfirmed: true,
      });
    });
    expect(screen.getByText("Check your email")).toBeInTheDocument();
  });

  it("shows error message on failure", async () => {
    (api.auth.register as Mock).mockRejectedValueOnce(
      new Error("This email is already registered. Try logging in instead."),
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText("Email"), "taken@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/This email is already registered/)).toBeInTheDocument();
    });
  });
});
