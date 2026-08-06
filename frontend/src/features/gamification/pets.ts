export const STARTER_PET_TYPES = ["puff", "sloth", "fox"] as const;

export const PET_EMOTIONS = ["happy"] as const;
export type PetEmotion = "idle" | (typeof PET_EMOTIONS)[number];

export interface PetDefinition {
  type: string;
  labelKey: string;
  color: string;
  emoji: string;
  feed: string[];
  animations?: Record<PetEmotion, (() => Promise<{ default: unknown }>)[]>;
}

type PetMeta = Pick<PetDefinition, "labelKey" | "color" | "emoji" | "feed">;

const KNOWN_ORDER = [
  "puff",
  "sloth",
  "fox",
  "giraffe",
  "dove",
  "tiger",
  "turtle",
  "monkey",
  "bull",
  "koala",
  "cow",
  "robot",
  "robot2",
  "salad",
  "tucan",
  "liza",
  "nastya",
  "ksyusha",
  "marina",
  "alisa",
  "sofya",
  "vera",
  "nika",
  "mila",
  "lev",
  "mark",
  "timur",
];

const PET_META: Record<string, PetMeta> = {
  puff: { labelKey: "pets.puff", color: "bg-pet-1", emoji: "🦐", feed: ["🦐"] },
  sloth: { labelKey: "pets.sloth", color: "bg-pet-3", emoji: "🦥", feed: ["🍃"] },
  fox: { labelKey: "pets.fox", color: "bg-pet-4", emoji: "🦊", feed: ["🍓"] },
  giraffe: { labelKey: "pets.giraffe", color: "bg-pet-7", emoji: "🦒", feed: ["🌿"] },
  dove: { labelKey: "pets.dove", color: "bg-pet-8", emoji: "🕊️", feed: ["🌻"] },
  tiger: { labelKey: "pets.tiger", color: "bg-pet-9", emoji: "🐯", feed: ["🥩"] },
  turtle: { labelKey: "pets.turtle", color: "bg-pet-10", emoji: "🐢", feed: ["🍀"] },
  monkey: { labelKey: "pets.monkey", color: "bg-pet-2", emoji: "🐒", feed: ["🍌"] },
  bull: { labelKey: "pets.bull", color: "bg-pet-5", emoji: "🐂", feed: ["🌾"] },
  koala: { labelKey: "pets.koala", color: "bg-pet-6", emoji: "🐨", feed: ["🌱"] },
  cow: { labelKey: "pets.cow", color: "bg-pet-11", emoji: "🐮", feed: ["🌼"] },
  robot: { labelKey: "pets.robot", color: "bg-pet-14", emoji: "🤖", feed: ["⚙️"] },
  robot2: { labelKey: "pets.robot2", color: "bg-pet-12", emoji: "🦾", feed: ["🔩"] },
  salad: { labelKey: "pets.salad", color: "bg-pet-13", emoji: "🥗", feed: ["🥕"] },
  tucan: { labelKey: "pets.tucan", color: "bg-pet-15", emoji: "🐦", feed: ["🥭"] },
  liza: { labelKey: "pets.liza", color: "bg-pet-1", emoji: "👧", feed: ["🍎"] },
  nastya: { labelKey: "pets.nastya", color: "bg-pet-2", emoji: "🧒", feed: ["🍊"] },
  ksyusha: { labelKey: "pets.ksyusha", color: "bg-pet-3", emoji: "👧🏻", feed: ["🍇"] },
  marina: { labelKey: "pets.marina", color: "bg-pet-4", emoji: "👩", feed: ["🍉"] },
  alisa: { labelKey: "pets.alisa", color: "bg-pet-5", emoji: "👩🏻", feed: ["🍒"] },
  sofya: { labelKey: "pets.sofya", color: "bg-pet-6", emoji: "👩🏼", feed: ["🥝"] },
  vera: { labelKey: "pets.vera", color: "bg-pet-7", emoji: "👩🏽", feed: ["🍑"] },
  nika: { labelKey: "pets.nika", color: "bg-pet-8", emoji: "👩🏾", feed: ["🍍"] },
  mila: { labelKey: "pets.mila", color: "bg-pet-9", emoji: "👩🏿", feed: ["🍋"] },
  lev: { labelKey: "pets.lev", color: "bg-pet-10", emoji: "👨", feed: ["🥥"] },
  mark: { labelKey: "pets.mark", color: "bg-pet-11", emoji: "👨🏻", feed: ["🍈"] },
  timur: { labelKey: "pets.timur", color: "bg-pet-12", emoji: "👨🏼", feed: ["🍅"] },
};

