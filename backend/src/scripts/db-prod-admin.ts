import { prisma } from '../lib/prisma.js';
import { dbHost, parseArgs } from './cli-helpers.js';

async function main() {
  const email = parseArgs(process.argv.slice(2)).values.get('--email')?.trim().toLowerCase();
  if (!email) {
    console.error('Использование: db-prod-admin.ts --email=user@example.com');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Пользователь с email ${email} не найден`);
    process.exitCode = 1;
    return;
  }

  if (user.role === 'admin') {
    console.log(`Пользователь ${user.email} уже является админом`);
    return;
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });
  console.log(`Пользователь ${updated.email} (${updated.name ?? '-'}) назначен админом`);
  console.log(`Хост БД: ${dbHost()}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
