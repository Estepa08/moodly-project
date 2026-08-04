import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, CreatureState } from "../../lib/api";
import { PracticeSource } from "./practice.enums";
import { celebrateReward } from "./celebration";
import { enqueue } from "../../lib/offline/sync";
import { getLocalCreature, saveLocalCreature, listLocalAchievements } from "../../lib/offline/db";
import { EXP_PER_LEVEL } from "../../lib/constants";

// ===== Функция для коррекции уровня и XP =====
function correctLevelAndXP(state: CreatureState): { corrected: CreatureState; leveledUp: boolean } {
  let { level, experience } = state;
  let leveledUp = false;

  // Пока XP больше или равно порогу для следующего уровня
  while (experience >= level * EXP_PER_LEVEL) {
    experience -= level * EXP_PER_LEVEL;
    level += 1;
    leveledUp = true;
  }

  return {
    corrected: {
      ...state,
      level,
      experience,
    },
    leveledUp,
  };
}

// ===== useCreatureState - получение состояния с корректировкой уровня и XP =====
export function useCreatureState() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["creature"],
    // offline-first: при офлайне читаем локальное зеркало из IndexedDB
    queryFn: async () => {
      if (!navigator.onLine) {
        const local = await getLocalCreature();
        return local as never;
      }
      const data = await api.creature.getState(); // Получаем текущее состояние питомца

      // Корректируем уровень и XP
      const { corrected, leveledUp } = correctLevelAndXP(data);

      // Обновление кэша и показ уведомления о повышении уровня
      if (leveledUp) {
        queryClient.setQueryData(["creature"], corrected);
        setTimeout(() => {
          celebrateReward("load", {
            // Уведомление о повышении уровня
            leveledUp: true,
            state: { level: corrected.level },
          });
        }, 100);
      }

      return corrected;
    },
    staleTime: 30_000,
  });
}

// ===== useCompleteExercise - завершение упражнения и корректировка уровня =====
export function useCompleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (duration: number) => api.creature.completeExercise(duration),
    onSuccess: (data) => {
      const { corrected, leveledUp } = correctLevelAndXP(data.state);

      queryClient.setQueryData(["creature"], corrected);

      if (leveledUp) {
        celebrateReward("breathing", {
          leveledUp: true,
          state: { level: corrected.level },
        });
      } else {
        celebrateReward("breathing", data);
      }

      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });
}

// ===== useRewardPractice - получение награды и коррекция уровня =====
export function useRewardPractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (source: PracticeSource) => api.creature.reward(source),
    onSuccess: (data, source) => {
      const { corrected, leveledUp } = correctLevelAndXP(data.state);

      queryClient.setQueryData(["creature"], corrected);

      if (leveledUp) {
        celebrateReward(source, {
          leveledUp: true,
          state: { level: corrected.level },
        });
      } else {
        celebrateReward(source, data);
      }

      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });
}

// ===== useFeed - кормление питомца и корректировка уровня =====
export function useFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!navigator.onLine) {
        // офлайн: локально увеличиваем счётчики и ставим в outbox
        const local =
          (await getLocalCreature()) ??
          ({} as { petType?: string; feedCounts?: Record<string, number>; feedCount?: number });
        const petType = local.petType ?? "puff";
        const feedCounts = { ...(local.feedCounts ?? {}) };
        feedCounts[petType] = (feedCounts[petType] ?? 0) + 1;
        const feedCount = (local.feedCount ?? 0) + 1;
        await saveLocalCreature({ ...local, feedCount, feedCounts, petType });
        await enqueue("creatureState", "upsert", "creature-profile", {
          ...local,
          petType,
          feedCount,
          feedCounts,
        });
        return {
          state: { ...local, petType, feedCount, feedCounts } as CreatureState,
          leveledUp: false,
          xpAwarded: 0,
          feedCount,
          feedCounts,
        };
      }
      return api.creature.feed();
    },
    onSuccess: (data) => {
      // Проверяем, что data.state существует и имеет level и experience
      if (data?.state && "level" in data.state && "experience" in data.state) {
        const { corrected, leveledUp } = correctLevelAndXP(data.state);

        queryClient.setQueryData(["creature"], corrected);

        if (leveledUp) {
          // Проверка на повышение уровня
          celebrateReward("feed", {
            leveledUp: true,
            state: { level: corrected.level },
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["creature"] });
      queryClient.invalidateQueries({ queryKey: ["creature", "pets"] });
      queryClient.invalidateQueries({ queryKey: ["creature", "stats"] });
    },
  });
}

// Остальные хуки остаются прежними
export function useCompletions(days = 30) {
  return useQuery({
    queryKey: ["creature", "completions", days],
    queryFn: () => api.creature.getCompletions(days),
    staleTime: 30_000,
  });
}

export function useCreatureStats() {
  return useQuery({
    queryKey: ["creature", "stats"],
    queryFn: () => api.creature.getStats(),
    staleTime: 60_000,
  });
}

export function usePets() {
  return useQuery({
    queryKey: ["creature", "pets"],
    queryFn: () => api.creature.getPets(),
    staleTime: 60_000,
  });
}

export function useSetPet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: string | { petType?: string; petName?: string | null }) => {
      const data =
        typeof args === "string"
          ? { petType: args, petName: null }
          : { petType: args.petType, petName: args.petName };
      if (!navigator.onLine) {
        const local =
          (await getLocalCreature()) ??
          ({} as { petType?: string; unlockedPetTypes?: string[]; petName?: string | null });
        const next: Record<string, unknown> = { ...local };
        if (data.petType) {
          next.petType = data.petType;
          const unlocked = local.unlockedPetTypes ?? ["puff"];
          if (!unlocked.includes(data.petType)) next.unlockedPetTypes = [...unlocked, data.petType];
        }
        if (data.petName !== undefined) next.petName = data.petName;
        await saveLocalCreature(next as never);
        await enqueue("creatureState", "upsert", "creature-profile", next);
        return {
          unlockedPetTypes: (next.unlockedPetTypes as string[]) ?? ["puff"],
          activePetType: next.petType as string,
          petName: (next.petName as string) ?? null,
        };
      }
      return api.creature.setPet(data.petType, data.petName ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creature", "pets"] });
      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });
}

export function useHeatmap(days = 90) {
  return useQuery({
    queryKey: ["creature", "heatmap", days],
    queryFn: () => api.creature.getHeatmap(days),
    staleTime: 60_000,
  });
}

export function useMissions() {
  return useQuery({
    queryKey: ["creature", "missions"],
    queryFn: () => api.creature.getMissions(),
    staleTime: 30_000,
  });
}

export function useClaimMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.creature.claimMission(id),
    onSuccess: (data) => {
      if (data.leveledUp) {
        const currentCreature = queryClient.getQueryData<{ level: number }>(["creature"]);
        if (currentCreature) {
          celebrateReward("mission", {
            leveledUp: true,
            state: { level: currentCreature.level + 1 },
          });
        } else {
          celebrateReward("mission", {
            leveledUp: true,
            state: { level: 0 },
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["creature", "missions"] });
      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      if (!navigator.onLine) {
        const local = await listLocalAchievements();
        return local as never;
      }
      return api.achievements.list();
    },
    staleTime: 60_000,
  });
}
