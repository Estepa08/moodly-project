import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, CreatureState } from "../../lib/api";
import { PracticeSource } from "./practice.enums";
import { celebrateReward } from "./celebration";
import { enqueue } from "../../lib/offline/sync";
import { getLocalCreature, saveLocalCreature, listLocalAchievements } from "../../lib/offline/db";
import { EXP_PER_LEVEL, ParameterName } from "../../lib/constants";
import { useParameters } from "../../hooks/useParameters";
import { useEntries } from "../../hooks/useEntries";
import { toast } from "sonner";
import { ENERGY_LOW_THRESHOLD } from "@moodly/shared";
import { computeEmpathy } from "./petRewards";
import i18n from "../../i18n/i18n";

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

const MOOD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Показываем уведомление о низкой энергии не чаще, чем раз в 10 минут,
// чтобы не спамить при серии кликов.
let lastEnergyWarnAt = 0;
const ENERGY_WARN_COOLDOWN_MS = 10 * 60 * 1000;

function maybeWarnLowEnergy(energy: number | undefined) {
  if (energy === undefined) return;
  if (energy > ENERGY_LOW_THRESHOLD) return;
  const now = Date.now();
  if (now - lastEnergyWarnAt < ENERGY_WARN_COOLDOWN_MS) return;
  lastEnergyWarnAt = now;
  toast.warning(i18n.t("companion.energyLowTitle"), {
    description: i18n.t("companion.energyLowHint"),
  });
}

// E2E: сервер не видит entry.value, поэтому настроение питомца считает клиент
// из локальных расшифрованных записей «Mood» за последние 7 дней.
function computePetMood(
  moodEntries: { value: number; createdAt: string }[] | undefined,
  calmness: number,
): "happy" | "calm" | "support" | null {
  if (!moodEntries) return null;
  const since = Date.now() - MOOD_WINDOW_MS;
  const recent = moodEntries.filter((e) => new Date(e.createdAt).getTime() >= since);
  if (recent.length === 0) return null; // нет данных — используем fallback сервера
  const avg = recent.reduce((s, e) => s + e.value, 0) / recent.length;
  if (avg >= 7) return "happy";
  if (avg >= 5) return calmness >= 70 ? "happy" : "calm";
  return "support";
}

// ===== useCreatureState - получение состояния с корректировкой уровня и XP =====
export function useCreatureState() {
  const queryClient = useQueryClient();
  const { data: params } = useParameters();
  const moodParam = params?.find((p) => p.name === ParameterName.Mood);
  const { data: moodEntries } = useEntries(moodParam ? { parameterId: moodParam.id } : undefined);

  return useQuery({
    queryKey: ["creature"],
    // offline-first: при офлайне читаем локальное зеркало из IndexedDB
    queryFn: async () => {
      if (!navigator.onLine) {
        const local = await getLocalCreature();
        return local as never;
      }
      const data = await api.creature.getState(); // Получаем текущее состояние питомца

      // E2E: пересчитываем настроение и пушим в creatureState, если изменилось
      const petMood = computePetMood(moodEntries, data.calmness ?? 50);
      if (petMood && petMood !== data.petMood) {
        data.petMood = petMood;
        await enqueue("creatureState", "upsert", "creature-profile", { petMood });
      }

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

// ===== usePet - поглаживание компаньона, коррекция уровня и XP =====
export function usePet() {
  const queryClient = useQueryClient();

  return useMutation({
    // Флаг empathy передаётся в момент клика: сервер начисляет +2 comfort,
    // если пользователь грустит/тревожится (см. computeEmpathy у клиента).
    mutationFn: (opts?: { empathy?: boolean }) => api.creature.pet(opts?.empathy),
    onSuccess: (data) => {
      maybeWarnLowEnergy(data.state?.energy);

      if (data?.state && "level" in data.state && "experience" in data.state) {
        const { corrected, leveledUp } = correctLevelAndXP(data.state);

        queryClient.setQueryData(["creature"], corrected);

        if (leveledUp) {
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

// ===== useEmpathyActive - пользователь грустит/тревожится (активен бонус «Эмпатия») =====
// Клиент пересчитывает эмпатию из расшифрованных записей Mood (≤ 3) или Anxiety
// за последние 24 часа (E2E: сервер не видит value записей).
export function useEmpathyActive(): boolean {
  const { data: params } = useParameters();
  const moodParam = params?.find((p) => p.name === ParameterName.Mood);
  const anxietyParam = params?.find((p) => p.name === ParameterName.Anxiety);
  const { data: moodEntries } = useEntries(moodParam ? { parameterId: moodParam.id } : undefined);
  const { data: anxietyEntries } = useEntries(
    anxietyParam ? { parameterId: anxietyParam.id } : undefined,
  );
  return computeEmpathy(moodParam?.id, anxietyParam?.id, [
    ...(moodEntries ?? []),
    ...(anxietyEntries ?? []),
  ]);
}

// Остальные хуки остаются прежними
export function useCompletions(days = 30) {  return useQuery({
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
