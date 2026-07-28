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
    creature: { getState: vi.fn().mockRejectedValue(new Error("no creature")), getCompletions: vi.fn().mockResolvedValue([]) },
    cba: { examples: vi.fn().mockResolvedValue([]), commonItems: vi.fn().mockResolvedValue([]), entries: { list: vi.fn().mockResolvedValue([]), create: vi.fn(), delete: vi.fn() } },
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

    // Section titles appear in collapsible buttons
    expect(screen.getAllByText("How You've Been Feeling").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Weekly Averages").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Practices").length).toBeGreaterThanOrEqual(1);

    // Wellbeing card
    expect(screen.getByText("Wellbeing")).toBeInTheDocument();
  });
});
