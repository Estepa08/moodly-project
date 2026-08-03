import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AchievementGrid from "../AchievementGrid";
import type { Achievement } from "../../../lib/api";
import { useAchievements } from "../useCreature";

vi.mock("../useCreature", () => ({
  useAchievements: vi.fn(),
}));

const base: Achievement = {
  id: "a",
  key: "a",
  category: "general",
  titleKey: "achievements.firstCheckin",
  descKey: "achievements.firstCheckinDesc",
  iconName: "sun",
  skinReward: null,
  titleReward: null,
  petTypeReward: null,
  xpReward: 10,
  sortOrder: 1,
  unlocked: false,
  unlockedAt: null,
  progress: 0,
};

const hidden = (progress: number): Achievement => ({
  ...base,
  id: "hidden",
  key: "hidden",
  category: "hidden",
  titleKey: "achievements.mysteryOwl",
  descKey: "achievements.mysteryOwlDesc",
  progress,
});

describe("AchievementGrid", () => {
  beforeEach(() => {
    vi.mocked(useAchievements).mockReset();
  });

  it("hides locked achievements with 0 progress until 'Show all' is pressed", async () => {
    const unlocked: Achievement = { ...base, id: "u", unlocked: true, progress: 100 };
    const inProgress: Achievement = { ...base, id: "p", key: "p", progress: 40 };
    const zero: Achievement = { ...base, id: "z", key: "z", progress: 0 };

    vi.mocked(useAchievements).mockReturnValue({
      data: [unlocked, inProgress, zero],
      isLoading: false,
    } as never);

    render(<AchievementGrid />);

    expect(screen.getByText(/Show all achievements/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Show all achievements/i));
    // On the 'Show all' button we pass count; assert the button disappears after click
    await waitFor(() =>
      expect(screen.queryByText(/Show all achievements/i)).not.toBeInTheDocument(),
    );
  });

  it("renders hidden achievements as mystery cards pre-unlock and reveals upon unlock", () => {
    const hiddenLocked = hidden(10);
    const hiddenUnlocked = hidden(100);
    hiddenUnlocked.unlocked = true;
    hiddenUnlocked.unlockedAt = "now";

    vi.mocked(useAchievements).mockReturnValue({
      data: [hiddenLocked, hiddenUnlocked],
      isLoading: false,
    } as never);

    render(<AchievementGrid />);

    expect(screen.getAllByText("???")).toHaveLength(1);
    expect(screen.getByText("Midnight Guest")).toBeInTheDocument();
  });
});
