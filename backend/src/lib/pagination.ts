import type { FastifyReply } from 'fastify';

export interface PaginationQuery {
  skip?: string;
  take?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
}

export function parsePagination(query: PaginationQuery): { skip?: number; take?: number } {
  return {
    skip: query.skip ? parseInt(query.skip, 10) : undefined,
    take: query.take ? parseInt(query.take, 10) : undefined,
  };
}

// Общая форма ответа для списочных роутов: X-Total-Count в заголовке + тело
// без обёртки — совпадает с тем, что уже ожидает фронтенд.
export function sendPaginated<T>(reply: FastifyReply, result: Paginated<T>): T[] {
  reply.header('X-Total-Count', result.total);
  return result.data;
}
