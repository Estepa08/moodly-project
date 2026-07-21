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

  it("renders date picker, trends, quick entry, averages, test progress, and history", async () => {
    (api.parameters.list as Mock).mockResolvedValueOnce([{ id: "1", name: "Anxiety", unit: "/10" }]);
    (api.entries.list as Mock).mockResolvedValueOnce([]);
    (api.testResults.list as Mock).mockResolvedValueOnce([]);
    (api.tests.list as Mock).mockResolvedValueOnce([]);
    renderWithProviders(<Dashboard />);

    expect(screen.getByText("Parameter Trends")).toBeInTheDocument();
    expect(screen.getByText("Quick Entry")).toBeInTheDocument();
    expect(screen.getByText("Weekly Averages")).toBeInTheDocument();
    expect(screen.getByText("Test Progress")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();

    await screen.findByText("No entries for this period");
    await screen.findByText("No test results yet");
  });
});
