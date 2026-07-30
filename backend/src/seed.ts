if (process.env.NODE_ENV === "production") {
  console.error("Seed script cannot run in production");
  process.exit(1);
}

import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";
import { MS_PER_DAY } from "./lib/constants.js";

const parameters = [
  { name: "Anxiety", description: "Общий уровень тревоги", unit: "/10" },
  { name: "Sleep", description: "Качество сна", unit: "/10" },
  { name: "Mood", description: "Общее настроение", unit: "/10" },
  { name: "Energy", description: "Уровень энергии", unit: "/10" },
  { name: "Gratitude", description: "Ежедневная заметка благодарности", unit: null },
  { name: "Sleep Hygiene", description: "Ночной чек-лист гигиены сна", unit: null },
  { name: "Distortion Quiz", description: "Баллы теста когнитивных искажений", unit: null },
  { name: "Thought Release", description: "Журнал ритуала отпускания мыслей", unit: null },
  { name: "Thought Journal Mood", description: "Mood from daily thought journal", unit: null },
];

const baiOptions = [
  { id: "bai-o-0", text: "Нет", score: 0 },
  { id: "bai-o-1", text: "Слегка", score: 1 },
  { id: "bai-o-2", text: "Умеренно", score: 2 },
  { id: "bai-o-3", text: "Сильно", score: 3 },
];

const bdcOptions = [
  { id: "bdc-o-0", text: "Нет", score: 0 },
  { id: "bdc-o-1", text: "Слегка", score: 1 },
  { id: "bdc-o-2", text: "Умеренно", score: 2 },
  { id: "bdc-o-3", text: "Сильно", score: 3 },
  { id: "bdc-o-4", text: "Крайне сильно", score: 4 },
];

