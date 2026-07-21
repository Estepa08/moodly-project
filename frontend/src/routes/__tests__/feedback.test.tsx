import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import FeedbackPage from "../feedback";
import userEvent from "@testing-library/user-event";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    feedback: { create: vi.fn(), listMine: vi.fn() },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

describe("FeedbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders feedback form", async () => {
    (api.feedback.listMine as Mock).mockResolvedValueOnce([]);
    renderWithProviders(<FeedbackPage />);
    expect(await screen.findByText("Send Feedback")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Share your thoughts...")).toBeInTheDocument();
  });

  it("submits feedback", async () => {
    (api.feedback.listMine as Mock).mockResolvedValueOnce([]);
    (api.feedback.create as Mock).mockResolvedValueOnce({ message: "Great!" });
    renderWithProviders(<FeedbackPage />);
    const textarea = await screen.findByPlaceholderText("Share your thoughts...");
    await userEvent.type(textarea, "Love this app!");
    await userEvent.click(screen.getByText("Send"));
    await waitFor(() => {
      expect(api.feedback.create).toHaveBeenCalledWith({ message: "Love this app!" });
    });
  });
});
