import { PrismaClient } from '@prisma/client';

const testDbUrl =
  process.env.TEST_DATABASE_URL ??
  (process.env.DATABASE_URL?.includes('moodly_test')
    ? process.env.DATABASE_URL
    : 'postgresql://evgeniystepanov@localhost:5432/moodly_test');

process.env.DATABASE_URL = testDbUrl;
process.env.DIRECT_URL = process.env.DIRECT_URL ?? testDbUrl;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

// Схему больше не пересоздаём тут (это была `prisma db push --force-reset` на
// каждый тестовый файл) — она должна существовать заранее через
// `npm run db:test:reset` (вручную или в CI перед прогоном тестов). Здесь
// только чистим данные между файлами через TRUNCATE — обычный SQL-запрос
// через Prisma Client, а не CLI-команда Prisma Migrate.
beforeAll(async () => {
  const client = new PrismaClient();
  try {
    const tables = await client.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
    `;
    if (tables.length === 0) {
      throw new Error(
        `Тестовая БД (${testDbUrl}) пуста — сначала запусти "npm run db:test:reset" в backend/.`,
      );
    }
    const names = tables.map((t) => `"${t.tablename}"`).join(', ');
    await client.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
  } finally {
    await client.$disconnect();
  }
});
