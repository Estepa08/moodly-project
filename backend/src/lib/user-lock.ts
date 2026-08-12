import type { Prisma } from '@prisma/client';

type TxClient = Prisma.TransactionClient;

// Сериализует мутации, затрагивающие одного пользователя (entry-лимит,
// check-in, миссии, достижения). Блокировка строки User на время транзакции
// гарантирует, что check-then-act не даст двойного начисления при
// параллельных запросах (PostgreSQL row lock, READ COMMITTED).
export async function lockUser(tx: TxClient, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}
