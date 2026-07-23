import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import ReportsPage from "../reports";
import userEvent from "@testing-library/user-event";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    reports: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      download: vi.fn(() => "/reports/1/download"),
      delete: vi.fn(),
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders report generator form", async () => {
    (api.reports.list as Mock).mockResolvedValueOnce([]);
    renderWithProviders(<ReportsPage />);
    expect(await screen.findByText("Export your data")).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
  });

  it("submits report generation", async () => {
    (api.reports.list as Mock).mockResolvedValueOnce([]);
    (api.reports.create as Mock).mockResolvedValueOnce({ status: "pending" });
    renderWithProviders(<ReportsPage />);

    const fromInput = await screen.findByLabelText("From");
    const toInput = screen.getByLabelText("To");
    await userEvent.clear(fromInput);
    await userEvent.type(fromInput, "2026-01-01");
    await userEvent.clear(toInput);
    await userEvent.type(toInput, "2026-02-01");

    await userEvent.click(screen.getByText("Generate"));
    await waitFor(() => {
      expect(api.reports.create).toHaveBeenCalled();
    });
  });
});