const tests = [
  {
    title: "Оценка эмоционального состояния",
    description:
      "Опросник для оценки эмоционального состояния и уровня напряжения. 33 пункта: чувства, мысли и физические ощущения.",
    type: "standard",
    questions: [
      { id: "bai-1", text: "Тревога, нервозность, беспокойство или страх", options: baiOptions },
      {
        id: "bai-2",
        text: "Ощущение, что происходящее вокруг странное, нереальное или туманное",
        options: baiOptions,
      },
      { id: "bai-3", text: "Ощущение отстранённости от всего или части тела", options: baiOptions },
      { id: "bai-4", text: "Внезапные неожиданные приступы паники", options: baiOptions },
      { id: "bai-5", text: "Опасение или чувство неминуемой беды", options: baiOptions },
      {
        id: "bai-6",
        text: "Чувство напряжённости, стресса или взвинченности",
        options: baiOptions,
      },
      { id: "bai-7", text: "Трудности с концентрацией внимания", options: baiOptions },
      {
        id: "bai-8",
        text: "Мысли скачут или разум перескакивает с одного на другое",
        options: baiOptions,
      },
      { id: "bai-9", text: "Пугающие фантазии или грёзы", options: baiOptions },
      {
        id: "bai-10",
        text: "Ощущение, что вы вот-вот потеряете контроль",
        options: baiOptions,
      },
      { id: "bai-11", text: "Страх сойти с ума или потерять рассудок", options: baiOptions },
      { id: "bai-12", text: "Страх обморока или потери сознания", options: baiOptions },
      {
        id: "bai-13",
        text: "Страх физической болезни, сердечного приступа или смерти",
        options: baiOptions,
      },
      {
        id: "bai-14",
        text: "Беспокойство о том, что вы выглядите глупо или неадекватно",
        options: baiOptions,
      },
      { id: "bai-15", text: "Страх одиночества, изоляции или быть покинутым", options: baiOptions },
      { id: "bai-16", text: "Страх критики или неодобрения", options: baiOptions },
      {
        id: "bai-17",
        text: "Страх, что должно случиться что-то ужасное",
        options: baiOptions,
      },
      {
        id: "bai-18",
        text: "Сердцебиение, учащённый пульс или перебои в сердце",
        options: baiOptions,
      },
      { id: "bai-19", text: "Боль, давление или сжатие в груди", options: baiOptions },
      { id: "bai-20", text: "Покалывание или онемение в пальцах рук или ног", options: baiOptions },
      { id: "bai-21", text: "Бабочки в животе или дискомфорт в желудке", options: baiOptions },
      { id: "bai-22", text: "Запор или диарея", options: baiOptions },
      { id: "bai-23", text: "Беспокойство или вздрагивание", options: baiOptions },
      { id: "bai-24", text: "Напряжённые, скованные мышцы", options: baiOptions },
      { id: "bai-25", text: "Потливость без физической причины", options: baiOptions },
      { id: "bai-26", text: "Ком в горле", options: baiOptions },
      { id: "bai-27", text: "Дрожь или тремор", options: baiOptions },
      { id: "bai-28", text: "Ватные ноги", options: baiOptions },
      {
        id: "bai-29",
        text: "Головокружение, дурнота или нарушение равновесия",
        options: baiOptions,
      },
      {
        id: "bai-30",
        text: "Ощущение удушья или затруднённое дыхание",
        options: baiOptions,
      },
      { id: "bai-31", text: "Головные боли или боли в шее и спине", options: baiOptions },
      { id: "bai-32", text: "Приливы жара или озноб", options: baiOptions },
      {
        id: "bai-33",
        text: "Чувство усталости, слабости или быстрой истощаемости",
        options: baiOptions,
      },
    ],
  },
  {
    title: "Оценка самочувствия",
    description:
      "Опросник для оценки общего самочувствия и эмоционального фона. 22 пункта: мысли, активность и физические ощущения.",
    type: "standard",
    questions: [
      { id: "bdc-1", text: "Грусть или уныние", options: bdcOptions },
      { id: "bdc-2", text: "Чувство несчастья или тоски", options: bdcOptions },
      { id: "bdc-3", text: "Приступы плача или слезливость", options: bdcOptions },
      { id: "bdc-4", text: "Чувство разочарования", options: bdcOptions },
      { id: "bdc-5", text: "Чувство безнадёжности", options: bdcOptions },
      { id: "bdc-6", text: "Низкая самооценка", options: bdcOptions },
      { id: "bdc-7", text: "Чувство никчёмности или неполноценности", options: bdcOptions },
      { id: "bdc-8", text: "Чувство вины или стыда", options: bdcOptions },
      { id: "bdc-9", text: "Самокритика или самообвинение", options: bdcOptions },
      { id: "bdc-10", text: "Трудности с принятием решений", options: bdcOptions },
      {
        id: "bdc-11",
        text: "Потеря интереса к семье, друзьям или коллегам",
        options: bdcOptions,
      },
      { id: "bdc-12", text: "Одиночество", options: bdcOptions },
      { id: "bdc-13", text: "Меньше времени с семьёй или друзьями", options: bdcOptions },
      { id: "bdc-14", text: "Потеря мотивации", options: bdcOptions },
      { id: "bdc-15", text: "Потеря интереса к работе или другим занятиям", options: bdcOptions },
      { id: "bdc-16", text: "Избегание работы или других занятий", options: bdcOptions },
      {
        id: "bdc-17",
        text: "Потеря удовольствия или удовлетворения от жизни",
        options: bdcOptions,
      },
      { id: "bdc-18", text: "Чувство усталости", options: bdcOptions },
      { id: "bdc-19", text: "Проблемы со сном или сонливость", options: bdcOptions },
      { id: "bdc-20", text: "Снижение или повышение аппетита", options: bdcOptions },
      { id: "bdc-21", text: "Потеря интереса к сексу", options: bdcOptions },
      { id: "bdc-22", text: "Беспокойство о своём здоровье", options: bdcOptions },
    ],
  },
  {
    title: "Определение когнитивных искажений",
    description:
      "Определяет, какие из 10 когнитивных искажений (по Дэвиду Бернсу) наиболее выражены в вашем мышлении. 30 вопросов по всем типам искажений.",
    type: "computed",
    questions: [
      {
        id: "cd-1-1",
        text: "Если я не идеален в чём-то, я считаю это полным провалом",
        options: baiOptions,
      },
      {
        id: "cd-1-2",
        text: "Всё в моей жизни либо хорошо, либо плохо — без середины",
        options: baiOptions,
      },
      {
        id: "cd-1-3",
        text: "Одна маленькая ошибка перечёркивает все мои усилия",
        options: baiOptions,
      },
      {
        id: "cd-2-1",
        text: "После одной неудачи я ожидаю, что то же самое будет повторяться снова и снова",
        options: baiOptions,
      },
      {
        id: "cd-2-2",
        text: "Я использую слова «всегда» и «никогда», думая о негативных событиях",
        options: baiOptions,
      },
      {
        id: "cd-2-3",
        text: "Одного негативного опыта достаточно, чтобы я поверил в закономерность",
        options: baiOptions,
      },
      {
        id: "cd-3-1",
        text: "Я фокусируюсь на одной негативной детали, и она окрашивает всё моё восприятие ситуации",
        options: baiOptions,
      },
      {
        id: "cd-3-2",
        text: "Даже когда многое идёт хорошо, я зацикливаюсь на том, что пошло не так",
        options: baiOptions,
      },
      {
        id: "cd-3-3",
        text: "Мне трудно видеть позитив, если есть хоть что-то негативное",
        options: baiOptions,
      },
      {
        id: "cd-4-1",
        text: "Когда у меня что-то получается, я говорю себе, что это неважно",
        options: baiOptions,
      },
      {
        id: "cd-4-2",
        text: "Я отвергаю комплименты и положительную обратную связь",
        options: baiOptions,
      },
      {
        id: "cd-4-3",
        text: "Я считаю, что мои достижения не в счёт, потому что кто угодно мог бы их сделать",
        options: baiOptions,
      },
      {
        id: "cd-5-1",
        text: "Я предполагаю, что люди реагируют на меня негативно, не проверяя этого",
        options: baiOptions,
      },
      {
        id: "cd-5-2",
        text: "Я предсказываю, что всё будет плохо, ещё до того, как попробую",
        options: baiOptions,
      },
      {
        id: "cd-5-3",
        text: "Мне кажется, я читаю мысли людей и знаю, что они плохо обо мне думают",
        options: baiOptions,
      },
      {
        id: "cd-6-1",
        text: "Я раздуваю маленькие проблемы до огромных масштабов",
        options: baiOptions,
      },
      {
        id: "cd-6-2",
        text: "Я преуменьшаю свои сильные стороны и достижения",
        options: baiOptions,
      },
      {
        id: "cd-6-3",
        text: "Когда что-то идёт не так, это ощущается как катастрофа",
        options: baiOptions,
      },
      {
        id: "cd-7-1",
        text: "Я считаю свои чувства фактами — если я так чувствую, значит, так и есть",
        options: baiOptions,
      },
      {
        id: "cd-7-2",
        text: "Я доверяю своим негативным эмоциям как точному руководству к реальности",
        options: baiOptions,
      },
      {
        id: "cd-7-3",
        text: "Если я чувствую себя неполноценным, я предполагаю, что так и есть",
        options: baiOptions,
      },
      {
        id: "cd-8-1",
        text: "Я часто говорю себе, что я «должен» делать больше или быть лучше",
        options: baiOptions,
      },
      {
        id: "cd-8-2",
        text: "Я критикую себя с помощью «должен», «обязан» и «нужно»",
        options: baiOptions,
      },
      {
        id: "cd-8-3",
        text: "Я чувствую вину, когда не соответствую своим невозможным стандартам",
        options: baiOptions,
      },
      {
        id: "cd-9-1",
        text: "Когда я совершаю ошибку, я называю себя обидными словами",
        options: baiOptions,
      },
      {
        id: "cd-9-2",
        text: "Я определяю себя своими недостатками, а не конкретным поведением",
        options: baiOptions,
      },
      {
        id: "cd-9-3",
        text: "Я навешиваю ярлыки на других людей на основе одного их действия",
        options: baiOptions,
      },
      {
        id: "cd-10-1",
        text: "Я виню себя за то, что на самом деле не является моей виной",
        options: baiOptions,
      },
      {
        id: "cd-10-2",
        text: "Я чувствую ответственность за чувства и реакции других людей",
        options: baiOptions,
      },
      {
        id: "cd-10-3",
        text: "Я принимаю всё на свой счёт, даже если это не обо мне",
        options: baiOptions,
      },
    ],
  },
];

