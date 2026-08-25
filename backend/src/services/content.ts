import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';

export type MessageType = 'morning' | 'day' | 'evening';

// string[], а не MessageType[]: используется и там, где значение ещё не
// сужено до MessageType (роут проверяет сырую query-строку).
export const MESSAGE_TYPES: string[] = ['morning', 'day', 'evening'];
export const LOCALES: string[] = ['ru', 'en'];

export interface MessageInput {
  type: MessageType;
  locale: string;
  text: string;
  question?: string | null;
  isActive?: boolean;
  order?: number;
}

function isValidType(type: string): type is MessageType {
  return MESSAGE_TYPES.includes(type as MessageType);
}

export const contentService = {
  async list(params: { type?: string; locale?: string; activeOnly?: boolean } = {}) {
    const where: Record<string, unknown> = {};
    if (params.type && isValidType(params.type)) where.type = params.type;
    if (params.locale && LOCALES.includes(params.locale)) where.locale = params.locale;
    if (params.activeOnly) where.isActive = true;

    return prisma.motivationMessage.findMany({
      where,
      orderBy: [{ type: 'asc' }, { locale: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async create(input: MessageInput) {
    return prisma.motivationMessage.create({
      data: {
        type: input.type,
        locale: input.locale,
        text: input.text,
        question: input.question ?? null,
        isActive: input.isActive ?? true,
        order: input.order ?? 0,
      },
    });
  },

  async update(id: string, input: Partial<MessageInput>) {
    const existing = await prisma.motivationMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('MotivationMessage');

    const data: Record<string, unknown> = {};
    if (input.type !== undefined && isValidType(input.type)) data.type = input.type;
    if (input.locale !== undefined && LOCALES.includes(input.locale)) data.locale = input.locale;
    if (input.text !== undefined) data.text = input.text;
    if (input.question !== undefined) data.question = input.question;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.order !== undefined) data.order = input.order;

    return prisma.motivationMessage.update({ where: { id }, data });
  },

  async remove(id: string) {
    const existing = await prisma.motivationMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('MotivationMessage');
    await prisma.motivationMessage.delete({ where: { id } });
  },

  /**
   * «Пожелание дня»: детерминированная ротация по дате и userId — одно и то же
   * сообщение в течение суток у конкретного пользователя, ежедневно меняется.
   */
  async messageOfDay(type: MessageType, locale: string, userId: string) {
    if (!isValidType(type) || !LOCALES.includes(locale)) return null;

    const messages = await prisma.motivationMessage.findMany({
      where: { type, locale, isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    if (messages.length === 0) return null;

    const dayNumber = Math.floor(Date.now() / 86_400_000);
    const hash = Array.from(userId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const index = (dayNumber + hash) % messages.length;
    return messages[index];
  },
};
