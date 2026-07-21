import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import ReportsPage from "../reports";
import userEvent from "@testing-library/user-event";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    reports: { create: vi.fn(), list: vi.fn(), get: vi.fn(), download: vi.fn(() => "/reports/1/download"), delete: vi.fn() },
  },
}));

describe("ReportsPage", () => {
  const navigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders report generator form", async () => {
    (api.reports.list as Mock).mockResolvedValueOnce([]);
    renderWithProviders(<ReportsPage navigate={navigate} />);
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
    expect(screen.getByText("Format")).toBeInTheDocument();
  });

  it("submits report generation", async () => {
    (api.reports.list as Mock).mockResolvedValueOnce([]);
    (api.reports.create as Mock).mockResolvedValueOnce({ status: "pending" });
    renderWithProviders(<ReportsPage navigate={navigate} />);

    const fromInput = screen.getByLabelText("From");
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
