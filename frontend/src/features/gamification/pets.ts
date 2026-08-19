export const STARTER_PET_TYPES = ['puff', 'sloth', 'fox'] as const;

export const PET_EMOTIONS = ['happy', 'calm', 'anxious'] as const;
export type PetEmotion = 'idle' | (typeof PET_EMOTIONS)[number];

// Настроение питомца (petMood с сервера/клиента, см. computePetMood в useCreature.ts)
// → эмоция для подбора Lottie-анимации в usePetAnimation.
export function petMoodToEmotion(
  petMood: 'happy' | 'calm' | 'support' | null | undefined,
): PetEmotion {
  if (petMood === 'happy') return 'happy';
  if (petMood === 'support') return 'anxious';
  if (petMood === 'calm') return 'calm';
  return 'idle';
}

// F1: визуальный масштаб аватара по стадии эволюции (baby/kid/adult/max —
// см. stageForLevel() в @moodly/shared). Только визуальный слой — сама
// стадия приходит с сервера, здесь только CSS-представление.
export const STAGE_SCALE: Record<string, number> = {
  baby: 0.88,
  kid: 1,
  adult: 1.12,
  max: 1.28,
};

export interface PetDefinition {
  type: string;
  labelKey: string;
  color: string;
  emoji: string;
  feed: string[];
  animations?: Record<PetEmotion, (() => Promise<{ default: unknown }>)[]>;
}

type PetMeta = Pick<PetDefinition, 'labelKey' | 'color' | 'emoji' | 'feed'>;

const KNOWN_ORDER = [
  'puff',
  'sloth',
  'fox',
  'giraffe',
  'dove',
  'tiger',
  'turtle',
  'monkey',
  'bull',
  'koala',
  'cow',
  'robot',
  'robot2',
  'salad',
  'tucan',
  'liza',
  'nastya',
  'ksyusha',
  'marina',
  'alisa',
  'sofya',
  'vera',
  'nika',
  'mila',
  'lev',
  'mark',
  'timur',
  'girl',
  'girl2',
  'girl3',
  'rabbit',
  'monk',
  'man',
  'man2',
  'panda',
  'robot3',
];

