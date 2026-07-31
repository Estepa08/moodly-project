import { useEffect, useState } from "react";
import { getPetAnimations } from "./pets";

const fallbackAnimation = () => import("../../assets/lottie/breathing-creature.json");

export function usePetAnimation(petType: string) {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    const animations = getPetAnimations(petType);
    const load =
      animations.length > 0
        ? animations[Math.floor(Math.random() * animations.length)]
        : fallbackAnimation;

    load().then((module) => {
      if (!cancelled) setData(module.default);
    });

    return () => {
      cancelled = true;
    };
  }, [petType]);

  return data;
}