const scoreBandsByTitle: Record<
  string,
  { maxScore: number; key: string; interpretation: string; recommendation: string }[]
> = {
  "Оценка эмоционального состояния": [
    {
      maxScore: 4,
      key: "low",
      interpretation: "Спокойное состояние",
      recommendation: "Продолжайте наблюдение. Дневник настроения поможет замечать закономерности.",
    },
    {
      maxScore: 10,
      key: "mild",
      interpretation: "Небольшое напряжение",
      recommendation: "Попробуйте дыхательные упражнения или короткую прогулку.",
    },
    {
      maxScore: 20,
      key: "moderate",
      interpretation: "Повышенный уровень напряжения",
      recommendation: "Попробуйте технику тройной колонки или дневник мыслей.",
    },
    {
      maxScore: 30,
      key: "elevated",
      interpretation: "Значительное напряжение",
      recommendation:
        "Рекомендуем практики релаксации. Если состояние сохраняется — обратитесь к близким или специалисту.",
    },
    {
      maxScore: 999,
      key: "high",
      interpretation: "Высокий уровень напряжения",
      recommendation:
        "Рекомендуется обратиться за поддержкой к близким или профессиональному консультанту.",
    },
  ],
  "Оценка самочувствия": [
    {
      maxScore: 5,
      key: "good",
      interpretation: "Хорошее самочувствие",
      recommendation:
        "Продолжайте заботиться о себе. Дневник благодарности помогает укрепить позитивный настрой.",
    },
    {
      maxScore: 10,
      key: "mild",
      interpretation: "Небольшой спад настроения",
      recommendation: "Попробуйте поведенческую активацию — запланируйте приятное занятие.",
    },
    {
      maxScore: 25,
      key: "moderate",
      interpretation: "Заметный спад настроения",
      recommendation:
        "Практикуйте технику тройной колонки. При сохранении — обратитесь за поддержкой.",
    },
    {
      maxScore: 50,
      key: "elevated",
      interpretation: "Значительный спад настроения",
      recommendation: "Рекомендуется профессиональная поддержка. Вы не одни.",
    },
    {
      maxScore: 999,
      key: "high",
      interpretation: "Сильный спад настроения",
      recommendation: "Рекомендуется обратиться к консультанту или психотерапевту.",
    },
  ],
};

