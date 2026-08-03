import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PetCollection from "../PetCollection";
import { usePets, useSetPet } from "../useCreature";
import { PET_DEFINITIONS } from "../pets";

vi.mock("../useCreature", () => ({
  usePets: vi.fn(),
  useSetPet: vi.fn(),
}));

describe("PetCollection", () => {
  beforeEach(() => {
    vi.mocked(useSetPet).mockReturnValue({ mutate: vi.fn() } as never);
  });

  it("shows only the first 6 pets plus a 'Show all' button initially", () => {
    vi.mocked(usePets).mockReturnValue({
      data: { unlockedPetTypes: ["puff"], activePetType: "puff", feedCounts: {} },
      isLoading: false,
    } as never);

    render(<PetCollection />);

    const buttons = screen.getAllByRole("button");
    const hiddenCount = PET_DEFINITIONS.length - 6;
    // 6 pet cards + 1 'Show all'
    expect(buttons).toHaveLength(7);
    expect(screen.getByText(`Show all (${hiddenCount})`)).toBeInTheDocument();
  });

  it("expands to all pets and hides the 'Show all' button after click", () => {
    vi.mocked(usePets).mockReturnValue({
      data: { unlockedPetTypes: ["puff"], activePetType: "puff", petType: "puff", petTypeName: null },
      isLoading: false,
    } as never);

    render(<PetCollection />);

    const showAll = screen.getByRole("button", { name: /Show all/ });
    fireEvent.click(showAll);

    expect(screen.getAllByRole("button")).toHaveLength(PET_DEFINITIONS.length);
    expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
  });
});