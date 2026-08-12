import { prisma } from '../lib/prisma.js';

function dbHost(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return 'не задан (нужен DATABASE_URL)';
  try {
    return new URL(url).host;
  } catch {
    return url.split('@').pop() ?? url;
  }
}

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      email: true,
      name: true,
      createdAt: true,
      emailVerified: true,
      ageConfirmed: true,
      _count: {
        select: {
          entries: true,
          testResults: true,
          breathingSessions: true,
          cbaEntries: true,
        },
      },
    },
  });

  console.log(`Хост БД: ${dbHost()}`);
  console.log(`Всего пользователей: ${users.length}`);
  console.log('');

  console.table(
    users.map((u) => ({
      email: u.email,
      имя: u.name ?? '',
      зарегистрирован: u.createdAt.toISOString(),
      'email подтверждён': u.emailVerified ? 'да' : 'нет',
      '18+': u.ageConfirmed ? 'да' : 'нет',
      записей: u._count.entries,
      тестов: u._count.testResults,
      дыхание: u._count.breathingSessions,
      КПТ: u._count.cbaEntries,
    })),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
