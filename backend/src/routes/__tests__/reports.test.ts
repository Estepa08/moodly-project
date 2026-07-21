import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
let reportId: string;
let userId: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();

  const param = await prisma.parameter.create({ data: { name: "Mood", unit: "/10" } });

  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "reports-test@example.com", password: "secret123" },
  });
  token = reg.json().accessToken;
  userId = reg.json().user.id;

  await prisma.entry.create({
    data: { userId, parameterId: param.id, value: 8, createdAt: new Date("2026-01-15") },
  });

  await prisma.entry.create({
    data: { userId, parameterId: param.id, value: 6, createdAt: new Date("2026-01-20") },
  });
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("Reports", () => {
  it("POST /reports — creates a report", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/reports",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        format: "csv",
        periodFrom: "2026-01-01T00:00:00Z",
        periodTo: "2026-02-01T00:00:00Z",
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("pending");
    reportId = res.json().id;
  });

  it("GET /reports — lists reports", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/reports",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it("GET /reports/:id — returns single report", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/reports/${reportId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().format).toBe("csv");
  });

  it("DELETE /reports/:id — deletes report", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/reports/${reportId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });
});
