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
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import { api } from "../../lib/api";

describe("LoginPage", () => {
  const onLogin = vi.fn();
  const navigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    renderWithProviders(<LoginPage onLogin={onLogin} navigate={navigate} />);
    expect(screen.getByText("Moodly")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("submits form and calls onLogin on success", async () => {
    (api.auth.login as Mock).mockResolvedValueOnce({ accessToken: "token123", user: { id: "1" } });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage onLogin={onLogin} navigate={navigate} />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith({ email: "test@example.com", password: "secret" });
      expect(onLogin).toHaveBeenCalledWith("token123");
    });
  });

  it("shows error message on failure", async () => {
    (api.auth.login as Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    const user = userEvent.setup();
    renderWithProviders(<LoginPage onLogin={onLogin} navigate={navigate} />);

    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("navigates to register page", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage onLogin={onLogin} navigate={navigate} />);

    await user.click(screen.getByText(/sign up/i));
    expect(navigate).toHaveBeenCalledWith("register");
  });
});
