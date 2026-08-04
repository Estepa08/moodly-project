import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import clientErrorRoutes from "../client-errors.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = Fastify({ logger: false });
  await app.register(rateLimit, { max: 1000, timeWindow: "1 minute" });
  await app.register(clientErrorRoutes);
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("POST /client-errors", () => {
  it("accepts a valid error payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/client-errors",
      payload: {
        message: "ReferenceError: foo is not defined",
        source: "https://mymoodly.ru/assets/index-abc.js",
        lineno: 12,
        colno: 3,
        stack: "ReferenceError: foo is not defined\n    at App (https://mymoodly.ru/...)",
        url: "https://mymoodly.ru/dashboard",
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("rejects an empty message", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/client-errors",
      payload: { message: "" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a non-object body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/client-errors",
      headers: { "content-type": "application/json" },
      payload: [],
    });
    expect(res.statusCode).toBe(400);
  });
});
