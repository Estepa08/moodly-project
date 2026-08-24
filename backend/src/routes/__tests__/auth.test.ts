import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { buildApp, registerAndLogin } from '../../test/helpers.js';
import { prisma } from '../../lib/prisma.js';
import { authService } from '../../services/auth.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

const E2E_KEYS = {
  wrappedKey: 'dGVzdC13cmFwcGVkLWtleQ==',
  keySalt: 'dGVzdC1zYWx0',
  recoveryWrappedKey: 'dGVzdC1yZWNvdmVyeQ==',
  recoverySalt: 'dGVzdC1yZWNvdmVyeS1zYWx0',
};

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe('Auth', () => {
  it('POST /auth/register — creates user and returns accessToken', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'secret123',
        name: 'Test',
        ageConfirmed: true,
        pdpConsent: true,
        birthYear: 1998,
        ...E2E_KEYS,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('accessToken');
    expect(body.user.email).toBe('test@example.com');
  });

  it('POST /auth/register — rejects without pdp consent', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'noconsent@example.com',
        password: 'secret123',
        ageConfirmed: true,
        pdpConsent: false,
        ...E2E_KEYS,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('PDP_CONSENT_REQUIRED');
  });

  it('POST /auth/register — rejects users under 18 by birth year', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'minor@example.com',
        password: 'secret123',
        ageConfirmed: true,
        pdpConsent: true,
        birthYear: 2010,
        ...E2E_KEYS,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('AGE_REQUIRED');
  });

  it('POST /auth/register — rejects duplicate email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        password: 'secret123',
        ageConfirmed: true,
        pdpConsent: true,
        ...E2E_KEYS,
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('POST /auth/login — returns token for valid credentials', async () => {
    const { token } = await registerAndLogin(app, 'login-test@example.com', 'secret123');
    expect(token).toBeDefined();
  });

  it('POST /auth/login — rejects wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'login-test@example.com', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /auth/logout — accepts valid token', async () => {
    const { token } = await registerAndLogin(app, 'logout-test@example.com', 'secret123');
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('GET /users/me — rejects missing token', async () => {
    const res = await app.inject({ method: 'GET', url: '/users/me' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /auth/refresh — parallel refresh with one token returns no 500', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'refresh-race@example.com',
        password: 'secret123',
        ageConfirmed: true,
        pdpConsent: true,
        ...E2E_KEYS,
      },
    });
    expect(reg.statusCode).toBe(200);

    const setCookie = reg.headers['set-cookie'] as string | undefined;
    expect(setCookie).toBeDefined();
    const cookie = setCookie!.split(';')[0];

    const [a, b] = await Promise.all([
      app.inject({ method: 'POST', url: '/auth/refresh', headers: { cookie } }),
      app.inject({ method: 'POST', url: '/auth/refresh', headers: { cookie } }),
    ]);

    const codes = [a.statusCode, b.statusCode].sort((x, y) => x - y);
    expect(codes[0]).toBe(200);
    expect(codes[1]).toBe(401);
    expect(codes).not.toContain(500);
  });
});

describe('Auth /auth/reset-password', () => {
  it('returns userId alongside accessToken — the frontend needs it to re-arm the E2E decryption context', async () => {
    // Regression test: the response used to omit userId, so
    // setSessionUserId() never got called after a reset and every entry
    // decrypt failed with "Data key context is not initialized" — the
    // user's whole history appeared to vanish even with the right password.
    const email = `reset-userid-${Date.now()}@example.com`;
    const { userId } = await registerAndLogin(app, email);

    const rawToken = await authService.createResetToken(userId);
    const res = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: {
        token: rawToken,
        password: 'newSecret123',
        wrappedKey: 'bmV3LXdyYXBwZWQta2V5',
        keySalt: 'bmV3LXNhbHQ=',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('accessToken');
    expect(body.userId).toBe(userId);
  });
});

describe('Auth /auth/set-keys — legacy account migration', () => {
  const email = `legacy-${Date.now()}@example.com`;
  const password = 'secret123';

  async function createLegacyUser(): Promise<{ id: string; token: string }> {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, emailVerified: true, ageConfirmed: true },
    });
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    return { id: user.id, token: login.json().accessToken };
  }

  it('login for a legacy user returns no keys, then set-keys works once and rejects re-set', async () => {
    const legacy = await createLegacyUser();

    const loginRes = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.json().wrappedKey).toBeNull();
    expect(loginRes.json().keySalt).toBeNull();

    const setRes = await app.inject({
      method: 'POST',
      url: '/auth/set-keys',
      headers: { authorization: `Bearer ${legacy.token}` },
      payload: E2E_KEYS,
    });
    expect(setRes.statusCode).toBe(200);
    expect(setRes.json()).toEqual({ ok: true });

    const setAgain = await app.inject({
      method: 'POST',
      url: '/auth/set-keys',
      headers: { authorization: `Bearer ${legacy.token}` },
      payload: E2E_KEYS,
    });
    expect(setAgain.statusCode).toBe(409);
    expect(setAgain.json().code).toBe('KEYS_ALREADY_SET');

    const loginAfter = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(loginAfter.json().wrappedKey).toBe(E2E_KEYS.wrappedKey);

    await prisma.user.delete({ where: { id: legacy.id } });
  });

  it('rejects set-keys without auth token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/set-keys',
      payload: E2E_KEYS,
    });
    expect(res.statusCode).toBe(401);
  });
});
