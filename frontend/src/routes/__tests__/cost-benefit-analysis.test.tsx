import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import CostBenefitAnalysisPage from "../cost-benefit-analysis";
import userEvent from "@testing-library/user-event";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    auth: { refresh: vi.fn().mockRejectedValue(new Error("no session")) },
    cba: {
      examples: vi.fn(),
      commonItems: vi.fn(),
      entries: { list: vi.fn(), create: vi.fn(), delete: vi.fn() },
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

const mockExample = (overrides = {}) => ({
  id: "ex1",
  persona: "Test persona",
  thoughtText: "Test negative thought",
  prosWeight: 25,
  consWeight: 75,
  order: 1,
  items: [
    { id: "i1", itemType: "advantage", itemText: "Advantage one" },
    { id: "i2", itemType: "disadvantage", itemText: "Disadvantage one" },
  ],
  distortions: [{ id: "d1", exampleId: "ex1", distortionKey: "labeling" }],
  ...overrides,
});

const mockCommonItem = (overrides = {}) => ({
  id: "c1",
  itemType: "advantage",
  category: "anxiety",
  itemKey: "anxiety.safer",
  itemText: "Feel safer",
  ...overrides,
});

describe("CostBenefitAnalysisPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the library tab with a worked example by default", async () => {
    (api.cba.examples as Mock).mockResolvedValueOnce([mockExample()]);
    (api.cba.commonItems as Mock).mockResolvedValueOnce([]);
    (api.cba.entries.list as Mock).mockResolvedValueOnce([]);

    renderWithProviders(<CostBenefitAnalysisPage />);

    expect(await screen.findByText("Test negative thought")).toBeInTheDocument();
    expect(screen.getByText("Advantage one")).toBeInTheDocument();
  });

  it("submits a new entry from the form tab", async () => {
    (api.cba.examples as Mock).mockResolvedValueOnce([mockExample()]);
    (api.cba.commonItems as Mock).mockResolvedValueOnce([
      mockCommonItem({ id: "c1", itemType: "advantage", itemText: "Feel safer" }),
      mockCommonItem({
        id: "c2",
        itemType: "disadvantage",
        itemKey: "anxiety.postpone",
        itemText: "Can put off dealing with the problem",
      }),
    ]);
    (api.cba.entries.list as Mock).mockResolvedValue([]);
    (api.cba.entries.create as Mock).mockResolvedValueOnce({
      // Mocking the entry creation
      id: "e1",
      thoughtText: "New thought",
      prosWeight: 50,
      consWeight: 50,
      createdAt: "2026-01-01T00:00:00Z",
      items: [],
    });

    const user = userEvent.setup();
    renderWithProviders(<CostBenefitAnalysisPage />);

    await user.click(await screen.findByText("New Entry"));

    const textarea = await screen.findByPlaceholderText(
      'e.g. "If I make a mistake, everyone will think I\'m incompetent"',
    );
    await user.type(textarea, "New thought");
    const suggestionTriggers = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-haspopup") === "listbox");
    await user.click(suggestionTriggers[0]);
    await user.click(await screen.findByRole("option", { name: "Feel safer" }));
    await user.click(suggestionTriggers[1]);
    await user.click(screen.getByRole("option", { name: "Can put off dealing with the problem" }));
    await user.click(screen.getByText("Save entry"));

    await waitFor(() => {
      expect(api.cba.entries.create).toHaveBeenCalledWith(
        expect.objectContaining({
          thoughtText: "New thought",
          prosWeight: 50,
          consWeight: 50,
          items: [
            { itemType: "advantage", itemText: "Feel safer" },
            {
              itemType: "disadvantage",
              itemText: "Can put off dealing with the problem",
            },
          ],
        }),
      );
    });
  });

  it("renders the history tab with past entries", async () => {
    (api.cba.examples as Mock).mockResolvedValueOnce([mockExample()]);
    (api.cba.commonItems as Mock).mockResolvedValueOnce([]);
    (api.cba.entries.list as Mock).mockResolvedValueOnce([
      {
        id: "e1",
        thoughtText: "Old thought",
        prosWeight: 30,
        consWeight: 70,
        createdAt: "2026-01-01T00:00:00Z",
        items: [],
      },
    ]);

    const user = userEvent.setup();
    renderWithProviders(<CostBenefitAnalysisPage />);

    await user.click(await screen.findByText("History"));

    expect(await screen.findByText("Old thought")).toBeInTheDocument();
  });
});