const PET_META: Record<string, PetMeta> = {
  puff: { labelKey: 'pets.puff', color: 'bg-pet-1', emoji: '🦐', feed: ['🦐'] },
  sloth: { labelKey: 'pets.sloth', color: 'bg-pet-3', emoji: '🦥', feed: ['🍃'] },
  fox: { labelKey: 'pets.fox', color: 'bg-pet-4', emoji: '🦊', feed: ['🍓'] },
  giraffe: { labelKey: 'pets.giraffe', color: 'bg-pet-7', emoji: '🦒', feed: ['🌿'] },
  dove: { labelKey: 'pets.dove', color: 'bg-pet-8', emoji: '🕊️', feed: ['🌻'] },
  tiger: { labelKey: 'pets.tiger', color: 'bg-pet-9', emoji: '🐯', feed: ['🥩'] },
  turtle: { labelKey: 'pets.turtle', color: 'bg-pet-10', emoji: '🐢', feed: ['🍀'] },
  monkey: { labelKey: 'pets.monkey', color: 'bg-pet-2', emoji: '🐒', feed: ['🍌'] },
  bull: { labelKey: 'pets.bull', color: 'bg-pet-5', emoji: '🐂', feed: ['🌾'] },
  koala: { labelKey: 'pets.koala', color: 'bg-pet-6', emoji: '🐨', feed: ['🌱'] },
  cow: { labelKey: 'pets.cow', color: 'bg-pet-11', emoji: '🐮', feed: ['🌼'] },
  robot: { labelKey: 'pets.robot', color: 'bg-pet-14', emoji: '🤖', feed: ['⚙️'] },
  robot2: { labelKey: 'pets.robot2', color: 'bg-pet-12', emoji: '🦾', feed: ['🔩'] },
  salad: { labelKey: 'pets.salad', color: 'bg-pet-13', emoji: '🥗', feed: ['🥕'] },
  tucan: { labelKey: 'pets.tucan', color: 'bg-pet-15', emoji: '🐦', feed: ['🥭'] },
  liza: { labelKey: 'pets.liza', color: 'bg-pet-1', emoji: '👧', feed: ['🍎'] },
  nastya: { labelKey: 'pets.nastya', color: 'bg-pet-2', emoji: '🧒', feed: ['🍊'] },
  ksyusha: { labelKey: 'pets.ksyusha', color: 'bg-pet-3', emoji: '👧🏻', feed: ['🍇'] },
  marina: { labelKey: 'pets.marina', color: 'bg-pet-4', emoji: '👩', feed: ['🍉'] },
  alisa: { labelKey: 'pets.alisa', color: 'bg-pet-5', emoji: '👩🏻', feed: ['🍒'] },
  sofya: { labelKey: 'pets.sofya', color: 'bg-pet-6', emoji: '👩🏼', feed: ['🥝'] },
  vera: { labelKey: 'pets.vera', color: 'bg-pet-7', emoji: '👩🏽', feed: ['🍑'] },
  nika: { labelKey: 'pets.nika', color: 'bg-pet-8', emoji: '👩🏾', feed: ['🍍'] },
  mila: { labelKey: 'pets.mila', color: 'bg-pet-9', emoji: '👩🏿', feed: ['🍋'] },
  lev: { labelKey: 'pets.lev', color: 'bg-pet-10', emoji: '👨', feed: ['🥥'] },
  mark: { labelKey: 'pets.mark', color: 'bg-pet-11', emoji: '👨🏻', feed: ['🍈'] },
  timur: { labelKey: 'pets.timur', color: 'bg-pet-12', emoji: '👨🏼', feed: ['🍅'] },
  girl: { labelKey: 'pets.girl', color: 'bg-pet-13', emoji: '👩', feed: ['🍏'] },
  girl2: { labelKey: 'pets.girl2', color: 'bg-pet-14', emoji: '👩🏻', feed: ['🍌'] },
  girl3: { labelKey: 'pets.girl3', color: 'bg-pet-15', emoji: '👩🏼', feed: ['🍐'] },
  rabbit: { labelKey: 'pets.rabbit', color: 'bg-pet-1', emoji: '🐰', feed: ['🥕'] },
  monk: { labelKey: 'pets.monk', color: 'bg-pet-2', emoji: '🧘', feed: ['🍵'] },
  man: { labelKey: 'pets.man', color: 'bg-pet-3', emoji: '👨🏽', feed: ['🍈'] },
  man2: { labelKey: 'pets.man2', color: 'bg-pet-4', emoji: '👨🏾', feed: ['🥭'] },
  panda: { labelKey: 'pets.panda', color: 'bg-pet-5', emoji: '🐼', feed: ['🎋'] },
  robot3: { labelKey: 'pets.robot3', color: 'bg-pet-6', emoji: '🤖', feed: ['🔩'] },
};

// Папка питомца (русское имя) → латинский тип. Папки без записи
// используют имя папки как тип (и как отображаемое имя).
const FOLDER_TO_TYPE: Record<string, string> = {
  Ленивец: 'sloth',
  Лиса: 'fox',
  Жираф: 'giraffe',
  Голубь: 'dove',
  Тигр: 'tiger',
  Черепаха: 'turtle',
  Обезьянка: 'monkey',
  Бык: 'bull',
  Коала: 'koala',
  Корова: 'cow',
  Робот: 'robot',
  Робот2: 'robot2',
  Тукан: 'tucan',
  Девушка4: 'liza',
  Девушка5: 'nastya',
  Девушка6: 'ksyusha',
  Женщина7: 'marina',
  Женщина8: 'alisa',
  Женщина9: 'sofya',
  Женщина10: 'vera',
  Женщина11: 'nika',
  Женщина12: 'mila',
  Мужчина3: 'lev',
  Мужчина4: 'mark',
  Мужчина5: 'timur',
  Салат: 'salad',
  Девушка: 'girl',
  Девушка2: 'girl2',
  Девушка3: 'girl3',
  Кролик: 'rabbit',
  Монах: 'monk',
  Мужчина: 'man',
  Мужчина2: 'man2',
  Панда: 'panda',
  Робот3: 'robot3',
};

