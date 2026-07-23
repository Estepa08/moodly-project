import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen } from "../../test/test-utils";
import Dashboard from "../dashboard";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    users: { me: vi.fn() },
    parameters: { list: vi.fn() },
    entries: { list: vi.fn(), create: vi.fn() },
    auth: { logout: vi.fn(), demo: vi.fn() },
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

  it("renders date picker, mood check-in, trends, averages, test progress, and history", async () => {
    (api.parameters.list as Mock).mockResolvedValue([
      { id: "1", name: "Mood", unit: "/10" },
      { id: "2", name: "Anxiety", unit: "/10" },
    ]);
    (api.entries.list as Mock).mockResolvedValue([]);
    (api.testResults.list as Mock).mockResolvedValue([]);
    (api.tests.list as Mock).mockResolvedValue([]);
    renderWithProviders(<Dashboard />);

    expect(screen.getByText("Quick Entry")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Parameter Trends")).toBeInTheDocument();
    expect(screen.getByText("Weekly Averages")).toBeInTheDocument();
    expect(screen.getByText("Test Progress")).toBeInTheDocument();

    expect(screen.getAllByText("Select...")).toHaveLength(1);
    expect(await screen.findByText(/no test results yet/i)).toBeInTheDocument();
  });
});
