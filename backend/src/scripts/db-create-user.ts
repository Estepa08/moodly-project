import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { dbHost, parseArgs } from './cli-helpers.js';

async function main() {
  const { values, flags } = parseArgs(process.argv.slice(2));
  const email = values.get('--email');
  const password = values.get('--password');
  const admin = flags.has('--admin');
  const targetEmail = (email ?? '').trim().toLowerCase();

  if (!targetEmail || !password) {
    console.error(
      'Использование: db-create-user.ts --email=user@example.com --password=... [--admin]',
    );
    process.exitCode = 1;
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const role = admin ? 'admin' : 'user';
  const existing = await prisma.user.findUnique({ where: { email: targetEmail } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed, role, emailVerified: true },
    });
    console.log(`Пользователь ${updated.email} обновлён`);
    console.log(`  роль: ${updated.role}`);
    console.log(`  email подтверждён: да`);
  } else {
    const created = await prisma.user.create({
      data: {
        email: targetEmail,
        password: hashed,
        role,
        emailVerified: true,
        ageConfirmed: true,
      },
    });
    console.log(`Пользователь ${created.email} создан`);
    console.log(`  роль: ${created.role}`);
    console.log(`  email подтверждён: да`);
  }
  console.log(`Хост БД: ${dbHost()}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
