export const STARTER_PET_TYPES = ["puff", "dewdrop", "sprout"] as const;

export interface PetDefinition {
  type: string;
  labelKey: string;
  color: string;
  emoji: string;
  animations?: (() => Promise<{ default: unknown }>)[];
}

export const PET_DEFINITIONS: PetDefinition[] = [
  { type: "puff", labelKey: "pets.puff", color: "bg-pet-1", emoji: "🫧" },
  {
    type: "kitty",
    labelKey: "pets.kitty",
    color: "bg-pet-2",
    emoji: "🐱",
    animations: [
      () => import("../../assets/lottie/pets/pet-kitty-1.json"),
      () => import("../../assets/lottie/pets/pet-kitty-2.json"),
    ],
  },
  { type: "dewdrop", labelKey: "pets.dewdrop", color: "bg-pet-3", emoji: "💧" },
  { type: "sprout", labelKey: "pets.sprout", color: "bg-pet-4", emoji: "🌱" },
  { type: "comet", labelKey: "pets.comet", color: "bg-pet-5", emoji: "✨" },
  { type: "aurora", labelKey: "pets.aurora", color: "bg-pet-6", emoji: "🌈" },
];

export function getPetAnimations(petType: string) {
  return PET_DEFINITIONS.find((p) => p.type === petType)?.animations ?? [];
}
