import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";

const parameters = [
  { name: "Anxiety", description: "Overall anxiety level", unit: "/10" },
  { name: "Sleep", description: "Sleep quality", unit: "/10" },
  { name: "Mood", description: "General mood", unit: "/10" },
  { name: "Energy", description: "Energy level", unit: "/10" },
  { name: "Focus", description: "Ability to concentrate", unit: "/10" },
  { name: "Gratitude", description: "Daily gratitude note", unit: null },
  { name: "Sleep Hygiene", description: "Nightly sleep hygiene checklist", unit: null },
  { name: "Distortion Quiz", description: "Cognitive distortion quiz score", unit: null },
];

const baiOptions = [
  { id: "bai-o-0", text: "Not at all", score: 0 },
  { id: "bai-o-1", text: "Somewhat", score: 1 },
  { id: "bai-o-2", text: "Moderately", score: 2 },
  { id: "bai-o-3", text: "A lot", score: 3 },
];

const bdcOptions = [
  { id: "bdc-o-0", text: "Not at all", score: 0 },
  { id: "bdc-o-1", text: "Somewhat", score: 1 },
  { id: "bdc-o-2", text: "Moderately", score: 2 },
  { id: "bdc-o-3", text: "A lot", score: 3 },
  { id: "bdc-o-4", text: "Extremely", score: 4 },
];

