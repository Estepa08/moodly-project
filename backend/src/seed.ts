if (process.env.NODE_ENV === "production" && process.env.PROD_SEED !== "1") {
  console.error("Seed script cannot run in production (set PROD_SEED=1 to override)");
  process.exit(1);
}

import bcrypt from "bcryptjs";
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
    petTypeReward: "kitty",
    skinReward: "kitty_skin",
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
  // SEED_CONTENT_ONLY=1: наполняет только справочники (тесты, параметры,
  // онбординг, достижения, КПТ-библиотеку) и НЕ трогает пользовательские
  // данные. Используется для прод-БД, где удалять пользователей нельзя.
  const contentOnly = process.env.SEED_CONTENT_ONLY === "1";

  if (contentOnly) {
    await prisma.achievement.deleteMany();
    await prisma.testScoreBand.deleteMany();
    await prisma.test.deleteMany();
    await prisma.parameter.deleteMany();
    await prisma.onboardingStory.deleteMany();
    await prisma.cbaExampleDistortion.deleteMany();
    await prisma.cbaExampleItem.deleteMany();
    await prisma.cbaExample.deleteMany();
    await prisma.cbaCommonItem.deleteMany();
  } else {
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
  }

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

  const now = new Date();
  const DAY = MS_PER_DAY;
  const daysAgo = (n: number, hour = 10, min = 0) => {
    const d = new Date(now.getTime() - n * DAY);
    d.setHours(hour, min, 0, 0);
    return d;
  };

  let demoUser!: { id: string };

  if (!contentOnly) {
    const hashed = await bcrypt.hash("demo123", 10);
    demoUser = await prisma.user.create({
      data: {
        email: "demo@moodly.app",
        password: hashed,
        name: "Demo User",
        emailVerified: true,
        ageConfirmed: true,
      },
    });

    // Опциональный админ: создаётся из env-переменных, чтобы его не терять
    // при перезапуске сида. Пример: ADMIN_EMAIL=step.evgeny@gmail.com ADMIN_PASSWORD=...
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const adminHashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL.toLowerCase() },
        update: { role: "admin", emailVerified: true },
        create: {
          email: process.env.ADMIN_EMAIL.toLowerCase(),
          password: adminHashed,
          name: "Admin",
          role: "admin",
          emailVerified: true,
          ageConfirmed: true,
        },
      });
    }

    const allTests = await prisma.test.findMany();
    const allParams = await prisma.parameter.findMany();

    const moodTest = allTests.find((t) => t.title === "Оценка эмоционального состояния")!;
    const wellbeingTest = allTests.find((t) => t.title === "Оценка самочувствия")!;
    const cd = allTests.find((t) => t.title === "Определение когнитивных искажений")!;

    const paramMap = new Map(allParams.map((p) => [p.name, p.id]));

    const dailyNumeric: Record<string, number[]> = {
      Anxiety: [
        7, 7, 6, 7, 6, 5, 6, 6, 5, 5, 6, 5, 4, 5, 5, 4, 4, 5, 4, 4, 5, 4, 3, 4, 4, 3, 3, 4, 3, 3,
      ],
      Sleep: [
        4, 5, 4, 5, 5, 6, 5, 5, 6, 6, 5, 6, 7, 6, 6, 7, 7, 6, 7, 7, 6, 7, 7, 8, 7, 7, 8, 8, 7, 8,
      ],
      Mood: [
        4, 4, 5, 4, 5, 5, 6, 5, 5, 6, 6, 6, 5, 6, 6, 7, 6, 6, 7, 7, 6, 7, 7, 7, 8, 7, 7, 8, 7, 8,
      ],
      Energy: [
        3, 3, 4, 3, 4, 4, 5, 4, 4, 5, 5, 5, 4, 5, 5, 6, 5, 5, 6, 6, 5, 6, 6, 6, 7, 6, 6, 7, 6, 7,
      ],
    };

    const entryData: {
      userId: string;
      parameterId: string;
      value: number;
      note?: string;
      createdAt: Date;
    }[] = [];

    for (let i = 0; i < 30; i++) {
      const date = daysAgo(30 - i, 10 + (i % 8), 0);
      for (const [name, values] of Object.entries(dailyNumeric)) {
        const paramId = paramMap.get(name);
        if (paramId) {
          entryData.push({
            userId: demoUser.id,
            parameterId: paramId,
            value: values[i],
            createdAt: date,
          });
        }
      }
    }

    const gratitudeNotes = [
      "Тёплый вечер с семьёй",
      "Удачная прогулка в парке",
      "Поддержка близкого друга",
      "Кофе на балконе утром",
      "Наконец-то выспался",
      "Помог коллеге с задачей",
      "Солнечное утро за окном",
      "Вкусный ужин дома",
      "Чувствую себя лучше с каждым днём",
    ];
    const gratitudeOffsets = [27, 24, 20, 16, 13, 9, 6, 3, 1];
    const gratitudeParamId = paramMap.get("Gratitude");
    for (let i = 0; i < gratitudeOffsets.length; i++) {
      if (gratitudeParamId) {
        entryData.push({
          userId: demoUser.id,
          parameterId: gratitudeParamId,
          value: 1,
          note: gratitudeNotes[i],
          createdAt: daysAgo(gratitudeOffsets[i], 19 + (i % 3), 10),
        });
      }
    }

    const hygieneItems = [
      "noCaffeine",
      "noScreens",
      "consistentBedtime",
      "darkQuietCool",
      "noAlcohol",
      "dayActivity",
      "noLateMeal",
    ];
    const hygieneOffsets = Array.from({ length: 30 }, (_, i) => 30 - i).filter(
      (d) => d !== 5 && d !== 19,
    );
    const hygieneParamId = paramMap.get("Sleep Hygiene");
    for (const d of hygieneOffsets) {
      if (hygieneParamId) {
        const count = 4 + (d % 4);
        const picked = [...hygieneItems].sort(() => Math.random() - 0.5).slice(0, count);
        entryData.push({
          userId: demoUser.id,
          parameterId: hygieneParamId,
          value: count,
          note: picked.join(","),
          createdAt: daysAgo(d, 22, 15),
        });
      }
    }

    const quizParamId = paramMap.get("Distortion Quiz");
    const quizAttempts = [
      { days: 26, score: 3 },
      { days: 18, score: 4 },
      { days: 9, score: 5 },
      { days: 3, score: 6 },
    ];
    for (const attempt of quizAttempts) {
      if (quizParamId) {
        entryData.push({
          userId: demoUser.id,
          parameterId: quizParamId,
          value: attempt.score,
          note: `${attempt.score}/7`,
          createdAt: daysAgo(attempt.days, 12),
        });
      }
    }

    const thoughtReleases = [
      { days: 25, key: "allOrNothing" },
      { days: 20, key: "jumpingToConclusions" },
      { days: 15, key: "shouldStatements" },
      { days: 10, key: "overgeneralization" },
      { days: 5, key: "personalization" },
      { days: 2, key: "labeling" },
    ];
    const thoughtReleaseParamId = paramMap.get("Thought Release");
    for (const t of thoughtReleases) {
      if (thoughtReleaseParamId) {
        entryData.push({
          userId: demoUser.id,
          parameterId: thoughtReleaseParamId,
          value: 1,
          note: t.key,
          createdAt: daysAgo(t.days, 21),
        });
      }
    }

    await prisma.entry.createMany({ data: entryData });

    const completionXp: Record<string, number> = {
      breathing: 10,
      gratitude: 5,
      sleepHygiene: 5,
      distortions: 10,
      cba: 10,
      thoughtJournal: 5,
    };
    const CHECKIN_XP = 20;

    const schedule: { source: string; days: number[] }[] = [
      { source: "checkin", days: Array.from({ length: 30 }, (_, i) => i + 1) },
      { source: "breathing", days: [0, 2, 5, 8, 11, 14, 17, 20, 23, 26, 28, 29] },
      { source: "gratitude", days: [0, 1, 4, 7, 10, 13, 16, 19, 22, 25] },
      { source: "sleepHygiene", days: hygieneOffsets },
      { source: "distortions", days: [3, 9, 18, 26, 30] },
      { source: "cba", days: [2, 6, 10, 14, 18, 22, 25, 26, 29, 30] },
      { source: "thoughtJournal", days: [1, 5, 9, 13, 17, 21, 24, 27] },
    ];

    const sourceHour: Record<string, number> = {
      checkin: 8,
      breathing: 13,
      gratitude: 20,
      sleepHygiene: 22,
      distortions: 12,
      cba: 16,
      thoughtJournal: 21,
    };

    const completionData: {
      userId: string;
      source: string;
      xpAwarded: number;
      createdAt: Date;
    }[] = [];
    for (const { source, days } of schedule) {
      for (const d of days) {
        completionData.push({
          userId: demoUser.id,
          source,
          xpAwarded: source === "checkin" ? CHECKIN_XP : completionXp[source],
          createdAt: daysAgo(d, sourceHour[source] ?? 12, (d * 7) % 60),
        });
      }
    }

    const breathingDays = [0, 2, 5, 8, 11, 14, 17, 20, 23, 26, 28, 29];
    const sessionDurations = [180, 240, 300, 120, 360, 180, 420, 240, 300, 480, 180, 300];
    const sessionData: {
      userId: string;
      duration: number;
      initialCalmness: number;
      finalCalmness: number;
      completedAt: Date;
    }[] = [];
    let initialCalmness = 40;
    for (let i = 0; i < breathingDays.length; i++) {
      const duration = sessionDurations[i];
      const gain = Math.floor(duration / 6);
      sessionData.push({
        userId: demoUser.id,
        duration,
        initialCalmness,
        finalCalmness: Math.min(100, initialCalmness + gain),
        completedAt: daysAgo(breathingDays[i], 13, (i * 11) % 60),
      });
      initialCalmness = Math.min(58, initialCalmness + 1);
    }

    await prisma.practiceCompletion.createMany({ data: completionData });
    await prisma.breathingSession.createMany({ data: sessionData });

    await prisma.creatureState.create({
      data: {
        userId: demoUser.id,
        calmness: 64,
        energy: 85,
        level: 8,
        experience: 700,
        streak: 21,
        lastCheckInAt: daysAgo(1, 9),
        lastExerciseAt: daysAgo(2, 13),
        activeSkin: "calm_skin",
        unlockedSkins: ["default", "calm_skin", "kitty_skin"],
        activeTitle: "serenity_keeper",
        unlockedTitles: ["serenity_keeper", "spark"],
        petType: "kitty",
        unlockedPetTypes: ["puff", "kitty", "dewdrop", "sprout", "comet", "aurora"],
      },
    });

    await prisma.testResult.createMany({
      data: [
        {
          testId: moodTest.id,
          userId: demoUser.id,
          score: 26,
          interpretation: "Повышенный уровень напряжения",
          recommendation: "Попробуйте техники самопомощи.",
          completedAt: daysAgo(12),
        },
        {
          testId: moodTest.id,
          userId: demoUser.id,
          score: 22,
          interpretation: "Повышенный уровень напряжения",
          recommendation:
            "Практикуйте технику тройной колонки: запишите беспокойную мысль, назовите искажение, сформулируйте рациональный ответ. Дыхательные упражнения помогут в моменте.",
          completedAt: daysAgo(7),
        },
        {
          testId: moodTest.id,
          userId: demoUser.id,
          score: 18,
          interpretation: "Небольшое напряжение",
          recommendation: "Продолжайте практики самопомощи.",
          completedAt: daysAgo(2),
        },

        {
          testId: wellbeingTest.id,
          userId: demoUser.id,
          score: 36,
          interpretation: "Значительный спад настроения",
          recommendation: "Рекомендуется профессиональная поддержка.",
          completedAt: daysAgo(13),
        },
        {
          testId: wellbeingTest.id,
          userId: demoUser.id,
          score: 32,
          interpretation: "Значительный спад настроения",
          recommendation: "Рекомендуется профессиональная поддержка.",
          completedAt: daysAgo(8),
        },
        {
          testId: wellbeingTest.id,
          userId: demoUser.id,
          score: 28,
          interpretation: "Заметный спад настроения",
          recommendation:
            "Используйте технику тройной колонки и метод двойного стандарта: сказали бы вы это другу? При сохранении — обратитесь за поддержкой.",
          completedAt: daysAgo(3),
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
          completedAt: daysAgo(14),
        },
        {
          testId: cd.id,
          userId: demoUser.id,
          score: 50,
          interpretation:
            "Значительные искажения: «Долженствование» и «Обесценивание хорошего». Наблюдается небольшая положительная динамика.",
          recommendation:
            "Продолжайте работать с дневником мыслей и техникой тройной колонки. Умеренный прогресс уже заметен.",
          flags: {
            distortions: {
              allOrNothing: { score: 6, level: "high" },
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
          completedAt: daysAgo(5),
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
              allOrNothing: { score: 5, level: "high" },
              overgeneralization: { score: 3, level: "moderate" },
              mentalFilter: { score: 3, level: "moderate" },
              discountingPositive: { score: 6, level: "high" },
              jumpingToConclusions: { score: 4, level: "moderate" },
              magnification: { score: 2, level: "low" },
              emotionalReasoning: { score: 1, level: "low" },
              shouldStatements: { score: 8, level: "high" },
              labeling: { score: 1, level: "low" },
              personalization: { score: 4, level: "moderate" },
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
          completedAt: daysAgo(1),
        },
      ],
    });
  }

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

  if (!contentOnly) {
    const allAchievements = await prisma.achievement.findMany();
    const achievementByKey = new Map(allAchievements.map((a) => [a.key, a.id]));
    const unlockedKeys: [string, number][] = [
      ["first_checkin", 30],
      ["streak_7", 22],
      ["breathing_10", 15],
      ["all_practices", 12],
      ["xp_500", 10],
      ["level_5", 8],
      ["xp_1000", 5],
      ["completions_100", 2],
    ];
    await prisma.userAchievement.createMany({
      data: unlockedKeys
        .filter(([key]) => achievementByKey.has(key))
        .map(([key, days]) => ({
          userId: demoUser.id,
          achievementId: achievementByKey.get(key)!,
          unlockedAt: daysAgo(days, 15),
        })),
    });

    const cbaUserEntries: {
      thoughtText: string;
      prosWeight: number;
      consWeight: number;
      days: number;
      advantages: string[];
      disadvantages: string[];
    }[] = [
      {
        thoughtText: "Если я не успею подготовиться к встрече, это будет катастрофа",
        prosWeight: 30,
        consWeight: 70,
        days: 20,
        advantages: ["Заставлю себя выложиться на полную", "Лучше быть готовым, чем расслабленным"],
        disadvantages: [
          "Преследую недостижимый идеал",
          "Трачу силы на тревогу вместо работы",
          "Одна ошибка не делает встречу провалом",
          "Даже неидеальная подготовка лучше нулевой",
        ],
      },
      {
        thoughtText: "Я не справлюсь с новой задачей на проекте",
        prosWeight: 20,
        consWeight: 80,
        days: 16,
        advantages: ["Не буду разочарован, если не выйдет", "Меньше ответственности"],
        disadvantages: [
          "Не даю себе шанс попробовать",
          "Остаюсь в зоне комфорта и не расту",
          "Упускаю возможность научиться",
          "Уверенность не появится сама собой",
        ],
      },
      {
        thoughtText: "Коллеги заметят мою ошибку и будут плохо обо мне думать",
        prosWeight: 35,
        consWeight: 65,
        days: 11,
        advantages: ["Буду внимательнее", "Избегу смущения"],
        disadvantages: [
          "Все ошибаются, это нормально",
          "Не могу читать мысли других",
          "Скрывание ошибки только усугубляет её",
          "Ошибка — повод исправить, а не стыдиться",
        ],
      },
      {
        thoughtText: "Мне нужно делать всё идеально, иначе это не считается",
        prosWeight: 40,
        consWeight: 60,
        days: 7,
        advantages: ["Кажется, что результат будет лучше"],
        disadvantages: [
          "Идеала не существует",
          "Страх ошибки парализует",
          "Замедляюсь из-за перфекционизма",
          "Прогресс важнее совершенства",
        ],
      },
      {
        thoughtText: "Если я откажу другу, он обидится навсегда",
        prosWeight: 25,
        consWeight: 75,
        days: 4,
        advantages: ["Не хочу никого расстраивать"],
        disadvantages: [
          "У меня есть право на отказ",
          "Дружба крепче одной просьбы",
          "Отказ по делу уважают",
          "Не могу угодить всем всегда",
        ],
      },
      {
        thoughtText: "Я пропустил тренировку — значит, я ленивый и не изменюсь",
        prosWeight: 30,
        consWeight: 70,
        days: 1,
        advantages: ["Строгость к себе мотивирует"],
        disadvantages: [
          "Один пропуск — не характеристика",
          "Самокритика демотивирует",
          "Завтра новый день для тренировки",
          "Похвала прогрессу работает лучше ругани",
        ],
      },
    ];

    for (const e of cbaUserEntries) {
      await prisma.cbaEntry.create({
        data: {
          userId: demoUser.id,
          thoughtText: e.thoughtText,
          prosWeight: e.prosWeight,
          consWeight: e.consWeight,
          createdAt: daysAgo(e.days, 16 + (e.days % 4)),
          items: {
            create: [
              ...e.advantages.map((itemText) => ({ itemType: "advantage", itemText })),
              ...e.disadvantages.map((itemText) => ({ itemType: "disadvantage", itemText })),
            ],
          },
        },
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    await prisma.dailyMission.createMany({
      data: [
        {
          userId: demoUser.id,
          date: todayStart,
          missionKey: "practice_breathing",
          labelKey: "missions.practiceBreathing",
          xpReward: 10,
          claimed: true,
          sortOrder: 0,
        },
        {
          userId: demoUser.id,
          date: todayStart,
          missionKey: "practice_gratitude",
          labelKey: "missions.practiceGratitude",
          xpReward: 10,
          claimed: false,
          sortOrder: 1,
        },
        {
          userId: demoUser.id,
          date: todayStart,
          missionKey: "complete_3_practices",
          labelKey: "missions.complete3Practices",
          xpReward: 15,
          claimed: false,
          sortOrder: 2,
        },
      ],
    });

    await prisma.userPreference.create({
      data: {
        userId: demoUser.id,
        goals: ["stress", "anxiety"],
        experienceLevel: "intermediate",
        dailyReminder: true,
        reminderTime: "21:30",
        onboardingDone: true,
        showSupportResources: true,
      },
    });

    await prisma.feedback.createMany({
      data: [
        {
          userId: demoUser.id,
          message:
            "Приложение очень помогает следить за настроением. Больше всего нравится дыхательная практика!",
          createdAt: daysAgo(10, 12),
        },
        {
          userId: demoUser.id,
          message: "Хотелось бы больше разнообразия в ежедневных миссиях.",
          createdAt: daysAgo(3, 18),
        },
      ],
    });
  }

  console.log("Seed completed");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