// Папка питомца (русское имя) → латинский тип. Папки без записи
// используют имя папки как тип (и как отображаемое имя).
const FOLDER_TO_TYPE: Record<string, string> = {
  Ленивец: "sloth",
  Лиса: "fox",
  Жираф: "giraffe",
  Голубь: "dove",
  Тигр: "tiger",
  Черепаха: "turtle",
  Обезьянка: "monkey",
  Бык: "bull",
  Коала: "koala",
  Корова: "cow",
  Робот: "robot",
  Робот2: "robot2",
  Тукан: "tucan",
  Девушка4: "liza",
  Девушка5: "nastya",
  Девушка6: "ksyusha",
  Женщина7: "marina",
  Женщина8: "alisa",
  Женщина9: "sofya",
  Женщина10: "vera",
  Женщина11: "nika",
  Женщина12: "mila",
  Мужчина3: "lev",
  Мужчина4: "mark",
  Мужчина5: "timur",
};

const AUTO_COLORS = [
  "bg-pet-1",
  "bg-pet-2",
  "bg-pet-3",
  "bg-pet-4",
  "bg-pet-5",
  "bg-pet-6",
  "bg-pet-7",
  "bg-pet-8",
  "bg-pet-9",
  "bg-pet-10",
  "bg-pet-11",
  "bg-pet-12",
  "bg-pet-13",
  "bg-pet-14",
  "bg-pet-15",
];

type PetLoader = () => Promise<{ default: unknown }>;
type PetFileEntry = { path: string; loader: PetLoader };

const PET_FILE_MODULES = import.meta.glob<{ default: unknown }>(
  "../../assets/lottie/pets/*/*.json",
);

// Имя файла → эмоция. `pet-sloth.json` / `pet-sloth-1.json` → idle;
// `pet-sloth-happy.json` → happy. Неизвестные суффиксы — idle.
function emotionFromFile(fileName: string): PetEmotion {
  const base = fileName.replace(/\.json$/i, "");
  const last = base.split("-").pop() ?? "";
  if (PET_EMOTIONS.includes(last as (typeof PET_EMOTIONS)[number])) {
    return last as PetEmotion;
  }
  return "idle";
}

function collectPetFiles(): Map<string, Record<PetEmotion, PetFileEntry[]>> {
  const byType = new Map<string, Record<PetEmotion, PetFileEntry[]>>();
  for (const [path, loader] of Object.entries(PET_FILE_MODULES)) {
    const rel = path.split("/pets/").pop() ?? "";
    const [folder, fileName] = rel.split("/");
    if (!folder || !fileName) continue;
    const type = FOLDER_TO_TYPE[folder] ?? folder;
    const emotion = emotionFromFile(fileName);
    const lists = byType.get(type) ?? { idle: [], happy: [] };
    lists[emotion].push({ path, loader });
    byType.set(type, lists);
  }
  for (const lists of byType.values()) {
    lists.idle.sort((a, b) => a.path.localeCompare(b.path));
    lists.happy.sort((a, b) => a.path.localeCompare(b.path));
  }
  return byType;
}

function buildPetDefinitions(): PetDefinition[] {
  const files = collectPetFiles();
  const definitions: PetDefinition[] = [];
  const added = new Set<string>();

  for (const type of KNOWN_ORDER) {
    const meta = PET_META[type];
    if (!meta) continue;
    added.add(type);
    definitions.push({
      type,
      labelKey: meta.labelKey,
      color: meta.color,
      emoji: meta.emoji,
      feed: meta.feed,
      animations: {
        idle: files.get(type)?.idle.map((f) => f.loader) ?? [],
        happy: files.get(type)?.happy.map((f) => f.loader) ?? [],
      },
    });
  }

  const extra = [...files.keys()]
    .filter((type) => !added.has(type))
    .sort((a, b) => a.localeCompare(b));

  extra.forEach((type, index) => {
    definitions.push({
      type,
      labelKey: type,
      color: AUTO_COLORS[index % AUTO_COLORS.length],
      emoji: "🐾",
      feed: ["🫧"],
      animations: {
        idle: files.get(type)?.idle.map((f) => f.loader) ?? [],
        happy: files.get(type)?.happy.map((f) => f.loader) ?? [],
      },
    });
  });

  return definitions;
}

export const PET_DEFINITIONS: PetDefinition[] = buildPetDefinitions();

export function getPetAnimations(petType: string, emotion: PetEmotion = "idle") {
  return PET_DEFINITIONS.find((p) => p.type === petType)?.animations?.[emotion] ?? [];
}

export function hasPetEmotion(petType: string, emotion: PetEmotion): boolean {
  return getPetAnimations(petType, emotion).length > 0;
}
