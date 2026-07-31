import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, fireEvent } from "../../test/test-utils";
import Dashboard from "../dashboard";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    users: { me: vi.fn() },
    parameters: { list: vi.fn() },
    entries: { list: vi.fn(), create: vi.fn() },
    auth: {
      logout: vi.fn(),
      demo: vi.fn(),
      refresh: vi.fn().mockRejectedValue(new Error("no session")),
    },
    tests: { list: vi.fn(), get: vi.fn(), submitResult: vi.fn() },
    testResults: { list: vi.fn() },
    feedback: { create: vi.fn(), listMine: vi.fn() },
    onboarding: { list: vi.fn() },
    reports: { create: vi.fn(), list: vi.fn(), get: vi.fn(), delete: vi.fn() },
    creature: {
      getState: vi.fn().mockRejectedValue(new Error("no creature")),
      getCompletions: vi.fn().mockResolvedValue([]),
    },
    cba: {
      examples: vi.fn().mockResolvedValue([]),
      commonItems: vi.fn().mockResolvedValue([]),
      entries: { list: vi.fn().mockResolvedValue([]), create: vi.fn(), delete: vi.fn() },
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

function mockDashboardApi() {
  (api.parameters.list as Mock).mockResolvedValue([
    { id: "1", name: "Mood", unit: "/10" },
    { id: "2", name: "Anxiety", unit: "/10" },
  ]);
  (api.entries.list as Mock).mockResolvedValue([]);
  (api.testResults.list as Mock).mockResolvedValue([]);
  (api.tests.list as Mock).mockResolvedValue([]);
}

describe("Dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders statistics page sections", async () => {
    mockDashboardApi();
    renderWithProviders(<Dashboard />);

    // Period selector
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(screen.getByText("2 Weeks")).toBeInTheDocument();

    // Wellbeing accordion header
    expect(screen.getByText("Wellbeing")).toBeInTheDocument();

    // Tests taken card (empty state)
    expect(await screen.findByText("Tests Taken")).toBeInTheDocument();

    // Legacy digest sections removed
    expect(screen.queryByText("Weekly Averages")).not.toBeInTheDocument();
    expect(screen.queryByText("Weekly Digest")).not.toBeInTheDocument();
    expect(screen.queryByText("Today's check-in pending")).not.toBeInTheDocument();
  });

  it("shows quick entry by default and toggles the wellbeing panel", async () => {
    mockDashboardApi();
    renderWithProviders(<Dashboard />);

    // Panel is expanded by default
    expect(await screen.findByText("Quick Entry")).toBeInTheDocument();

    // Clicking Wellbeing collapses the panel and persists the choice
    fireEvent.click(screen.getByText("Wellbeing"));
    expect(screen.queryByText("Quick Entry")).not.toBeInTheDocument();
    expect(localStorage.getItem("moodly_wellbeing_open")).toBe("0");

    // Clicking again reopens it
    fireEvent.click(screen.getByText("Wellbeing"));
    expect(await screen.findByText("Quick Entry")).toBeInTheDocument();
    expect(localStorage.getItem("moodly_wellbeing_open")).toBe("1");
  });

  it("marks quick entry icons as saved when a param has a today entry", async () => {
    mockDashboardApi();
    (api.entries.list as Mock).mockResolvedValue([
      {
        id: "e1",
        userId: "u1",
        parameterId: "1",
        value: 7,
        createdAt: new Date().toISOString(),
      },
    ]);
    renderWithProviders(<Dashboard />);

    expect(await screen.findByTestId("quick-entry-saved-Mood")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-entry-saved-Anxiety")).not.toBeInTheDocument();
  });
});