const tests = [
  {
    title: "PHQ-9",
    description: "Patient Health Questionnaire — depression screening",
    questions: [
      {
        id: "phq9-1",
        text: "Little interest or pleasure in doing things",
        options: [
          { id: "phq9-1-0", text: "Not at all", score: 0 },
          { id: "phq9-1-1", text: "Several days", score: 1 },
          { id: "phq9-1-2", text: "More than half the days", score: 2 },
          { id: "phq9-1-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "phq9-2",
        text: "Feeling down, depressed, or hopeless",
        options: [
          { id: "phq9-2-0", text: "Not at all", score: 0 },
          { id: "phq9-2-1", text: "Several days", score: 1 },
          { id: "phq9-2-2", text: "More than half the days", score: 2 },
          { id: "phq9-2-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "phq9-3",
        text: "Trouble falling or staying asleep, or sleeping too much",
        options: [
          { id: "phq9-3-0", text: "Not at all", score: 0 },
          { id: "phq9-3-1", text: "Several days", score: 1 },
          { id: "phq9-3-2", text: "More than half the days", score: 2 },
          { id: "phq9-3-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "phq9-4",
        text: "Feeling tired or having little energy",
        options: [
          { id: "phq9-4-0", text: "Not at all", score: 0 },
          { id: "phq9-4-1", text: "Several days", score: 1 },
          { id: "phq9-4-2", text: "More than half the days", score: 2 },
          { id: "phq9-4-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "phq9-5",
        text: "Poor appetite or overeating",
        options: [
          { id: "phq9-5-0", text: "Not at all", score: 0 },
          { id: "phq9-5-1", text: "Several days", score: 1 },
          { id: "phq9-5-2", text: "More than half the days", score: 2 },
          { id: "phq9-5-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "phq9-6",
        text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
        options: [
          { id: "phq9-6-0", text: "Not at all", score: 0 },
          { id: "phq9-6-1", text: "Several days", score: 1 },
          { id: "phq9-6-2", text: "More than half the days", score: 2 },
          { id: "phq9-6-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "phq9-7",
        text: "Trouble concentrating on things, such as reading the newspaper or watching television",
        options: [
          { id: "phq9-7-0", text: "Not at all", score: 0 },
          { id: "phq9-7-1", text: "Several days", score: 1 },
          { id: "phq9-7-2", text: "More than half the days", score: 2 },
          { id: "phq9-7-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "phq9-8",
        text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
        options: [
          { id: "phq9-8-0", text: "Not at all", score: 0 },
          { id: "phq9-8-1", text: "Several days", score: 1 },
          { id: "phq9-8-2", text: "More than half the days", score: 2 },
          { id: "phq9-8-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "phq9-9",
        text: "Thoughts that you would be better off dead or of hurting yourself in some way",
        options: [
          { id: "phq9-9-0", text: "Not at all", score: 0 },
          { id: "phq9-9-1", text: "Several days", score: 1 },
          { id: "phq9-9-2", text: "More than half the days", score: 2 },
          { id: "phq9-9-3", text: "Nearly every day", score: 3 },
        ],
      },
    ],
  },
  {
    title: "GAD-7",
    description: "Generalized Anxiety Disorder Assessment",
    questions: [
      {
        id: "gad7-1",
        text: "Feeling nervous, anxious, or on edge",
        options: [
          { id: "gad7-1-0", text: "Not at all", score: 0 },
          { id: "gad7-1-1", text: "Several days", score: 1 },
          { id: "gad7-1-2", text: "More than half the days", score: 2 },
          { id: "gad7-1-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "gad7-2",
        text: "Not being able to stop or control worrying",
        options: [
          { id: "gad7-2-0", text: "Not at all", score: 0 },
          { id: "gad7-2-1", text: "Several days", score: 1 },
          { id: "gad7-2-2", text: "More than half the days", score: 2 },
          { id: "gad7-2-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "gad7-3",
        text: "Worrying too much about different things",
        options: [
          { id: "gad7-3-0", text: "Not at all", score: 0 },
          { id: "gad7-3-1", text: "Several days", score: 1 },
          { id: "gad7-3-2", text: "More than half the days", score: 2 },
          { id: "gad7-3-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "gad7-4",
        text: "Trouble relaxing",
        options: [
          { id: "gad7-4-0", text: "Not at all", score: 0 },
          { id: "gad7-4-1", text: "Several days", score: 1 },
          { id: "gad7-4-2", text: "More than half the days", score: 2 },
          { id: "gad7-4-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "gad7-5",
        text: "Being so restless that it is hard to sit still",
        options: [
          { id: "gad7-5-0", text: "Not at all", score: 0 },
          { id: "gad7-5-1", text: "Several days", score: 1 },
          { id: "gad7-5-2", text: "More than half the days", score: 2 },
          { id: "gad7-5-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "gad7-6",
        text: "Becoming easily annoyed or irritable",
        options: [
          { id: "gad7-6-0", text: "Not at all", score: 0 },
          { id: "gad7-6-1", text: "Several days", score: 1 },
          { id: "gad7-6-2", text: "More than half the days", score: 2 },
          { id: "gad7-6-3", text: "Nearly every day", score: 3 },
        ],
      },
      {
        id: "gad7-7",
        text: "Feeling afraid as if something awful might happen",
        options: [
          { id: "gad7-7-0", text: "Not at all", score: 0 },
          { id: "gad7-7-1", text: "Several days", score: 1 },
          { id: "gad7-7-2", text: "More than half the days", score: 2 },
          { id: "gad7-7-3", text: "Nearly every day", score: 3 },
        ],
      },
    ],
  },
  {
    title: "Burns Anxiety Inventory",
    description: "BAI — anxiety assessment by Dr. David Burns. 33 items across anxious feelings, thoughts, and physical symptoms.",
    questions: [
      { id: "bai-1", text: "Anxiety, nervousness, worry or fear", options: baiOptions },
      { id: "bai-2", text: "Feeling that things around you are strange, unreal or foggy", options: baiOptions },
      { id: "bai-3", text: "Feeling detached from all or part of your body", options: baiOptions },
      { id: "bai-4", text: "Sudden unexpected panic spells", options: baiOptions },
      { id: "bai-5", text: "Apprehension or a sense of impending doom", options: baiOptions },
      { id: "bai-6", text: "Feeling tense, stressed, uptight or on edge", options: baiOptions },
      { id: "bai-7", text: "Difficulty concentrating", options: baiOptions },
      { id: "bai-8", text: "Racing thoughts or mind jumping from one thing to the next", options: baiOptions },
      { id: "bai-9", text: "Frightening fantasies or daydreams", options: baiOptions },
      { id: "bai-10", text: "Feeling that you're on the verge of losing control", options: baiOptions },
      { id: "bai-11", text: "Fears of cracking up or going crazy", options: baiOptions },
      { id: "bai-12", text: "Fears of fainting or passing out", options: baiOptions },
      { id: "bai-13", text: "Fears of physical illness or heart attacks or dying", options: baiOptions },
      { id: "bai-14", text: "Concerns about looking foolish or inadequate in front of others", options: baiOptions },
      { id: "bai-15", text: "Fears of being alone, isolated, or abandoned", options: baiOptions },
      { id: "bai-16", text: "Fears of criticism or disapproval", options: baiOptions },
      { id: "bai-17", text: "Fears that something terrible is about to happen", options: baiOptions },
      { id: "bai-18", text: "Skipping, racing or pounding of the heart (palpitations)", options: baiOptions },
      { id: "bai-19", text: "Pain, pressure or tightness in the chest", options: baiOptions },
      { id: "bai-20", text: "Tingling or numbness in the toes or fingers", options: baiOptions },
      { id: "bai-21", text: "Butterflies or discomfort in the stomach", options: baiOptions },
      { id: "bai-22", text: "Constipation or diarrhea", options: baiOptions },
      { id: "bai-23", text: "Restlessness or jumpiness", options: baiOptions },
      { id: "bai-24", text: "Tight, tense muscles", options: baiOptions },
      { id: "bai-25", text: "Sweating not brought on by heat", options: baiOptions },
      { id: "bai-26", text: "A lump in the throat", options: baiOptions },
      { id: "bai-27", text: "Trembling or shaking", options: baiOptions },
      { id: "bai-28", text: "Rubbery or jelly legs", options: baiOptions },
      { id: "bai-29", text: "Feeling dizzy, lightheaded or off balance", options: baiOptions },
      { id: "bai-30", text: "Choking or smothering sensations or difficulty breathing", options: baiOptions },
      { id: "bai-31", text: "Headaches or pains in the neck or back", options: baiOptions },
      { id: "bai-32", text: "Hot flashes or cold chills", options: baiOptions },
      { id: "bai-33", text: "Feeling tired, weak, or easily exhausted", options: baiOptions },
    ],
  },
  {
    title: "Burns Depression Checklist",
    description: "BDC — depression assessment by Dr. David Burns. 25 items across thoughts, activities, physical symptoms, and suicidal urges.",
    questions: [
      { id: "bdc-1", text: "Feeling sad or down in the dumps", options: bdcOptions },
      { id: "bdc-2", text: "Feeling unhappy or blue", options: bdcOptions },
      { id: "bdc-3", text: "Crying spells or tearfulness", options: bdcOptions },
      { id: "bdc-4", text: "Feeling discouraged", options: bdcOptions },
      { id: "bdc-5", text: "Feeling hopeless", options: bdcOptions },
      { id: "bdc-6", text: "Low self-esteem", options: bdcOptions },
      { id: "bdc-7", text: "Feeling worthless or inadequate", options: bdcOptions },
      { id: "bdc-8", text: "Guilt or shame", options: bdcOptions },
      { id: "bdc-9", text: "Criticizing yourself or blaming yourself", options: bdcOptions },
      { id: "bdc-10", text: "Difficulty making decisions", options: bdcOptions },
      { id: "bdc-11", text: "Loss of interest in family, friends or colleagues", options: bdcOptions },
      { id: "bdc-12", text: "Loneliness", options: bdcOptions },
      { id: "bdc-13", text: "Spending less time with family or friends", options: bdcOptions },
      { id: "bdc-14", text: "Loss of motivation", options: bdcOptions },
      { id: "bdc-15", text: "Loss of interest in work or other activities", options: bdcOptions },
      { id: "bdc-16", text: "Avoiding work or other activities", options: bdcOptions },
      { id: "bdc-17", text: "Loss of pleasure or satisfaction in life", options: bdcOptions },
      { id: "bdc-18", text: "Feeling tired", options: bdcOptions },
      { id: "bdc-19", text: "Difficulty sleeping or sleeping too much", options: bdcOptions },
      { id: "bdc-20", text: "Decreased or increased appetite", options: bdcOptions },
      { id: "bdc-21", text: "Loss of interest in sex", options: bdcOptions },
      { id: "bdc-22", text: "Worrying about your health", options: bdcOptions },
      { id: "bdc-23", text: "Do you have any suicidal thoughts?", options: bdcOptions },
      { id: "bdc-24", text: "Would you like to end your life?", options: bdcOptions },
      { id: "bdc-25", text: "Do you have a plan for harming yourself?", options: bdcOptions },
    ],
  },
  {
    title: "Cognitive Distortions Assessment",
    description: "Identifies which of the 10 cognitive distortions (by Dr. David Burns) are most prevalent in your thinking patterns. 30 questions across all distortion types.",
    questions: [
      // 1. All-or-Nothing Thinking
      { id: "cd-1-1", text: "If I'm not perfect at something, I see it as a total failure", options: baiOptions },
      { id: "cd-1-2", text: "Things in my life are either all good or all bad — there's no middle ground", options: baiOptions },
      { id: "cd-1-3", text: "One small mistake ruins the entire effort for me", options: baiOptions },
      // 2. Overgeneralization
      { id: "cd-2-1", text: "After a single setback, I expect the same thing to happen again and again", options: baiOptions },
      { id: "cd-2-2", text: "I use words like 'always' and 'never' when thinking about negative events", options: baiOptions },
      { id: "cd-2-3", text: "One negative experience is enough for me to believe a pattern exists", options: baiOptions },
      // 3. Mental Filter
      { id: "cd-3-1", text: "I focus on one negative detail and let it color my entire view of a situation", options: baiOptions },
      { id: "cd-3-2", text: "Even when many things go well, I dwell on the one thing that went wrong", options: baiOptions },
      { id: "cd-3-3", text: "I have trouble seeing positives when there's any negative at all", options: baiOptions },
      // 4. Discounting the Positive
      { id: "cd-4-1", text: "When I do something well, I tell myself it was no big deal", options: baiOptions },
      { id: "cd-4-2", text: "I dismiss compliments or positive feedback from others", options: baiOptions },
      { id: "cd-4-3", text: "I believe my achievements don't count because anyone could have done them", options: baiOptions },
      // 5. Jumping to Conclusions
      { id: "cd-5-1", text: "I assume people are reacting negatively to me without checking", options: baiOptions },
      { id: "cd-5-2", text: "I predict things will turn out badly before I even try", options: baiOptions },
      { id: "cd-5-3", text: "I feel like I can read people's minds and know they think poorly of me", options: baiOptions },
      // 6. Magnification / Minimization
      { id: "cd-6-1", text: "I blow small problems way out of proportion", options: baiOptions },
      { id: "cd-6-2", text: "I downplay my own strengths and achievements", options: baiOptions },
      { id: "cd-6-3", text: "When something goes wrong, it feels like a catastrophe", options: baiOptions },
      // 7. Emotional Reasoning
      { id: "cd-7-1", text: "I believe my feelings are facts — if I feel it, it must be true", options: baiOptions },
      { id: "cd-7-2", text: "I trust my negative emotions as accurate guides to reality", options: baiOptions },
      { id: "cd-7-3", text: "If I feel inadequate, I assume I actually am inadequate", options: baiOptions },
      // 8. Should Statements
      { id: "cd-8-1", text: "I often tell myself I 'should' do more or be better", options: baiOptions },
      { id: "cd-8-2", text: "I criticize myself with 'shoulds', 'musts', and 'ought-tos'", options: baiOptions },
      { id: "cd-8-3", text: "I feel guilty when I don't meet my own impossible standards", options: baiOptions },
      // 9. Labeling
      { id: "cd-9-1", text: "When I make a mistake, I call myself harsh names", options: baiOptions },
      { id: "cd-9-2", text: "I define myself by my flaws rather than describing specific behaviors", options: baiOptions },
      { id: "cd-9-3", text: "I label other people based on a single action of theirs", options: baiOptions },
      // 10. Personalization
      { id: "cd-10-1", text: "I blame myself for things that aren't really my fault", options: baiOptions },
      { id: "cd-10-2", text: "I feel responsible for other people's feelings or reactions", options: baiOptions },
      { id: "cd-10-3", text: "I take things personally even when they're not about me", options: baiOptions },
    ],
  },
];

const onboardingStories = [
  {
    title: "Welcome to Moodly",
    content: "Track your mental health daily. Log your mood, sleep, anxiety, and more in just a few taps.",
    order: 1,
  },
  {
    title: "Take Tests",
    content: "Complete psychological assessments to understand your state better and get personalized recommendations.",
    order: 2,
  },
  {
    title: "Generate Reports",
    content: "Export your data as PDF or CSV to share with your healthcare provider.",
    order: 3,
  },
];

async function seed() {
  await prisma.testResult.deleteMany();
  await prisma.report.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.breathingSession.deleteMany();
  await prisma.creatureState.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.resetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.test.deleteMany();
  await prisma.parameter.deleteMany();
  await prisma.onboardingStory.deleteMany();

  for (const p of parameters) {
    await prisma.parameter.create({ data: p });
  }

  for (const t of tests) {
    await prisma.test.create({ data: t as never });
  }

  for (const s of onboardingStories) {
    await prisma.onboardingStory.create({ data: s });
  }

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

  const phq9 = allTests.find((t) => t.title === "PHQ-9")!;
  const gad7 = allTests.find((t) => t.title === "GAD-7")!;
  const bai = allTests.find((t) => t.title === "Burns Anxiety Inventory")!;
  const bdc = allTests.find((t) => t.title === "Burns Depression Checklist")!;
  const cd = allTests.find((t) => t.title === "Cognitive Distortions Assessment")!;

  const paramMap = new Map(allParams.map((p) => [p.name, p.id]));

  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;

  // ─── Entries: 14 days, 5 parameters, realistic daily values ───
  const dailyValues: Record<string, number[]> = {
    Anxiety: [7, 6, 8, 5, 4, 6, 3, 5, 7, 6, 4, 3, 5, 4],
    Sleep:   [4, 5, 3, 6, 7, 5, 8, 6, 4, 5, 7, 8, 6, 7],
    Mood:    [5, 4, 3, 6, 5, 7, 8, 6, 4, 5, 7, 8, 6, 7],
    Energy:  [3, 4, 2, 5, 6, 4, 7, 5, 3, 4, 6, 7, 5, 6],
    Focus:   [4, 3, 2, 5, 4, 6, 7, 5, 3, 4, 6, 5, 7, 6],
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

  // ─── Creature State: initial value for demo user ───
  await prisma.creatureState.upsert({
    where: { userId: demoUser.id },
    create: { userId: demoUser.id, calmness: 45, lastExerciseAt: null },
    update: {},
  });

  // ─── Test Results: multiple per test to show timeline ───
  await prisma.testResult.createMany({
    data: [
      // GAD-7: decreasing anxiety over 2 weeks
      { testId: gad7.id, userId: demoUser.id, score: 15, interpretation: "Moderate anxiety", recommendation: "Consider consulting a therapist.", completedAt: new Date(now.getTime() - 14 * DAY) },
      { testId: gad7.id, userId: demoUser.id, score: 13, interpretation: "Moderate anxiety", recommendation: "Consider consulting a therapist.", completedAt: new Date(now.getTime() - 10 * DAY) },
      { testId: gad7.id, userId: demoUser.id, score: 10, interpretation: "Mild anxiety", recommendation: "Monitor symptoms. Self-help techniques may help.", completedAt: new Date(now.getTime() - 5 * DAY) },
      { testId: gad7.id, userId: demoUser.id, score: 8, interpretation: "Mild anxiety", recommendation: "Continue self-care practices.", completedAt: new Date(now.getTime() - 1 * DAY) },

      // PHQ-9: moderate → mild depression
      { testId: phq9.id, userId: demoUser.id, score: 17, interpretation: "Moderately severe depression", recommendation: "Consider consulting a therapist. Pharmacotherapy may be beneficial.", completedAt: new Date(now.getTime() - 14 * DAY) },
      { testId: phq9.id, userId: demoUser.id, score: 14, interpretation: "Moderate depression", recommendation: "Consider therapy. Monitor symptoms closely.", completedAt: new Date(now.getTime() - 9 * DAY) },
      { testId: phq9.id, userId: demoUser.id, score: 11, interpretation: "Moderate depression", recommendation: "Consider therapy. Monitor symptoms closely.", completedAt: new Date(now.getTime() - 4 * DAY) },
      { testId: phq9.id, userId: demoUser.id, score: 8, interpretation: "Mild depression", recommendation: "Monitor symptoms. Consider self-help techniques.", completedAt: new Date(now.getTime() - 1 * DAY) },

      // BAI: mild decreasing
      { testId: bai.id, userId: demoUser.id, score: 26, interpretation: "Mild anxiety", recommendation: "Consider self-help techniques.", completedAt: new Date(now.getTime() - 12 * DAY) },
      { testId: bai.id, userId: demoUser.id, score: 22, interpretation: "Mild anxiety", recommendation: "Practice the Triple Column Technique: write the anxious thought, name the distortion, then craft a rational response. Breathing exercises can help in the moment.", completedAt: new Date(now.getTime() - 7 * DAY) },
      { testId: bai.id, userId: demoUser.id, score: 18, interpretation: "Mild anxiety", recommendation: "Continue self-care practices.", completedAt: new Date(now.getTime() - 2 * DAY) },

      // BDC: moderate → mild depression
      { testId: bdc.id, userId: demoUser.id, score: 36, interpretation: "Moderate depression", recommendation: "Consider consulting a therapist.", completedAt: new Date(now.getTime() - 13 * DAY) },
      { testId: bdc.id, userId: demoUser.id, score: 32, interpretation: "Moderate depression", recommendation: "Consider consulting a therapist.", completedAt: new Date(now.getTime() - 8 * DAY) },
      { testId: bdc.id, userId: demoUser.id, score: 28, interpretation: "Mild depression", recommendation: "Use the Triple Column Technique and the Double Standard method: would you say this to a friend? Consider therapy if it persists.", completedAt: new Date(now.getTime() - 3 * DAY) },

      // CD: first baseline, then current with improvement
      { testId: cd.id, userId: demoUser.id, score: 58, interpretation: "Moderate cognitive distortions. All-or-Nothing Thinking and Should Statements are most prominent.", recommendation: "Your results indicate several cognitive distortions. CBT is highly effective.", flags: {
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
        completedAt: new Date(now.getTime() - 14 * DAY) },
      { testId: cd.id, userId: demoUser.id, score: 45, interpretation: "Significant All-or-Nothing Thinking, Discounting the Positive, Should Statements. Moderate Overgeneralization, Mental Filter, Jumping to Conclusions, Personalization.", recommendation: "Your results indicate several strongly held cognitive distortions. CBT is highly effective.", flags: {
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
          moderateKeys: ["overgeneralization", "mentalFilter", "jumpingToConclusions", "personalization"],
        },
        completedAt: new Date(now.getTime() - 1 * DAY) },
    ],
  });

  console.log("Seed completed");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
