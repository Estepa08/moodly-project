import { NotFoundError } from './errors.js';

interface OwnedDeleteDelegate {
  deleteMany(args: { where: { id: string; userId: string } }): Promise<{ count: number }>;
}

// deleteMany с проверкой владения (id + userId) вместо findFirst+delete —
// не даёт удалить чужую запись по id, зная лишь его. Бросает NotFoundError,
// если ничего не удалилось (либо запись не существует, либо принадлежит
// другому пользователю — с точки зрения клиента разницы нет).
export async function deleteOwned(
  delegate: OwnedDeleteDelegate,
  id: string,
  userId: string,
  entityName: string,
): Promise<void> {
  const { count } = await delegate.deleteMany({ where: { id, userId } });
  if (count === 0) throw new NotFoundError(entityName);
}
