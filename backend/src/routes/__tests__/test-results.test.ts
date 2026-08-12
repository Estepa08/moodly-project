import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp, registerAndLogin } from '../../test/helpers.js';
import { PrismaClient } from '@prisma/client';
import { uuidv7 } from '@moodly/shared';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;
let resultId: string;
let testId: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();

  const test = await prisma.test.create({
    data: {
      title: 'Тест настроения',
      questions: [
        {
          id: 'q1',
          text: 'Little interest in doing things?',
          options: [
            { id: 'q1a', text: 'Not at all', score: 0 },
            { id: 'q1b', text: 'Several days', score: 1 },
          ],
        },
      ],
    },
  });
  testId = test.id;

  const result = await registerAndLogin(app, 'results-test@example.com', 'secret123');
  token = result.token;

  // E2E: результат теста клиент считает и пушит зашифрованным через sync.
  resultId = uuidv7();
  const push = await app.inject({
    method: 'POST',
    url: '/sync/push',
    headers: { authorization: `Bearer ${token}` },
    payload: {
      actions: [
        {
          entity: 'testResult',
          action: 'upsert',
          id: resultId,
          occurredAt: new Date().toISOString(),
          payload: { testId: test.id, encryptedData: 'ENC:result1' },
        },
      ],
    },
  });
  expect(push.statusCode).toBe(200);
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('TestResults', () => {
  it('GET /test-results — lists user results', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test-results',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('GET /test-results/:id — returns single result', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/test-results/${resultId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().encryptedData).toBe('ENC:result1');
    expect(res.json().score).toBeNull();
  });
});
