import { describe, it, expect, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../hooks/useAuth";
import TestDetailPage from "../test-detail";
import userEvent from "@testing-library/user-event";

vi.mock("../../lib/api", () => ({
  api: {
    auth: { refresh: vi.fn().mockRejectedValue(new Error("no session")) },
    tests: {
      list: vi.fn(),
      get: vi.fn(),
    },
    creature: {
      getPets: vi.fn().mockResolvedValue({
        unlockedPetTypes: ["puff"],
        activePetType: "puff",
        petName: null,
        feedCounts: {},
      }),
      getState: vi.fn().mockResolvedValue({
        level: 1,
        streak: 1,
        calmness: 50,
        energy: 100,
      }),
      feed: vi.fn().mockResolvedValue({
        leveledUp: false,
        xpAwarded: 1,
        feedCount: 1,
        feedCounts: { puff: 1 },
      }),
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

vi.mock("../../features/analytics", () => ({
  RadarChart: ({ data }: { data: { key: string; score: number }[] }) => (
    <div>
      {data.map((d) => (
        <span key={d.key}>{d.key}</span>
      ))}
    </div>
  ),
}));

vi.mock("../../lib/crypto/session", () => ({
  getSessionKey: vi.fn(async () => ({ kind: "fake" }) as unknown as CryptoKey),
  getSessionUserId: vi.fn(() => "user-1"),
}));

vi.mock("../../lib/crypto/records", () => ({
  encryptTestResultPayload: vi.fn(async (data: unknown, id: string) => `enc:${id}`),
}));

vi.mock("../../lib/offline/sync", () => ({
  enqueue: vi.fn(async () => {}),
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
      title: "Emotional State",
      type: "ratio",
      scoreBands: [],
      active: true,
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

  it("feeds the pet once when advancing to the next question", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "3",
      title: "Feed Test",
      type: "ratio",
      scoreBands: [],
      active: true,
      questions: [
        {
          id: "q1",
          text: "Question one?",
          options: [
            { id: "a1", text: "No", score: 0 },
            { id: "a2", text: "Yes", score: 1 },
          ],
        },
        {
          id: "q2",
          text: "Question two?",
          options: [
            { id: "b1", text: "No", score: 0 },
            { id: "b2", text: "Yes", score: 1 },
          ],
        },
      ],
    });
    (api.creature.feed as Mock).mockClear();

    const user = userEvent.setup();
    renderAt("/tests/3");

    await waitFor(() => {
      expect(screen.getByText("Question one?")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Yes"));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Question two?")).toBeInTheDocument();
    });
    expect(api.creature.feed).toHaveBeenCalledTimes(1);
  });

  it("shows result after answering all questions", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "1",
      title: "Emotional State",
      type: "ratio",
      scoreBands: [],
      active: true,
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

    const user = userEvent.setup();
    renderAt("/tests/1");

    await waitFor(() => {
      expect(screen.getByText("Feeling nervous?")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Several days"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText("Повышенный результат")).toBeInTheDocument();
    });
  });

  it("shows cognitive distortion profile when flags.distortions present", async () => {
    const { api } = await import("../../lib/api");
    (api.tests.get as Mock).mockResolvedValueOnce({
      id: "2",
      title: "Cognitive Distortions Assessment",
      type: "computed",
      scoreBands: [],
      active: true,
      questions: [
        {
          id: "cd-1-1",
          text: "Test question 1?",
          options: [
            { id: "cd-1-1-0", text: "Not at all", score: 0 },
            { id: "cd-1-1-2", text: "Moderately", score: 2 },
          ],
        },
      ],
    });

    const user = userEvent.setup();
    renderAt("/tests/2");

    await waitFor(() => expect(screen.getByText("Test question 1?")).toBeInTheDocument());
    await user.click(screen.getByText("Moderately"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText("Your Thinking Patterns")).toBeInTheDocument();
    });
    expect(screen.getByText("allOrNothing")).toBeInTheDocument();
  });
});
