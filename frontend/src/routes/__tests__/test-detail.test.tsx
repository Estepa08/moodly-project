import { describe, it, expect, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../hooks/useAuth";
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
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

vi.mock("../../components/RadarChart", () => ({
  default: ({ data }: { data: { key: string; score: number }[] }) => (
    <div>
      {data.map((d) => (
        <span key={d.key}>{d.key}</span>
      ))}
    </div>
  ),
}));

describe("TestDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderAt(path: string) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <MemoryRouter initialEntries={[path]}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes>
              <Route path="/tests/:testId" element={<TestDetailPage />} />
            </Routes>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );
  }

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

    renderAt("/tests/1");

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
    renderAt("/tests/1");

    await waitFor(() => {
      expect(screen.getByText("Feeling nervous?")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Several days"));
    await user.click(screen.getByRole("button", { name: /review/i }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

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
        {
          id: "q1",
          text: "Test question 1?",
          options: [
            { id: "a1", text: "Not at all", score: 0 },
            { id: "a2", text: "Moderately", score: 2 },
          ],
        },
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
    renderAt("/tests/2");

    await waitFor(() => expect(screen.getByText("Test question 1?")).toBeInTheDocument());
    await user.click(screen.getByText("Moderately"));
    await user.click(screen.getByRole("button", { name: /review/i }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText("Your Thinking Patterns")).toBeInTheDocument();
    });
    expect(screen.getByText("allOrNothing")).toBeInTheDocument();
    expect(screen.getByText("shouldStatements")).toBeInTheDocument();
    expect(screen.getByText("personalization")).toBeInTheDocument();
  });

  it("shows the content warning before a suicide-risk question and allows skipping to /tests", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "phq9",
      title: "PHQ-9",
      questions: [
        {
          id: "phq9-8",
          text: "Question 8?",
          options: [{ id: "a1", text: "Not at all", score: 0 }],
        },
        {
          id: "phq9-9",
          text: "Thoughts of self-harm?",
          options: [{ id: "b1", text: "Not at all", score: 0 }],
        },
      ],
    });

    const user = userEvent.setup();
    renderAt("/tests/phq9");

    await waitFor(() => expect(screen.getByText("Question 8?")).toBeInTheDocument());
    await user.click(screen.getByText("Not at all"));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("The following questions may be difficult")).toBeInTheDocument();
    });
    expect(screen.queryByText("Thoughts of self-harm?")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /skip these questions/i }));

    await waitFor(() => {
      expect(
        screen.queryByText("The following questions may be difficult"),
      ).not.toBeInTheDocument();
    });
  });

  it("shows the CrisisDialog when the recommendation indicates a critical result", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "phq9",
      title: "PHQ-9",
      questions: [
        {
          id: "q1",
          text: "Feeling down?",
          options: [{ id: "a1", text: "Nearly every day", score: 3 }],
        },
      ],
    });
    (api.tests.submitResult as Mock).mockResolvedValueOnce({
      score: 27,
      interpretation: "Severe depression",
      recommendation: "CRITICAL: Immediate emergency intervention is required.",
    });

    const user = userEvent.setup();
    renderAt("/tests/phq9");

    await waitFor(() => expect(screen.getByText("Feeling down?")).toBeInTheDocument());
    await user.click(screen.getByText("Nearly every day"));
    await user.click(screen.getByRole("button", { name: /review/i }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText("Immediate help is available")).toBeInTheDocument();
    });
    expect(screen.getByText(/please wait 10 seconds/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /please wait/i })).toBeDisabled();
  });

  it("does not show the CrisisDialog for a non-crisis recommendation", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "phq9",
      title: "PHQ-9",
      questions: [
        {
          id: "q1",
          text: "Feeling down?",
          options: [{ id: "a1", text: "Not at all", score: 0 }],
        },
      ],
    });
    (api.tests.submitResult as Mock).mockResolvedValueOnce({
      score: 0,
      interpretation: "Minimal",
      recommendation: "Keep monitoring.",
    });

    const user = userEvent.setup();
    renderAt("/tests/phq9");

    await waitFor(() => expect(screen.getByText("Feeling down?")).toBeInTheDocument());
    await user.click(screen.getByText("Not at all"));
    await user.click(screen.getByRole("button", { name: /review/i }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText("Keep monitoring.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Immediate help is available")).not.toBeInTheDocument();
    expect(screen.queryByText("We're here to help")).not.toBeInTheDocument();
  });
});