const onboardingStories = [
  {
    title: "Добро пожаловать в Moodly",
    content:
      "Отслеживайте настроение ежедневно. Отмечайте своё самочувствие, энергию, сон и другое всего за пару касаний.",
    order: 1,
  },
  {
    title: "Проходите тесты",
    content:
      "Заполняйте опросники, чтобы лучше понять своё состояние и получить мягкие рекомендации.",
    order: 2,
  },
  {
    title: "Создавайте отчёты",
    content:
      "Экспортируйте данные в PDF или CSV, чтобы проанализировать динамику или поделиться с теми, кому доверяете.",
    order: 3,
  },
];

const achievements = [
  {
    key: "first_checkin",
    category: "general",
    titleKey: "achievements.firstCheckin",
    descKey: "achievements.firstCheckinDesc",
    iconName: "sun",
    xpReward: 10,
    criteria: { type: "total_completions", value: 1 },
    sortOrder: 1,
  },
  {
    key: "streak_7",
    category: "streak",
    titleKey: "achievements.streak7",
    descKey: "achievements.streak7Desc",
    iconName: "flame",
    xpReward: 30,
    titleReward: "serenity_keeper",
    criteria: { type: "streak", value: 7 },
    sortOrder: 10,
  },
  {
    key: "streak_30",
    category: "streak",
    titleKey: "achievements.streak30",
    descKey: "achievements.streak30Desc",
    iconName: "flame",
    xpReward: 100,
    titleReward: "guardian",
    criteria: { type: "streak", value: 30 },
    sortOrder: 11,
  },
  {
    key: "level_5",
    category: "level",
    titleKey: "achievements.level5",
    descKey: "achievements.level5Desc",
    iconName: "target",
    xpReward: 50,
    petTypeReward: "ember",
    skinReward: "ember_skin",
    criteria: { type: "level", value: 5 },
    sortOrder: 20,
  },
  {
    key: "level_10",
    category: "level",
    titleKey: "achievements.level10",
    descKey: "achievements.level10Desc",
    iconName: "target",
    xpReward: 100,
    petTypeReward: "dewdrop",
    titleReward: "sage",
    criteria: { type: "level", value: 10 },
    sortOrder: 21,
  },
  {
    key: "level_15",
    category: "level",
    titleKey: "achievements.level15",
    descKey: "achievements.level15Desc",
    iconName: "target",
    xpReward: 150,
    petTypeReward: "sprout",
    criteria: { type: "level", value: 15 },
    sortOrder: 22,
  },
  {
    key: "level_20",
    category: "level",
    titleKey: "achievements.level20",
    descKey: "achievements.level20Desc",
    iconName: "target",
    xpReward: 200,
    petTypeReward: "comet",
    titleReward: "warrior",
    criteria: { type: "level", value: 20 },
    sortOrder: 23,
  },
  {
    key: "level_30",
    category: "level",
    titleKey: "achievements.level30",
    descKey: "achievements.level30Desc",
    iconName: "target",
    xpReward: 300,
    petTypeReward: "aurora",
    titleReward: "seeker",
    criteria: { type: "level", value: 30 },
    sortOrder: 24,
  },
  {
    key: "breathing_10",
    category: "breathing",
    titleKey: "achievements.breathing10",
    descKey: "achievements.breathing10Desc",
    iconName: "heart",
    xpReward: 30,
    skinReward: "calm_skin",
    criteria: { type: "breathing_count", value: 10 },
    sortOrder: 30,
  },
  {
    key: "breathing_50",
    category: "breathing",
    titleKey: "achievements.breathing50",
    descKey: "achievements.breathing50Desc",
    iconName: "heart",
    xpReward: 80,
    skinReward: "zen_skin",
    criteria: { type: "breathing_count", value: 50 },
    sortOrder: 31,
  },
  {
    key: "all_practices",
    category: "practices",
    titleKey: "achievements.allPractices",
    descKey: "achievements.allPracticesDesc",
    iconName: "brain",
    xpReward: 50,
    titleReward: "spark",
    criteria: { type: "all_practices", value: 6 },
    sortOrder: 40,
  },
  {
    key: "xp_500",
    category: "general",
    titleKey: "achievements.xp500",
    descKey: "achievements.xp500Desc",
    iconName: "star",
    xpReward: 50,
    criteria: { type: "total_xp", value: 500 },
    sortOrder: 50,
  },
  {
    key: "xp_1000",
    category: "general",
    titleKey: "achievements.xp1000",
    descKey: "achievements.xp1000Desc",
    iconName: "star",
    xpReward: 100,
    criteria: { type: "total_xp", value: 1000 },
    sortOrder: 51,
  },
  {
    key: "completions_100",
    category: "practices",
    titleKey: "achievements.completions100",
    descKey: "achievements.completions100Desc",
    iconName: "brain",
    xpReward: 100,
    criteria: { type: "total_completions", value: 100 },
    sortOrder: 60,
  },
];

