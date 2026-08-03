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
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import { api, setToken } from "../../lib/api";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the registration form", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText("Create Account")).toBeInTheDocument();
    expect(screen.getByText("Start your mood journal")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name (optional)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Birth year")).toBeInTheDocument();
  });

  it("links to the login page", () => {
    renderWithProviders(<RegisterPage />);
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  it("disables submit until both consents are confirmed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    const submitButton = screen.getByRole("button", { name: /sign up/i });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(submitButton).toBeDisabled();

    await user.click(checkboxes[0]);
    expect(submitButton).toBeDisabled();

    await user.click(checkboxes[1]);
    expect(submitButton).toBeEnabled();
  });

  it("registers and logs the user in", async () => {
    (api.auth.register as Mock).mockResolvedValueOnce({
      accessToken: "access-token",
      user: { id: "u1", email: "test@example.com" },
    });

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Birth year"), "1998");
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(api.auth.register).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret",
        ageConfirmed: true,
        pdpConsent: true,
        birthYear: 1998,
      });
    });
    expect(setToken).toHaveBeenCalledWith("access-token");
  });

  it("blocks submit when birth year makes user under 18", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText("Email"), "minor@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Birth year"), "2010");
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Registration is available to users 18 and older"),
      ).toBeInTheDocument();
    });
    expect(api.auth.register).not.toHaveBeenCalled();
  });

  it("shows error message on failure", async () => {
    (api.auth.register as Mock).mockRejectedValueOnce(
      new Error("This email is already registered. Try logging in instead."),
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText("Email"), "taken@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Birth year"), "1998");
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/This email is already registered/)).toBeInTheDocument();
    });
  });
});
