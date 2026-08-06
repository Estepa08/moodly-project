import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import PetSpeechBubble, { usePetSpeech } from "../PetSpeechBubble";
import { subscribeSpeech, emitSpeech } from "../celebration";

vi.mock("../../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

function Harness() {
  const speech = usePetSpeech();
  return (
    <div>
      <PetSpeechBubble current={speech.current} dismiss={speech.dismiss} replay={speech.replay} />
      <button onClick={() => emitSpeech("привет")}>emit</button>
    </div>
  );
}

describe("speechEvents bus", () => {
  it("уведомляет подписчиков и возвращает отписку", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSpeech(listener);
    emitSpeech("реплика");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({ text: "реплика" });

    unsubscribe();
    emitSpeech("ещё одна");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("присваивает каждой реплике уникальный id", () => {
    const ids: string[] = [];
    const unsubscribe = subscribeSpeech((s) => ids.push(s.id));
    emitSpeech("a");
    emitSpeech("b");
    unsubscribe();
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe("usePetSpeech", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("показывает реплики по очереди: новая распаковывает очередь после скрытия", () => {
    render(<Harness />);

    act(() => emitSpeech("первая"));
    act(() => emitSpeech("вторая"));
    expect(screen.getByText("первая")).toBeInTheDocument();
    expect(screen.queryByText("вторая")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByText("первая")).not.toBeInTheDocument();
    expect(screen.getByText("вторая")).toBeInTheDocument();
  });

  it("кнопка закрытия скрывает текущую реплику и показывает следующую", () => {
    render(<Harness />);
    act(() => emitSpeech("первая"));
    act(() => emitSpeech("вторая"));

    fireEvent.click(screen.getByRole("button", { name: /hide message/i }));

    expect(screen.queryByText("первая")).not.toBeInTheDocument();
    expect(screen.getByText("вторая")).toBeInTheDocument();
  });

  it("кнопка повтора перезапускает показ текущей реплики (не берёт из очереди)", () => {
    render(<Harness />);
    act(() => emitSpeech("только первая"));

    fireEvent.click(screen.getByRole("button", { name: /repeat message/i }));

    expect(screen.getByText("только первая")).toBeInTheDocument();
    expect(screen.getAllByText("только первая").length).toBeGreaterThanOrEqual(1);
  });
});
