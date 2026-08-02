import { useEffect, useState } from "react";
import { getPetAnimations, type PetEmotion } from "./pets";

const fallbackAnimation = () => import("../../assets/lottie/breathing-creature.json");

export function usePetAnimation(petType: string, emotion: PetEmotion = "idle") {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    const requested = getPetAnimations(petType, emotion);
    const pool = requested.length > 0 ? requested : getPetAnimations(petType, "idle");
    const load =
      pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : fallbackAnimation;

    load().then((module) => {
      if (!cancelled) setData(module.default);
    });

    return () => {
      cancelled = true;
    };
  }, [petType, emotion]);

  return data;
}
