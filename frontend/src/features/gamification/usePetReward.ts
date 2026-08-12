import { useMemo, useState } from "react";
import { usePet, useEmpathyActive } from "./useCreature";
import { buildRewardSignal, type PetRewardSignal } from "./petRewards";
import { isMorningWindow, isEveningWindow } from "@moodly/shared";
import type { PetGlow } from "./PetAvatar";
import type { PetResponse } from "../../lib/api";

// Общая логика клика по компаньону с наградами:
// - считает эмпатию (клиент видит расшифрованные записи Mood/Anxiety),
// - передаёт её в мутацию pet,
// - по ответу сервера строит сигнал награды (уникальная анимация),
// - вычисляет ореол-подсказку скрытого бонуса (утро → тёплый, вечер → синий).
export function usePetReward() {
  const pet = usePet();
  const empathyActive = useEmpathyActive();
  const [reward, setReward] = useState<PetRewardSignal | null>(null);

  const glow: PetGlow = useMemo(() => {
    const hour = new Date().getHours();
    if (isMorningWindow(hour)) return "warm";
    if (isEveningWindow(hour)) return "cool";
    return null;
  }, []);

  const handlePet = (onSuccess?: (data: PetResponse) => void) => {
    pet.mutate(
      { empathy: empathyActive },
      {
        onSuccess: (data) => {
          setReward(buildRewardSignal(data));
          onSuccess?.(data);
        },
      },
    );
  };

  return { reward, glow, empathyActive, pet, handlePet };
}
