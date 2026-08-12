import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp, registerAndLogin } from '../../test/helpers.js';
import { prisma } from '../../lib/prisma.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

async function makeAdmin(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { role: 'admin' } });
}

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe('Admin', () => {
  it('GET /admin/users — rejects missing token', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/users' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /admin/users — rejects non-admin user', async () => {
    const { token } = await registerAndLogin(app, 'admin-regular@example.com', 'secret123');
    const res = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('GET /admin/users — returns users for admin', async () => {
    const { token, userId } = await registerAndLogin(app, 'admin-list@example.com', 'secret123');
    await makeAdmin(userId);
    await registerAndLogin(app, 'admin-target@example.com', 'secret123');

    const res = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const users = res.json();
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.some((u: { email: string }) => u.email === 'admin-target@example.com')).toBe(true);
    expect(users.some((u: { email: string }) => u.email === 'admin-list@example.com')).toBe(true);
    expect(users[0]).not.toHaveProperty('password');
    expect(users[0]).not.toHaveProperty('_count');
    expect(users[0]).toHaveProperty('entriesCount');
  });

  it('DELETE /admin/users/:id — deletes user', async () => {
    const { token, userId } = await registerAndLogin(app, 'admin-delete@example.com', 'secret123');
    await makeAdmin(userId);
    const { userId: targetId } = await registerAndLogin(
      app,
      'admin-delete-target@example.com',
      'secret123',
    );

    const res = await app.inject({
      method: 'DELETE',
      url: `/admin/users/${targetId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);

    const remaining = await prisma.user.findUnique({ where: { id: targetId } });
    expect(remaining).toBeNull();
  });

  it('DELETE /admin/users/:id — rejects deleting yourself', async () => {
    const { token, userId } = await registerAndLogin(app, 'admin-self@example.com', 'secret123');
    await makeAdmin(userId);

    const res = await app.inject({
      method: 'DELETE',
      url: `/admin/users/${userId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE /admin/users/:id — returns 404 for unknown user', async () => {
    const { token, userId } = await registerAndLogin(app, 'admin-404@example.com', 'secret123');
    await makeAdmin(userId);

    const res = await app.inject({
      method: 'DELETE',
      url: '/admin/users/nonexistent-id',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /admin/feedback — rejects missing token', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/feedback' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /admin/feedback — rejects non-admin user', async () => {
    const { token } = await registerAndLogin(app, 'admin-fb-regular@example.com', 'secret123');
    const res = await app.inject({
      method: 'GET',
      url: '/admin/feedback',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('GET /admin/feedback — returns feedback with author email for admin', async () => {
    const { token, userId } = await registerAndLogin(
      app,
      'admin-fb-admin@example.com',
      'secret123',
    );
    await makeAdmin(userId);
    const { token: userToken } = await registerAndLogin(
      app,
      'admin-fb-user@example.com',
      'secret123',
    );

    await app.inject({
      method: 'POST',
      url: '/feedback',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { rating: 5, message: 'First feedback' },
    });
    await app.inject({
      method: 'POST',
      url: '/feedback',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { rating: 4, message: 'Second feedback' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/admin/feedback',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Number(res.headers['x-total-count'])).toBeGreaterThanOrEqual(1);

    const items = res.json() as Array<{
      rating: number;
      message: string;
      user: { email: string };
      userId?: string;
    }>;
    const ours = items.filter(
      (f) => f.message === 'First feedback' || f.message === 'Second feedback',
    );
    expect(ours).toHaveLength(1);
    expect(ours[0].message).toBe('Second feedback');
    expect(ours[0].rating).toBe(4);
    expect(ours[0].user.email).toBe('admin-fb-user@example.com');
    expect(ours[0]).not.toHaveProperty('userId');
  });
});
