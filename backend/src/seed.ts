import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";

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
    title: "Оценка настроения",
    description: "Опросник для оценки настроения — скрининг депрессии",
    type: "standard",
    questions: [
      {
        id: "phq9-1",
        text: "Потеря интереса или удовольствия от дел",
        options: [
          { id: "phq9-1-0", text: "Совсем нет", score: 0 },
          { id: "phq9-1-1", text: "Несколько дней", score: 1 },
          { id: "phq9-1-2", text: "Более половины дней", score: 2 },
          { id: "phq9-1-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "phq9-2",
        text: "Подавленное настроение, депрессия или чувство безнадёжности",
        options: [
          { id: "phq9-2-0", text: "Совсем нет", score: 0 },
          { id: "phq9-2-1", text: "Несколько дней", score: 1 },
          { id: "phq9-2-2", text: "Более половины дней", score: 2 },
          { id: "phq9-2-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "phq9-3",
        text: "Проблемы со сном: трудности засыпания, прерывистый сон или сонливость",
        options: [
          { id: "phq9-3-0", text: "Совсем нет", score: 0 },
          { id: "phq9-3-1", text: "Несколько дней", score: 1 },
          { id: "phq9-3-2", text: "Более половины дней", score: 2 },
          { id: "phq9-3-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "phq9-4",
        text: "Утомляемость или упадок сил",
        options: [
          { id: "phq9-4-0", text: "Совсем нет", score: 0 },
          { id: "phq9-4-1", text: "Несколько дней", score: 1 },
          { id: "phq9-4-2", text: "Более половины дней", score: 2 },
          { id: "phq9-4-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "phq9-5",
        text: "Отсутствие аппетита или переедание",
        options: [
          { id: "phq9-5-0", text: "Совсем нет", score: 0 },
          { id: "phq9-5-1", text: "Несколько дней", score: 1 },
          { id: "phq9-5-2", text: "Более половины дней", score: 2 },
          { id: "phq9-5-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "phq9-6",
        text: "Негативное отношение к себе — чувство неудачи или что подвели себя или семью",
        options: [
          { id: "phq9-6-0", text: "Совсем нет", score: 0 },
          { id: "phq9-6-1", text: "Несколько дней", score: 1 },
          { id: "phq9-6-2", text: "Более половины дней", score: 2 },
          { id: "phq9-6-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "phq9-7",
        text: "Трудности с концентрацией внимания (например, при чтении газеты или просмотре телевизора)",
        options: [
          { id: "phq9-7-0", text: "Совсем нет", score: 0 },
          { id: "phq9-7-1", text: "Несколько дней", score: 1 },
          { id: "phq9-7-2", text: "Более половины дней", score: 2 },
          { id: "phq9-7-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "phq9-8",
        text: "Вы говорили или двигались так медленно, что это замечали другие? Или наоборот — были так возбуждены, что двигались гораздо больше обычного",
        options: [
          { id: "phq9-8-0", text: "Совсем нет", score: 0 },
          { id: "phq9-8-1", text: "Несколько дней", score: 1 },
          { id: "phq9-8-2", text: "Более половины дней", score: 2 },
          { id: "phq9-8-3", text: "Почти каждый день", score: 3 },
        ],
      },
    ],
  },
  {
    title: "Оценка уровня тревоги",
    description: "Оценка генерализованного тревожного расстройства",
    type: "standard",
    questions: [
      {
        id: "gad7-1",
        text: "Нервозность, тревожность, ощущение напряжённости",
        options: [
          { id: "gad7-1-0", text: "Совсем нет", score: 0 },
          { id: "gad7-1-1", text: "Несколько дней", score: 1 },
          { id: "gad7-1-2", text: "Более половины дней", score: 2 },
          { id: "gad7-1-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "gad7-2",
        text: "Неконтролируемое беспокойство",
        options: [
          { id: "gad7-2-0", text: "Совсем нет", score: 0 },
          { id: "gad7-2-1", text: "Несколько дней", score: 1 },
          { id: "gad7-2-2", text: "Более половины дней", score: 2 },
          { id: "gad7-2-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "gad7-3",
        text: "Чрезмерное беспокойство по разным поводам",
        options: [
          { id: "gad7-3-0", text: "Совсем нет", score: 0 },
          { id: "gad7-3-1", text: "Несколько дней", score: 1 },
          { id: "gad7-3-2", text: "Более половины дней", score: 2 },
          { id: "gad7-3-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "gad7-4",
        text: "Трудности с расслаблением",
        options: [
          { id: "gad7-4-0", text: "Совсем нет", score: 0 },
          { id: "gad7-4-1", text: "Несколько дней", score: 1 },
          { id: "gad7-4-2", text: "Более половины дней", score: 2 },
          { id: "gad7-4-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "gad7-5",
        text: "Такая беспокойность, что трудно усидеть на месте",
        options: [
          { id: "gad7-5-0", text: "Совсем нет", score: 0 },
          { id: "gad7-5-1", text: "Несколько дней", score: 1 },
          { id: "gad7-5-2", text: "Более половины дней", score: 2 },
          { id: "gad7-5-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "gad7-6",
        text: "Раздражительность или вспыльчивость",
        options: [
          { id: "gad7-6-0", text: "Совсем нет", score: 0 },
          { id: "gad7-6-1", text: "Несколько дней", score: 1 },
          { id: "gad7-6-2", text: "Более половины дней", score: 2 },
          { id: "gad7-6-3", text: "Почти каждый день", score: 3 },
        ],
      },
      {
        id: "gad7-7",
        text: "Чувство страха, будто может случиться что-то ужасное",
        options: [
          { id: "gad7-7-0", text: "Совсем нет", score: 0 },
          { id: "gad7-7-1", text: "Несколько дней", score: 1 },
          { id: "gad7-7-2", text: "Более половины дней", score: 2 },
          { id: "gad7-7-3", text: "Почти каждый день", score: 3 },
        ],
      },
    ],
  },
  {
    title: "Оценка тревоги по шкале Бернса",
    description:
      "Оценка тревоги по шкале Бернса. 33 пункта: тревожные чувства, мысли и физические симптомы.",
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
      { id: "bai-6", text: "Чувство напряжённости, стресса или взвинченности", options: baiOptions },
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
      { id: "bai-33", text: "Чувство усталости, слабости или быстрой истощаемости", options: baiOptions },
    ],
  },
  {
    title: "Оценка депрессии по шкале Бернса",
    description:
      "Оценка депрессии по шкале Бернса. 22 пункта: мысли, активность и физические симптомы.",
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
      { id: "bdc-17", text: "Потеря удовольствия или удовлетворения от жизни", options: bdcOptions },
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
  "Оценка настроения": [
    { maxScore: 4, key: "minimal", interpretation: "Минимальная депрессия", recommendation: "Действия не требуются. Продолжайте наблюдение." },
    { maxScore: 9, key: "mild", interpretation: "Лёгкая депрессия", recommendation: "Следите за симптомами. Помогут самопомощь, упражнения и гигиена сна." },
    { maxScore: 14, key: "moderate", interpretation: "Умеренная депрессия", recommendation: "Рекомендуется консультация терапевта. Может быть полезна терапия и/или медикаменты." },
    { maxScore: 19, key: "moderatelySevere", interpretation: "Умеренно тяжёлая депрессия", recommendation: "Рекомендуем обратиться к специалисту. Наиболее эффективно сочетание терапии и медикаментов." },
    { maxScore: 999, key: "severe", interpretation: "Тяжёлая депрессия", recommendation: "Настоятельно рекомендуем немедленно обратиться к специалисту. Требуется активное лечение." },
  ],
  "Оценка уровня тревоги": [
    { maxScore: 4, key: "minimal", interpretation: "Минимальная тревога", recommendation: "Действия не требуются. Продолжайте наблюдение." },
    { maxScore: 9, key: "mild", interpretation: "Лёгкая тревога", recommendation: "Следите за симптомами. Помогут техники самопомощи." },
    { maxScore: 14, key: "moderate", interpretation: "Умеренная тревога", recommendation: "Рекомендуется консультация терапевта. Терапия или консультирование могут быть полезны." },
    { maxScore: 999, key: "severe", interpretation: "Тяжёлая тревога", recommendation: "Рекомендуем обратиться к специалисту для оценки и лечения." },
  ],
  "Оценка тревоги по шкале Бернса": [
    { maxScore: 4, key: "minimal", interpretation: "Тревоги нет или минимальна", recommendation: "Действия не требуются. Ведите дневник настроения для закрепления результата." },
    { maxScore: 10, key: "borderline", interpretation: "Пограничная тревога", recommendation: "Попробуйте декатастрофизацию: запишите худший сценарий и оцените его реальную вероятность." },
    { maxScore: 20, key: "mild", interpretation: "Лёгкая тревога", recommendation: "Практикуйте технику тройной колонки. Дыхательные упражнения помогут в моменте. При сохранении — обратитесь к специалисту." },
    { maxScore: 30, key: "moderate", interpretation: "Умеренная тревога", recommendation: "Составьте список пугающих ситуаций и прорабатывайте их постепенно. Рекомендуется консультация специалиста." },
    { maxScore: 50, key: "severe", interpretation: "Тяжёлая тревога", recommendation: "Рекомендуется сочетать техники самопомощи с профессиональной поддержкой." },
    { maxScore: 999, key: "extreme", interpretation: "Крайняя тревога или паника", recommendation: "Настоятельно рекомендуется консультация специалиста." },
  ],
  "Оценка депрессии по шкале Бернса": [
    { maxScore: 5, key: "none", interpretation: "Депрессии нет", recommendation: "Депрессии не выявлено. Дневник настроения поможет замечать закономерности." },
    { maxScore: 10, key: "normalUnhappy", interpretation: "Нормально, но есть недовольство", recommendation: "Попробуйте анализ затрат и выгод повторяющегося негативного убеждения." },
    { maxScore: 25, key: "mild", interpretation: "Лёгкая депрессия", recommendation: "Используйте технику тройной колонки и метод двойного стандарта. При сохранении — рассмотрите терапию." },
    { maxScore: 50, key: "moderate", interpretation: "Умеренная депрессия", recommendation: "Добавьте поведенческую активацию. При сохранении симптомов обратитесь за поддержкой." },
    { maxScore: 75, key: "severe", interpretation: "Тяжёлая депрессия", recommendation: "Настоятельно рекомендуется профессиональная поддержка." },
    { maxScore: 999, key: "extreme", interpretation: "Крайняя депрессия", recommendation: "Настоятельно рекомендуется консультация специалиста." },
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
    content: "Экспортируйте данные в PDF или CSV, чтобы проанализировать динамику или поделиться с теми, кому доверяете.",
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
  await prisma.report.deleteMany();
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

  const phq9 = allTests.find((t) => t.title === "Оценка настроения")!;
  const gad7 = allTests.find((t) => t.title === "Оценка уровня тревоги")!;
  const bai = allTests.find((t) => t.title === "Оценка тревоги по шкале Бернса")!;
  const bdc = allTests.find((t) => t.title === "Оценка депрессии по шкале Бернса")!;
  const cd = allTests.find((t) => t.title === "Определение когнитивных искажений")!;

  const paramMap = new Map(allParams.map((p) => [p.name, p.id]));

  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;

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
        testId: gad7.id,
        userId: demoUser.id,
        score: 15,
        interpretation: "Умеренная тревога",
        recommendation: "Рекомендуется консультация терапевта.",
        completedAt: new Date(now.getTime() - 14 * DAY),
      },
      {
        testId: gad7.id,
        userId: demoUser.id,
        score: 13,
        interpretation: "Умеренная тревога",
        recommendation: "Рекомендуется консультация терапевта.",
        completedAt: new Date(now.getTime() - 10 * DAY),
      },
      {
        testId: gad7.id,
        userId: demoUser.id,
        score: 10,
        interpretation: "Лёгкая тревога",
        recommendation: "Следите за симптомами. Помогут техники самопомощи.",
        completedAt: new Date(now.getTime() - 5 * DAY),
      },
      {
        testId: gad7.id,
        userId: demoUser.id,
        score: 8,
        interpretation: "Лёгкая тревога",
        recommendation: "Продолжайте практики самопомощи.",
        completedAt: new Date(now.getTime() - 1 * DAY),
      },

      {
        testId: phq9.id,
        userId: demoUser.id,
        score: 17,
        interpretation: "Умеренно тяжёлая депрессия",
        recommendation: "Рекомендуем обратиться к специалисту. Наиболее эффективно сочетание терапии и медикаментов.",
        completedAt: new Date(now.getTime() - 14 * DAY),
      },
      {
        testId: phq9.id,
        userId: demoUser.id,
        score: 14,
        interpretation: "Умеренная депрессия",
        recommendation: "Рекомендуется консультация терапевта. Внимательно следите за симптомами.",
        completedAt: new Date(now.getTime() - 9 * DAY),
      },
      {
        testId: phq9.id,
        userId: demoUser.id,
        score: 11,
        interpretation: "Умеренная депрессия",
        recommendation: "Рекомендуется консультация терапевта. Внимательно следите за симптомами.",
        completedAt: new Date(now.getTime() - 4 * DAY),
      },
      {
        testId: phq9.id,
        userId: demoUser.id,
        score: 8,
        interpretation: "Лёгкая депрессия",
        recommendation: "Следите за симптомами. Помогут упражнения и самопомощь.",
        completedAt: new Date(now.getTime() - 1 * DAY),
      },

      {
        testId: bai.id,
        userId: demoUser.id,
        score: 26,
        interpretation: "Лёгкая тревога",
        recommendation: "Попробуйте техники самопомощи.",
        completedAt: new Date(now.getTime() - 12 * DAY),
      },
      {
        testId: bai.id,
        userId: demoUser.id,
        score: 22,
        interpretation: "Лёгкая тревога",
        recommendation:
          "Практикуйте технику тройной колонки: запишите тревожную мысль, назовите искажение, сформулируйте рациональный ответ. Дыхательные упражнения помогут в моменте.",
        completedAt: new Date(now.getTime() - 7 * DAY),
      },
      {
        testId: bai.id,
        userId: demoUser.id,
        score: 18,
        interpretation: "Лёгкая тревога",
        recommendation: "Продолжайте практики самопомощи.",
        completedAt: new Date(now.getTime() - 2 * DAY),
      },

      {
        testId: bdc.id,
        userId: demoUser.id,
        score: 36,
        interpretation: "Умеренная депрессия",
        recommendation: "Рекомендуется консультация специалиста.",
        completedAt: new Date(now.getTime() - 13 * DAY),
      },
      {
        testId: bdc.id,
        userId: demoUser.id,
        score: 32,
        interpretation: "Умеренная депрессия",
        recommendation: "Рекомендуется консультация специалиста.",
        completedAt: new Date(now.getTime() - 8 * DAY),
      },
      {
        testId: bdc.id,
        userId: demoUser.id,
        score: 28,
        interpretation: "Лёгкая депрессия",
        recommendation:
          "Используйте технику тройной колонки и метод двойного стандарта: сказали бы вы это другу? При сохранении — рассмотрите терапию.",
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
