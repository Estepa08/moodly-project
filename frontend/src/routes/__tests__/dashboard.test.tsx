import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen } from "../../test/test-utils";
import Dashboard from "../dashboard";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    users: { me: vi.fn() },
    parameters: { list: vi.fn() },
    entries: { list: vi.fn(), create: vi.fn() },
    auth: { logout: vi.fn(), demo: vi.fn(), refresh: vi.fn().mockRejectedValue(new Error("no session")) },
    tests: { list: vi.fn(), get: vi.fn(), submitResult: vi.fn() },
    testResults: { list: vi.fn() },
    feedback: { create: vi.fn(), listMine: vi.fn() },
    onboarding: { list: vi.fn() },
    reports: { create: vi.fn(), list: vi.fn(), get: vi.fn(), delete: vi.fn() },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all dashboard sections", async () => {
    (api.parameters.list as Mock).mockResolvedValue([
      { id: "1", name: "Mood", unit: "/10" },
      { id: "2", name: "Anxiety", unit: "/10" },
    ]);
    (api.entries.list as Mock).mockResolvedValue([]);
    (api.testResults.list as Mock).mockResolvedValue([]);
    (api.tests.list as Mock).mockResolvedValue([]);
    renderWithProviders(<Dashboard />);

    // Period selector
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(screen.getByText("2 Weeks")).toBeInTheDocument();

    // Quick Entry card
    expect(screen.getByText("Quick Entry")).toBeInTheDocument();

    // Chart cards (title always renders even during loading)
    expect(screen.getByText("How You've Been Feeling")).toBeInTheDocument();

    // Wellbeing card
    expect(screen.getByText("Wellbeing")).toBeInTheDocument();

    // Weekly Averages card
    expect(screen.getByText("Weekly Averages")).toBeInTheDocument();

    // Practices summary
    expect(screen.getByText("Practices")).toBeInTheDocument();

    // Test progress
    expect(screen.getByText("Test Progress")).toBeInTheDocument();

    // Empty state appears after data loads
    expect(await screen.findByText(/no test results yet/i)).toBeInTheDocument();
  });
});