const AUTO_COLORS = [
  'bg-pet-1',
  'bg-pet-2',
  'bg-pet-3',
  'bg-pet-4',
  'bg-pet-5',
  'bg-pet-6',
  'bg-pet-7',
  'bg-pet-8',
  'bg-pet-9',
  'bg-pet-10',
  'bg-pet-11',
  'bg-pet-12',
  'bg-pet-13',
  'bg-pet-14',
  'bg-pet-15',
];

type PetLoader = () => Promise<{ default: unknown }>;
type PetFileEntry = { path: string; loader: PetLoader };

const PET_FILE_MODULES = import.meta.glob<{ default: unknown }>(
  '../../assets/lottie/pets/*/*.json',
);

const ALL_EMOTIONS: PetEmotion[] = ['idle', ...PET_EMOTIONS];

function emptyEmotionLists(): Record<PetEmotion, PetFileEntry[]> {
  return Object.fromEntries(
    ALL_EMOTIONS.map((e): [PetEmotion, PetFileEntry[]] => [e, []]),
  ) as Record<PetEmotion, PetFileEntry[]>;
}

// Имя файла → эмоция. `pet-sloth.json` / `pet-sloth-1.json` → idle;
// `pet-sloth-happy.json` → happy, `pet-fox-calm.json` → calm и т.д.
// Неизвестные суффиксы — idle.
function emotionFromFile(fileName: string): PetEmotion {
  const base = fileName.replace(/\.json$/i, '');
  const last = base.split('-').pop() ?? '';
  if (PET_EMOTIONS.includes(last as (typeof PET_EMOTIONS)[number])) {
    return last as PetEmotion;
  }
  return 'idle';
}

function collectPetFiles(): Map<string, Record<PetEmotion, PetFileEntry[]>> {
  const byType = new Map<string, Record<PetEmotion, PetFileEntry[]>>();
  for (const [path, loader] of Object.entries(PET_FILE_MODULES)) {
    const rel = path.split('/pets/').pop() ?? '';
    const [folder, fileName] = rel.split('/');
    if (!folder || !fileName) continue;
    const type = FOLDER_TO_TYPE[folder] ?? folder;
    const emotion = emotionFromFile(fileName);
    const lists = byType.get(type) ?? emptyEmotionLists();
    lists[emotion].push({ path, loader });
    byType.set(type, lists);
  }
  for (const lists of byType.values()) {
    for (const emotion of ALL_EMOTIONS) {
      lists[emotion].sort((a, b) => a.path.localeCompare(b.path));
    }
  }
  return byType;
}

function animationsFor(
  files: Map<string, Record<PetEmotion, PetFileEntry[]>>,
  type: string,
): Record<PetEmotion, PetLoader[]> {
  const lists = files.get(type);
  return Object.fromEntries(
    ALL_EMOTIONS.map((e) => [e, lists?.[e].map((f) => f.loader) ?? []]),
  ) as Record<PetEmotion, PetLoader[]>;
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
      animations: animationsFor(files, type),
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
      emoji: '🐾',
      feed: ['🫧'],
      animations: animationsFor(files, type),
    });
  });

  return definitions;
}

export const PET_DEFINITIONS: PetDefinition[] = buildPetDefinitions();

export function getPetAnimations(petType: string, emotion: PetEmotion = 'idle') {
  return PET_DEFINITIONS.find((p) => p.type === petType)?.animations?.[emotion] ?? [];
}

export function hasPetEmotion(petType: string, emotion: PetEmotion): boolean {
  return getPetAnimations(petType, emotion).length > 0;
}
