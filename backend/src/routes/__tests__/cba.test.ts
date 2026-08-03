import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();

  await prisma.cbaExample.create({
    data: {
      persona: "Test persona",
      thoughtText: "Test thought",
      prosWeight: 30,
      consWeight: 70,
      order: 1,
      items: {
        create: [
          { itemType: "advantage", itemText: "Advantage 1" },
          { itemType: "disadvantage", itemText: "Disadvantage 1" },
        ],
      },
      distortions: { create: [{ distortionKey: "labeling" }] },
    },
  });
  await prisma.cbaCommonItem.create({
    data: {
      itemType: "advantage",
      itemText: "Common pro",
      category: "anxiety",
      itemKey: "anxiety.commonPro",
    },
  });

  const result = await registerAndLogin(app, "cba-test@example.com", "secret123");
  token = result.token;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("CBA", () => {
  it("GET /cba/examples — lists worked examples with items and distortions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/cba/examples",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].items.length).toBeGreaterThan(0);
    expect(body[0].distortions.length).toBeGreaterThan(0);
  });

  it("GET /cba/common-items — lists the common item bank", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/cba/common-items",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().length).toBeGreaterThan(0);
  });

  it("POST /cba/entries — rejects weights that don't sum to 100", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/cba/entries",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        thoughtText: "My thought",
        prosWeight: 40,
        consWeight: 40,
        items: [
          { itemType: "advantage", itemText: "Pro" },
          { itemType: "disadvantage", itemText: "Con" },
        ],
      },
    });
    expect(res.statusCode).toBe(400);
  });

  let entryId: string;

  it("POST /cba/entries — creates an entry", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/cba/entries",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        thoughtText: "My thought",
        prosWeight: 30,
        consWeight: 70,
        items: [
          { itemType: "advantage", itemText: "Pro" },
          { itemType: "disadvantage", itemText: "Con" },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().items.length).toBe(2);
    entryId = res.json().id;
  });

  it("GET /cba/entries — lists entries newest first", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/cba/entries",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().some((e: { id: string }) => e.id === entryId)).toBe(true);
  });

  it("DELETE /cba/entries/:id — deletes an entry", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/cba/entries/${entryId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });
});
