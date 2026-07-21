import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
let parameterId: string;
let entryId: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();

  const param = await prisma.parameter.create({ data: { name: "Energy", unit: "/10" } });
  parameterId = param.id;

  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "entries-test@example.com", password: "secret123" },
  });
  token = reg.json().accessToken;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("Entries", () => {
  it("POST /entries — creates an entry", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/entries",
      headers: { authorization: `Bearer ${token}` },
      payload: { parameterId, value: 7, note: "Feeling great" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().value).toBe(7);
    entryId = res.json().id;
  });

  it("GET /entries — lists user entries", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/entries",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json().length).toBeGreaterThanOrEqual(1);
  });

  it("GET /entries/:id — returns single entry", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/entries/${entryId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().value).toBe(7);
  });

  it("PATCH /entries/:id — updates entry", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/entries/${entryId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { value: 8 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().value).toBe(8);
  });

  it("DELETE /entries/:id — deletes entry", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/entries/${entryId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });
});
