import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp, registerAndLogin } from '../../test/helpers.js';
import { prisma } from '../../lib/prisma.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe('Push notifications', () => {
  it('POST /push/subscribe — rejects missing token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/push/subscribe',
      payload: {
        endpoint: 'https://example.com/endpoint',
        keys: { p256dh: 'test-p256', auth: 'test-auth' },
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /push/subscribe — persists subscription and is idempotent', async () => {
    const { token, userId } = await registerAndLogin(app, 'push-sub@example.com', 'secret123');
    const endpoint = `https://example.com/${Date.now()}`;

    const first = await app.inject({
      method: 'POST',
      url: '/push/subscribe',
      headers: { authorization: `Bearer ${token}` },
      payload: { endpoint, keys: { p256dh: 'test-p256', auth: 'test-auth' } },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({ ok: true });

    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    expect(subs).toHaveLength(1);
    expect(subs[0].endpoint).toBe(endpoint);

    // Повторная подписка по тому же endpoint не создаёт дубликат.
    const second = await app.inject({
      method: 'POST',
      url: '/push/subscribe',
      headers: { authorization: `Bearer ${token}` },
      payload: { endpoint, keys: { p256dh: 'test-p256', auth: 'test-auth' } },
    });
    expect(second.statusCode).toBe(200);
    expect(await prisma.pushSubscription.count({ where: { userId } })).toBe(1);
  });

  it("POST /push/unsubscribe — removes user's subscription", async () => {
    const { token, userId } = await registerAndLogin(app, 'push-unsub@example.com', 'secret123');
    const endpoint = `https://example.com/${Date.now()}`;

    await app.inject({
      method: 'POST',
      url: '/push/subscribe',
      headers: { authorization: `Bearer ${token}` },
      payload: { endpoint, keys: { p256dh: 'k', auth: 'a' } },
    });
    expect(await prisma.pushSubscription.count({ where: { userId } })).toBe(1);

    const res = await app.inject({
      method: 'POST',
      url: '/push/unsubscribe',
      headers: { authorization: `Bearer ${token}` },
      payload: { endpoint },
    });
    expect(res.statusCode).toBe(200);
    expect(await prisma.pushSubscription.count({ where: { userId } })).toBe(0);
  });

  it('POST /push/send — rejects missing token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/push/send',
      payload: { title: 'T', body: 'B' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /push/send — rejects non-admin user', async () => {
    const { token } = await registerAndLogin(app, 'push-send-user@example.com', 'secret123');
    const res = await app.inject({
      method: 'POST',
      url: '/push/send',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'T', body: 'B' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('POST /push/send — rejects invalid payload', async () => {
    const { token, userId } = await registerAndLogin(
      app,
      'push-send-admin@example.com',
      'secret123',
    );
    await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } });

    const res = await app.inject({
      method: 'POST',
      url: '/push/send',
      headers: { authorization: `Bearer ${token}` },
      payload: { body: 'B' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /push/send — admin broadcasts to all, returns sent count', async () => {
    const { token, userId } = await registerAndLogin(
      app,
      'push-send-admin2@example.com',
      'secret123',
    );
    await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } });

    // Без подписок рассылка вернёт 0 (web-push не вызывается на сеть).
    const res = await app.inject({
      method: 'POST',
      url: '/push/send',
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Hello', body: 'Test body', url: '/my-day' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, sent: 0 });
  });
});
