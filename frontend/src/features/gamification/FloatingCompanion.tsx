import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import PetAvatar from "./PetAvatar";
import { usePets } from "./useCreature";
import { PET_DEFINITIONS } from "./pets";

const HIDDEN_PATHS = ["/tests/", "/practices/breathing", "/onboarding"];

export default function FloatingCompanion() {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: pets } = usePets();

  if (HIDDEN_PATHS.some((path) => location.pathname.startsWith(path))) return null;

  const petType = pets?.activePetType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? "pets.puff");

  return (
    <div
      className="fixed right-4 bottom-[calc(5rem+var(--sab))] md:bottom-6 md:right-6 z-40 animate-pet-float"
      role="presentation"
    >
      <PetAvatar petType={petType} size="md" interactive ariaLabel={petName} />
    </div>
  );
}
