import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

function dbHost(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "не задан (нужен DATABASE_URL)";
  try {
    return new URL(url).host;
  } catch {
    return url.split("@").pop() ?? url;
  }
}

function parseArgs(argv: string[]): { email?: string; password?: string; admin: boolean } {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  for (const a of argv) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) {
        flags.add(a);
      } else {
        values.set(a.slice(0, eq), a.slice(eq + 1));
      }
    }
  }
  return {
    email: values.get("--email"),
    password: values.get("--password"),
    admin: flags.has("--admin"),
  };
}

async function main() {
  const { email, password, admin } = parseArgs(process.argv.slice(2));
  const targetEmail = (email ?? "").trim().toLowerCase();

  if (!targetEmail || !password) {
    console.error("Использование: db-create-user.ts --email=user@example.com --password=... [--admin]");
    process.exitCode = 1;
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const role = admin ? "admin" : "user";
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
