import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp();
  const result = await registerAndLogin(app, "creature-test@example.com", "secret123", "Creature");
  token = result.token;
});

afterAll(async () => {
  await app.close();
});

describe("Creature pets", () => {
  it("GET /creature/pets — returns default starter collection", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/creature/pets",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      unlockedPetTypes: ["puff"],
      activePetType: "puff",
      petName: null,
    });
  });

  it("PATCH /creature/pet — unlocks a starter pet and sets the name", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${token}` },
      payload: { petType: "sloth", petName: "Ленивец" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      unlockedPetTypes: ["puff", "sloth"],
      activePetType: "sloth",
      petName: "Ленивец",
    });
  });

  it("PATCH /creature/pet — name only update keeps the pet type", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${token}` },
      payload: { petName: "Дружок" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ activePetType: "sloth", petName: "Дружок" });
  });

  it("PATCH /creature/pet — rejects a non-starter locked pet", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${token}` },
      payload: { petType: "giraffe" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("PATCH /creature/pet — empty petType and no petName is rejected", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("GET /creature — state includes petName", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/creature",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().petName).toBe("Дружок");
  });
});
