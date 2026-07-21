import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import FeedbackPage from "../feedback";
import userEvent from "@testing-library/user-event";
import { api } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  api: {
    feedback: { create: vi.fn(), listMine: vi.fn() },
  },
}));

describe("FeedbackPage", () => {
  const navigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders feedback form", async () => {
    (api.feedback.listMine as Mock).mockResolvedValueOnce([]);
    renderWithProviders(<FeedbackPage navigate={navigate} />);
    expect(screen.getByText("Send Feedback")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Share your thoughts...")).toBeInTheDocument();
  });

  it("submits feedback", async () => {
    (api.feedback.listMine as Mock).mockResolvedValueOnce([]);
    (api.feedback.create as Mock).mockResolvedValueOnce({ message: "Great!" });
    renderWithProviders(<FeedbackPage navigate={navigate} />);
    await userEvent.type(screen.getByPlaceholderText("Share your thoughts..."), "Love this app!");
    await userEvent.click(screen.getByText("Send"));
    await waitFor(() => {
      expect(api.feedback.create).toHaveBeenCalledWith({ message: "Love this app!" });
    });
  });
});
