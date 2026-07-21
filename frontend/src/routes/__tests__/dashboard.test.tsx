import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import Dashboard from "../dashboard";
import userEvent from "@testing-library/user-event";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    parameters: { list: vi.fn() },
    entries: { list: vi.fn(), create: vi.fn() },
    auth: { logout: vi.fn(), demo: vi.fn() },
    tests: { list: vi.fn(), get: vi.fn(), submitResult: vi.fn() },
    testResults: { list: vi.fn(), get: vi.fn() },
    feedback: { create: vi.fn(), listMine: vi.fn() },
    onboarding: { list: vi.fn() },
    reports: { create: vi.fn(), list: vi.fn(), get: vi.fn(), delete: vi.fn() },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => "mock-token"),
}));

describe("Dashboard", () => {
  const navigate = vi.fn();
  const onLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard with nav links", async () => {
    (api.parameters.list as Mock).mockResolvedValueOnce([{ id: "1", name: "Anxiety", unit: "/10" }]);
    (api.entries.list as Mock).mockResolvedValueOnce([]);
    renderWithProviders(<Dashboard navigate={navigate} onLogout={onLogout} />);
    expect(screen.getByText("Moodly")).toBeInTheDocument();
    expect(screen.getByText("Quick Entry")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("shows navigation buttons", () => {
    renderWithProviders(<Dashboard navigate={navigate} onLogout={onLogout} />);
    expect(screen.getByText("Tests")).toBeInTheDocument();
    expect(screen.getByText("Results")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Feedback")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls onLogout when logout clicked", async () => {
    renderWithProviders(<Dashboard navigate={navigate} onLogout={onLogout} />);
    await userEvent.click(screen.getByText("Logout"));
    expect(onLogout).toHaveBeenCalled();
  });

  it("navigates when nav items clicked", async () => {
    renderWithProviders(<Dashboard navigate={navigate} onLogout={onLogout} />);
    await userEvent.click(screen.getByText("Tests"));
    expect(navigate).toHaveBeenCalledWith("tests");
  });
});
