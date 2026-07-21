import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders, screen, waitFor } from "../../test/test-utils";
import TestDetailPage from "../test-detail";
import userEvent from "@testing-library/user-event";

vi.mock("../../lib/api", () => ({
  api: {
    tests: {
      list: vi.fn(),
      get: vi.fn(),
      submitResult: vi.fn(),
    },
  },
}));

describe("TestDetailPage", () => {
  const navigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders test questions one at a time", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "1",
      title: "GAD-7",
      questions: [
        {
          id: "q1",
          text: "Feeling nervous?",
          options: [
            { id: "a1", text: "Not at all", score: 0 },
            { id: "a2", text: "Several days", score: 1 },
          ],
        },
        {
          id: "q2",
          text: "Trouble relaxing?",
          options: [
            { id: "b1", text: "Not at all", score: 0 },
            { id: "b2", text: "Several days", score: 1 },
          ],
        },
      ],
    });

    renderWithProviders(<TestDetailPage navigate={navigate} testId="1" />);

    await waitFor(() => {
      expect(screen.getByText("Feeling nervous?")).toBeInTheDocument();
    });
    expect(screen.getByText("Not at all")).toBeInTheDocument();
    expect(screen.getByText("Several days")).toBeInTheDocument();
    expect(screen.queryByText("Trouble relaxing?")).not.toBeInTheDocument();
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });

  it("shows result after answering all questions", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "1",
      title: "GAD-7",
      questions: [
        {
          id: "q1",
          text: "Feeling nervous?",
          options: [
            { id: "a1", text: "Not at all", score: 0 },
            { id: "a2", text: "Several days", score: 1 },
          ],
        },
      ],
    });
    (api.tests.submitResult as Mock).mockResolvedValueOnce({
      score: 1,
      interpretation: "Low score",
      recommendation: "Keep monitoring.",
    });

    const user = userEvent.setup();
    renderWithProviders(<TestDetailPage navigate={navigate} testId="1" />);

    await waitFor(() => {
      expect(screen.getByText("Feeling nervous?")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Several days"));

    await waitFor(() => {
      expect(screen.getByText("Low score")).toBeInTheDocument();
    });
    expect(screen.getByText("Keep monitoring.")).toBeInTheDocument();
  });

  it("shows cognitive distortion profile when flags.distortions present", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "2",
      title: "Cognitive Distortions Assessment",
      questions: [
        { id: "q1", text: "Test question 1?", options: [{ id: "a1", text: "Not at all", score: 0 }, { id: "a2", text: "Moderately", score: 2 }] },
      ],
    });
    (api.tests.submitResult as Mock).mockResolvedValueOnce({
      score: 2,
      interpretation: "Some distortions detected",
      recommendation: "Consider CBT techniques.",
      flags: {
        distortions: {
          allOrNothing: { score: 8, level: "high" },
          shouldStatements: { score: 6, level: "moderate" },
          personalization: { score: 1, level: "low" },
        },
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<TestDetailPage navigate={navigate} testId="2" />);

    await waitFor(() => expect(screen.getByText("Test question 1?")).toBeInTheDocument());
    await user.click(screen.getByText("Moderately"));

    await waitFor(() => {
      expect(screen.getByText("Cognitive Distortion Profile")).toBeInTheDocument();
    });
    expect(screen.getByText("All-or-Nothing Thinking")).toBeInTheDocument();
    expect(screen.getByText("Should Statements")).toBeInTheDocument();
    expect(screen.getByText("Personalization")).toBeInTheDocument();
  });
});
