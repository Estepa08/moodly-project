import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
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

function parseArgs(argv: string[]): { email?: string; yes: boolean } {
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
  return { email: values.get("--email"), yes: flags.has("--yes") };
}

async function main() {
  const { email, yes } = parseArgs(process.argv.slice(2));
  const targetEmail = (email ?? "").trim().toLowerCase();

  if (!targetEmail) {
    console.error("Использование: db-prod-user-delete.ts --email=user@example.com --yes");
    console.error("  --yes  обязательно, флаг подтверждения");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!user) {
    console.error(`Пользователь с email ${targetEmail} не найден`);
    process.exitCode = 1;
    return;
  }

  const counts = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      _count: {
        select: {
          entries: true,
          testResults: true,
          breathingSessions: true,
          cbaEntries: true,
          feedback: true,
          reports: true,
        },
      },
    },
  });

  console.log(`Хост БД: ${dbHost()}`);
  console.log("");
  console.log("Пользователь к удалению:");
  console.log(`  email:             ${user.email}`);
  console.log(`  имя:               ${user.name ?? "-"}`);
  console.log(`  зарегистрирован:   ${user.createdAt.toISOString()}`);
  console.log(`  email подтверждён: ${user.emailVerified ? "да" : "нет"}`);
  console.log(`  18+:               ${user.ageConfirmed ? "да" : "нет"}`);
  console.log(`  связанных записей: ${counts?._count.entries}`);
  console.log(`  результатов тестов: ${counts?._count.testResults}`);
  console.log("");
  console.log("Удаление необратимо: будут удалены все данные пользователя (каскадно).");
  console.log("");

  if (!yes) {
    console.error("Требуется флаг --yes (например: --email=user@example.com --yes)");
    process.exitCode = 1;
    return;
  }

  const rl = createInterface({ input, output });
  const confirm = (await rl.question("Повторите email для подтверждения удаления: "))
    .trim()
    .toLowerCase();
  rl.close();

  if (confirm !== user.email.toLowerCase()) {
    console.error("Email не совпадает. Удаление отменено.");
    process.exitCode = 1;
    return;
  }

  const deleted = await prisma.user.delete({ where: { id: user.id } });
  console.log(`Пользователь ${deleted.email} удалён.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
