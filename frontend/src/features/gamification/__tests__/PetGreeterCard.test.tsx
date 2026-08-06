import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PetGreeterCard from "../PetGreeterCard";
import { useCreatureState, usePets } from "../useCreature";
import { useMessageOfDay } from "../../../hooks/useMessageOfDay";
import { emitSpeech } from "../celebration";

vi.mock("../useCreature", () => ({
  useCreatureState: vi.fn(),
  usePets: vi.fn(),
}));
vi.mock("../../../hooks/useMessageOfDay", () => ({
  useMessageOfDay: vi.fn(),
}));
vi.mock("../../../hooks/useDayPhase", () => ({
  useDayPhase: () => "day",
}));
vi.mock("../../../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));
vi.mock("../celebration", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../celebration")>();
  return { ...actual, emitSpeech: vi.fn() };
});

describe("PetGreeterCard", () => {
  beforeEach(() => {
    vi.mocked(emitSpeech).mockClear();
    vi.mocked(useCreatureState).mockReturnValue({
      data: { level: 3, petType: "puff", petMood: "calm" },
      isLoading: false,
    } as never);
    vi.mocked(usePets).mockReturnValue({
      data: { activePetType: "puff", petName: "Pip" },
    } as never);
    vi.mocked(useMessageOfDay).mockReturnValue({
      data: { text: null, question: null },
    } as never);
  });

  it("отдаёт вопрос приветствия в speechEvents при монтировании", async () => {
    render(<PetGreeterCard onCheckIn={vi.fn()} />);
    await waitFor(() => expect(emitSpeech).toHaveBeenCalledWith("How is your day going?"));
  });

  it("ставит текст и вопрос дня в очередь реплик", async () => {
    vi.mocked(useMessageOfDay).mockReturnValue({
      data: { text: "line-b", question: "line-c" },
    } as never);

    render(<PetGreeterCard onCheckIn={vi.fn()} />);
    await waitFor(() => expect(emitSpeech).toHaveBeenCalledWith("How is your day going?"));
    await waitFor(() => expect(emitSpeech).toHaveBeenCalledWith("line-b"));
    await waitFor(() => expect(emitSpeech).toHaveBeenCalledWith("line-c"), { timeout: 3000 });
  });

  it("повторяет реплику (пере-эмит очереди) при тапе по питомцу", async () => {
    render(<PetGreeterCard onCheckIn={vi.fn()} />);
    await waitFor(() => expect(emitSpeech).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Pip" }));

    await waitFor(() => expect(emitSpeech).toHaveBeenCalledWith("How is your day going?"));
    expect(emitSpeech).toHaveBeenCalledTimes(2);
  });
});
