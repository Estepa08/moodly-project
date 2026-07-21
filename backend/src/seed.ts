import { prisma } from "./lib/prisma.js";

const parameters = [
  { name: "Anxiety", description: "Overall anxiety level", unit: "/10" },
  { name: "Sleep", description: "Sleep quality", unit: "/10" },
  { name: "Mood", description: "General mood", unit: "/10" },
  { name: "Energy", description: "Energy level", unit: "/10" },
  { name: "Focus", description: "Ability to concentrate", unit: "/10" },
];

const tests = [
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
  for (const p of parameters) {
    await prisma.parameter.create({ data: p });
  }

  for (const t of tests) {
    await prisma.test.create({ data: t as never });
  }

  for (const s of onboardingStories) {
    await prisma.onboardingStory.create({ data: s });
  }

  console.log("Seed completed");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
