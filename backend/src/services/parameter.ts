import { prisma } from "../lib/prisma.js";

export const DEFAULT_PARAMETERS = [
  { name: "Anxiety", description: "Общий уровень тревоги", unit: "/10" },
  { name: "Sleep", description: "Качество сна", unit: "/10" },
  { name: "Mood", description: "Общее настроение", unit: "/10" },
  { name: "Energy", description: "Уровень энергии", unit: "/10" },
  { name: "Gratitude", description: "Ежедневная заметка благодарности", unit: null },
  { name: "Sleep Hygiene", description: "Ночной чек-лист гигиены сна", unit: null },
  { name: "Distortion Quiz", description: "Баллы теста когнитивных искажений", unit: null },
  { name: "Thought Release", description: "Журнал ритуала отпускания мыслей", unit: null },
  { name: "Day Activities", description: "Занятия и события дня", unit: null },
];

export async function ensureDefaultParameters(): Promise<void> {
  const existing = await prisma.parameter.findMany({
    where: { name: { in: DEFAULT_PARAMETERS.map((p) => p.name) } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((p) => p.name));
  const missing = DEFAULT_PARAMETERS.filter((p) => !existingNames.has(p.name));
  if (missing.length === 0) return;
  await prisma.parameter.createMany({ data: missing });
}

export const parameterService = {
  async list() {
    return prisma.parameter.findMany({ orderBy: { name: "asc" } });
  },
};