async function seed() {
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.dailyMission.deleteMany();
  await prisma.testScoreBand.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.breathingSession.deleteMany();
  await prisma.creatureState.deleteMany();
  await prisma.cbaEntryItem.deleteMany();
  await prisma.cbaEntry.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.resetToken.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.practiceCompletion.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.user.deleteMany();
  await prisma.test.deleteMany();
  await prisma.parameter.deleteMany();
  await prisma.onboardingStory.deleteMany();
  await prisma.cbaExampleDistortion.deleteMany();
  await prisma.cbaExampleItem.deleteMany();
  await prisma.cbaExample.deleteMany();
  await prisma.cbaCommonItem.deleteMany();

  for (const p of parameters) {
    await prisma.parameter.create({ data: p });
  }

  for (const t of tests) {
    const createdTest = await prisma.test.create({ data: t as never });
    const bands = scoreBandsByTitle[t.title];
    if (bands) {
      await prisma.testScoreBand.createMany({
        data: bands.map((b) => ({ ...b, testId: createdTest.id })),
      });
    }
  }

  for (const s of onboardingStories) {
    await prisma.onboardingStory.create({ data: s });
  }

  await prisma.achievement.createMany({ data: achievements as never });

  const hashed = await bcrypt.hash("demo123", 10);
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@moodly.app",
      password: hashed,
      name: "Demo User",
    },
  });

  const allTests = await prisma.test.findMany();
  const allParams = await prisma.parameter.findMany();

  const moodTest = allTests.find((t) => t.title === "Оценка эмоционального состояния")!;
  const wellbeingTest = allTests.find((t) => t.title === "Оценка самочувствия")!;
  const cd = allTests.find((t) => t.title === "Определение когнитивных искажений")!;

  const paramMap = new Map(allParams.map((p) => [p.name, p.id]));

  const now = new Date();
  const DAY = MS_PER_DAY;

  const dailyValues: Record<string, number[]> = {
    Anxiety: [7, 6, 8, 5, 4, 6, 3, 5, 7, 6, 4, 3, 5, 4],
    Sleep: [4, 5, 3, 6, 7, 5, 8, 6, 4, 5, 7, 8, 6, 7],
    Mood: [5, 4, 3, 6, 5, 7, 8, 6, 4, 5, 7, 8, 6, 7],
    Energy: [3, 4, 2, 5, 6, 4, 7, 5, 3, 4, 6, 7, 5, 6],
  };

  const entryData: { userId: string; parameterId: string; value: number; createdAt: Date }[] = [];
  for (let day = 0; day < 14; day++) {
    const date = new Date(now.getTime() - (13 - day) * DAY);
    date.setHours(10 + (day % 12), 0, 0, 0);
    for (const [name, values] of Object.entries(dailyValues)) {
      const paramId = paramMap.get(name);
      if (paramId) {
        entryData.push({
          userId: demoUser.id,
          parameterId: paramId,
          value: values[day],
          createdAt: date,
        });
      }
    }
  }
  await prisma.entry.createMany({ data: entryData });

  await prisma.creatureState.upsert({
    where: { userId: demoUser.id },
    create: { userId: demoUser.id, calmness: 45, lastExerciseAt: null },
    update: {},
  });

  await prisma.testResult.createMany({
    data: [
      {
        testId: moodTest.id,
        userId: demoUser.id,
        score: 26,
        interpretation: "Повышенный уровень напряжения",
        recommendation: "Попробуйте техники самопомощи.",
        completedAt: new Date(now.getTime() - 12 * DAY),
      },
      {
        testId: moodTest.id,
        userId: demoUser.id,
        score: 22,
        interpretation: "Повышенный уровень напряжения",
        recommendation:
          "Практикуйте технику тройной колонки: запишите беспокойную мысль, назовите искажение, сформулируйте рациональный ответ. Дыхательные упражнения помогут в моменте.",
        completedAt: new Date(now.getTime() - 7 * DAY),
      },
      {
        testId: moodTest.id,
        userId: demoUser.id,
        score: 18,
        interpretation: "Небольшое напряжение",
        recommendation: "Продолжайте практики самопомощи.",
        completedAt: new Date(now.getTime() - 2 * DAY),
      },

      {
        testId: wellbeingTest.id,
        userId: demoUser.id,
        score: 36,
        interpretation: "Значительный спад настроения",
        recommendation: "Рекомендуется профессиональная поддержка.",
        completedAt: new Date(now.getTime() - 13 * DAY),
      },
      {
        testId: wellbeingTest.id,
        userId: demoUser.id,
        score: 32,
        interpretation: "Значительный спад настроения",
        recommendation: "Рекомендуется профессиональная поддержка.",
        completedAt: new Date(now.getTime() - 8 * DAY),
      },
      {
        testId: wellbeingTest.id,
        userId: demoUser.id,
        score: 28,
        interpretation: "Заметный спад настроения",
        recommendation:
          "Используйте технику тройной колонки и метод двойного стандарта: сказали бы вы это другу? При сохранении — обратитесь за поддержкой.",
        completedAt: new Date(now.getTime() - 3 * DAY),
      },

      {
        testId: cd.id,
        userId: demoUser.id,
        score: 58,
        interpretation:
          "Умеренные когнитивные искажения. Наиболее выражены «Всё или ничего» и «Долженствование».",
        recommendation:
          "Ваши результаты указывают на несколько когнитивных искажений. КПТ может быть эффективна.",
        flags: {
          distortions: {
            allOrNothing: { score: 8, level: "high" },
            overgeneralization: { score: 6, level: "high" },
            mentalFilter: { score: 5, level: "moderate" },
            discountingPositive: { score: 7, level: "high" },
            jumpingToConclusions: { score: 6, level: "high" },
            magnification: { score: 4, level: "moderate" },
            emotionalReasoning: { score: 3, level: "moderate" },
            shouldStatements: { score: 9, level: "high" },
            labeling: { score: 3, level: "moderate" },
            personalization: { score: 7, level: "high" },
          },
          templateKey: "severe",
          recommendationKey: "severe",
        },
        completedAt: new Date(now.getTime() - 14 * DAY),
      },
      {
        testId: cd.id,
        userId: demoUser.id,
        score: 45,
        interpretation:
          "Значительные искажения: «Всё или ничего», «Обесценивание хорошего», «Долженствование». Умеренные: «Сверхобобщение», «Мысленный фильтр», «Чтение мыслей», «Персонализация».",
        recommendation:
          "Ваши результаты указывают на несколько сильно выраженных когнитивных искажений. КПТ может быть эффективна.",
        flags: {
          distortions: {
            allOrNothing: { score: 7, level: "high" },
            overgeneralization: { score: 4, level: "moderate" },
            mentalFilter: { score: 4, level: "moderate" },
            discountingPositive: { score: 7, level: "high" },
            jumpingToConclusions: { score: 5, level: "moderate" },
            magnification: { score: 2, level: "low" },
            emotionalReasoning: { score: 1, level: "low" },
            shouldStatements: { score: 9, level: "high" },
            labeling: { score: 1, level: "low" },
            personalization: { score: 5, level: "moderate" },
          },
          templateKey: "severe",
          recommendationKey: "severe",
          highKeys: ["allOrNothing", "discountingPositive", "shouldStatements"],
          moderateKeys: [
            "overgeneralization",
            "mentalFilter",
            "jumpingToConclusions",
            "personalization",
          ],
        },
        completedAt: new Date(now.getTime() - 1 * DAY),
      },
    ],
  });

  const cbaExamples: {
    persona: string;
    thoughtText: string;
    prosWeight: number;
    consWeight: number;
    advantages: string[];
    disadvantages: string[];
    distortions: string[];
  }[] = [
    {
      persona: "Бухгалтер, боится идти на работу из-за тревоги",
      thoughtText:
        "Если пойду на работу, у меня случится паническая атака, и коллеги подумают, что я странная.",
      prosWeight: 25,
      consWeight: 75,
      advantages: [
        "Избегаю возможного смущения перед коллегами",
        "Чувствую себя безопаснее дома",
        "Не нужно сталкиваться с неопределённостью",
        "Могу отложить решение проблемы",
      ],
      disadvantages: [
        "Теряю рабочие дни и доход",
        "Чувствую изоляцию",
        "Не проверяю, правда ли это на самом деле",
        "Тревога только растёт от избегания",
        "Пропускаю важные рабочие моменты и общение с командой",
        "Со временем возвращаться на работу становится ещё страшнее",
      ],
      distortions: ["jumpingToConclusions"],
    },
    {
      persona: "Студент, откладывает подготовку к экзамену",
      thoughtText: "Я всё равно провалю экзамен, даже если буду готовиться.",
      prosWeight: 20,
      consWeight: 80,
      advantages: [
        "Не разочаруюсь, если действительно не сдам",
        "Меньше давления прямо сейчас",
        "Есть оправдание, если результат будет плохим",
      ],
      disadvantages: [
        "Не даю себе шанс подготовиться",
        "Напряжение растёт ближе к дате экзамена",
        "Своим бездействием реально повышаю риск провала",
        "Упускаю время, которое могло пойти на подготовку",
        "Формирую привычку сдаваться при первой тревоге",
      ],
      distortions: ["jumpingToConclusions", "allOrNothing"],
    },
    {
      persona: "Мама, винит себя за срывы на детей",
      thoughtText: "Я ужасная мать, раз иногда срываюсь.",
      prosWeight: 15,
      consWeight: 85,
      advantages: [
        "Кажется, что самокритика мотивирует стать лучше",
        "Ощущение контроля через строгость к себе",
      ],
      disadvantages: [
        "Чувство вины истощает, а не мотивирует",
        "Снижает уверенность в себе как в родителе",
        "Не даёт увидеть реальные способы улучшить ситуацию",
        "Портит настроение и влияет на общение с детьми в моменте",
        "Не учитывает все моменты, где я хорошая мама",
      ],
      distortions: ["labeling", "allOrNothing"],
    },
    {
      persona: "Менеджер, избегает сложного разговора с командой",
      thoughtText: "Если подниму эту тему, все разозлятся на меня.",
      prosWeight: 30,
      consWeight: 70,
      advantages: [
        "Избегаю конфликта прямо сейчас",
        "Сохраняю видимость спокойствия в команде",
        "Не рискую услышать неприятную реакцию",
      ],
      disadvantages: [
        "Проблема не решается и накапливается",
        "Команда теряет доверие к моей роли лидера",
        "Напряжение всё равно чувствуется, просто скрыто",
        "Другие могут решить проблему по-своему, не так, как нужно",
        "Откладывание делает будущий разговор ещё сложнее",
      ],
      distortions: ["jumpingToConclusions"],
    },
    {
      persona: "Пожилой мужчина, не хочет учиться пользоваться смартфоном",
      thoughtText: "Я слишком стар, чтобы разобраться в этом, только опозорюсь.",
      prosWeight: 20,
      consWeight: 80,
      advantages: ["Не чувствую себя неловко прямо сейчас", "Не нужно просить о помощи"],
      disadvantages: [
        "Не могу видеться с внуками по видеосвязи",
        "Завишу от других в простых вещах",
        "Чувствую себя более изолированным",
        "Упускаю возможность научиться чему-то новому",
        "Убеждение мешает даже попробовать",
      ],
      distortions: ["labeling", "jumpingToConclusions"],
    },
  ];

  for (const [index, example] of cbaExamples.entries()) {
    await prisma.cbaExample.create({
      data: {
        persona: example.persona,
        thoughtText: example.thoughtText,
        prosWeight: example.prosWeight,
        consWeight: example.consWeight,
        order: index + 1,
        items: {
          create: [
            ...example.advantages.map((itemText) => ({ itemType: "advantage", itemText })),
            ...example.disadvantages.map((itemText) => ({ itemType: "disadvantage", itemText })),
          ],
        },
        distortions: {
          create: example.distortions.map((distortionKey) => ({ distortionKey })),
        },
      },
    });
  }

  await prisma.cbaCommonItem.createMany({
    data: [
      { itemType: "advantage", itemText: "Избегаю неловкости/смущения прямо сейчас" },
      { itemType: "advantage", itemText: "Чувствую себя безопаснее" },
      { itemType: "advantage", itemText: "Не нужно ничего менять" },
      { itemType: "advantage", itemText: "Защищаю себя от возможного разочарования" },
      { itemType: "advantage", itemText: "Не рискую ошибиться" },
      { itemType: "disadvantage", itemText: "Теряю время/возможности" },
      { itemType: "disadvantage", itemText: "Чувствую себя хуже в долгосрочной перспективе" },
      { itemType: "disadvantage", itemText: "Не проверяю, правда ли это на самом деле" },
      { itemType: "disadvantage", itemText: "Мешает отношениям с близкими" },
      { itemType: "disadvantage", itemText: "Усиливает тревогу вместо того, чтобы её снизить" },
      { itemType: "disadvantage", itemText: "Не даёт двигаться к цели" },
    ],
  });

  console.log("Seed completed");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
